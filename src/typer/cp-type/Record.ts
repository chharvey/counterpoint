import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	type Local,
	type Builder,
	BinVect,
	TypeErrorNoEntry,
} from '../../index.ts';
import type {AST} from '../../validator/index.ts';
import type {EntryType} from '../utils-public.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {
	subtypeRules,
	type Type,
} from './Type.ts';
import {Union} from './Union.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing record literal types.
 * @final
 */
class TypeRecord extends ValueType {
	/**
	 * Construct a new TypeRecord from type properties, assuming each property is required.
	 * @param propertytypes the types of the record
	 * @return a new record type with the provided properties
	 */
	public static fromTypes(propertytypes: ReadonlyMap<bigint, Type> = new Map()): TypeRecord {
		return new TypeRecord(new Map<bigint, EntryType>([...propertytypes].map(([id, t]) => [id, {
			type:     t,
			optional: false,
		}])));
	}


	/**
	 * An index or list of indices corresponding to the tree structure of this type.
	 * @example
	 * [x= A, y= [w= B], z= [u= C, v= [t= D]]]                             => [A, B, C, D]                 => [x= 0, y= [1], z= [2, 3]]
	 * [p= A, r= [j= B, i= Bb], q= [k= C, l= [o= D, n= Dd], m= Cc], s= Aa] => [A, C, Dd, D, CC, Bb, B, Aa] => [p= 0, r= [5, 6], q= [1, 2, 3, 4], s= 7]
	 */
	#builtIndices?: ReadonlyMap<bigint, number | readonly number[]>;

	/**
	 * Construct a new TypeRecord object.
	 * @param typeargs a map of this type’s property ids along with their associated types
	 */
	public constructor(public readonly typeargs: ReadonlyMap<bigint, EntryType> = new Map()) {
		super(false, new Set([new VALUE.Record()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || [...this.typeargs.values()].some((t) => t.type.hasMutable);
	}

	/** The minimum possible number of properties in this record type. */
	public get minCount(): bigint {
		return BigInt([...this.typeargs.values()].filter((val) => !val.optional).length);
	}

	public override toString(): string {
		return `[${ [...this.typeargs].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') }]`;
	}

	@instanceOf(() => VALUE.Record)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	@instanceOf(() => TypeRecord)
	public override isSubtypeOf(t: Type): boolean {
		return (
			this.minCount >= (t as TypeRecord).minCount &&
			[...(t as TypeRecord).typeargs].every(([id, thattype]) => {
				const thistype: EntryType | undefined = this.typeargs.get(id);
				if (!thattype.optional) {
					/* NOTE: We *cannot* assert `thistype` exists and is not optional since properties are not ordered.
						We can however make the assertion in tuple types because of item ordering. */
					if (thistype?.optional !== false) {
						return false;
					}
				}
				return thistype?.type.isSubtypeOf(thattype.type) ?? true; // Covariance for records: `A <: B --> Record.<A> <: Record.<B>`.
			})
		);
	}

	public get(key: bigint, accessor: AST.ASTNodeKey): EntryType {
		return this.typeargs.has(key)
			? this.typeargs.get(key)!
			: assert.fail(new TypeErrorNoEntry('key', this, accessor));
	}

	public valueTypes(): Type {
		return Union.all([...this.typeargs.values()].map((t) => t.type));
	}

	#getBuiltIndices(key: bigint): number | readonly number[] {
		if (!this.#builtIndices) {
			let counter: number = 0;
			function walk(entries: ReadonlyMap<bigint, EntryType>): typeof indices {
				const indices = new Map<bigint, number | readonly number[]>();
				entries.forEach((entry, k) => {
					if (entry.type instanceof TypeRecord) {
						indices.set(k, [...walk(entry.type.typeargs)].map(([_, val]) => val).flat()); // only need to flatten once, due to recursion
						// throw new Error('Nested record access not yet supported.');
					} else {
						indices.set(k, counter);
						counter += 1;
					}
				});
				return indices;
			}
			this.#builtIndices = walk(this.typeargs);
		}
		return this.#builtIndices.get(key)!;
	}

	public buildAccess(builder: Builder, base_build: binaryen.ExpressionRef, accessor_key: bigint): binaryen.ExpressionRef {
		const builtIndex: number | readonly number[] = this.#getBuiltIndices(accessor_key);
		/*
		 * If the built index is a single number, return an extract of the build at that index.
		 * If the built index array has length 1, return a singleton tuple containing that extract.
		 * If the built index array length is > 1, return a tuple of extracts whose first entry is a `tee` and the rest are `get`s.
		 */
		if (typeof builtIndex === 'number') {
			return builder.module.tuple.extract(base_build, builtIndex);
		} else if (builtIndex.length === 1) {
			// Binaryen does not allow `module.tuple.make` to be called with only 1 argument,
			// so if there is only 1 item then we add an additional unused item.
			return builder.module.tuple.make([
				builder.module.tuple.extract(base_build, builtIndex[0]),
				new BinVect(builder.module).vect,
			]);
		} else {
			const expr_info = binaryen.getExpressionInfo(base_build);
			if (expr_info.id === binaryen.ExpressionIds.LocalGet) {
				return builder.module.tuple.make(builtIndex.map((n) => builder.module.tuple.extract(base_build, n)));
			}
			const local: Local = builder.addLocal(base_build)[1];
			return builder.module.tuple.make([
				                                  builder.module.tuple.extract(local.tee(), builtIndex[0]), // eslint-disable-line @stylistic/indent
				...builtIndex.slice(1).map((n) => builder.module.tuple.extract(local.get(), n)),
			]);
		}
	}

	public test_getBuiltIndices(expected: readonly (number | readonly number[])[], message?: string | Error): void {
		return assert.deepStrictEqual(
			[...this.typeargs.keys()].map((key) => this.#getBuiltIndices(key)),
			expected,
			message,
		);
	}
}
export {TypeRecord as Record};
