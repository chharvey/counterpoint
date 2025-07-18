import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	type Local,
	type Builder,
	BinVect,
	TypeErrorNoEntry,
} from '../../index.ts';
import type {AST} from '../../validator/index.ts';
import type {TypeEntry} from '../utils-public.ts';
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
 * Class for constructing tuple literal types.
 * @final
 */
class TypeTuple extends ValueType {
	/**
	 * Construct a new TypeTuple from type items, assuming each item is required.
	 * @param types the types of the tuple
	 * @return a new tuple type with the provided items
	 */
	public static fromTypes(types: readonly Type[] = []): TypeTuple {
		return new TypeTuple(types.map((t) => ({
			type:     t,
			optional: false,
		})));
	}


	/**
	 * An index or list of indices corresponding to the tree structure of this type.
	 * @example
	 * [A, [B], [C, [D]]]                 => [0, [1], [2, 3]]
	 * [A, [B, Bb], [C, [D, Dd], Cc], Aa] => [0, [1, 2], [3, 4, 5, 6], 7]
	 */
	#builtIndices?: readonly (number | readonly number[])[];

	/**
	 * Construct a new TypeTuple object.
	 * @param invariants this type’s item types
	 */
	public constructor(public readonly invariants: readonly TypeEntry[] = []) {
		super(false, new Set([new VALUE.Tuple()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariants.some((t) => t.type.hasMutable);
	}

	/** The minimum possible number of items in this tuple type. */
	public get minCount(): bigint {
		return BigInt(this.invariants.filter((it) => !it.optional).length);
	}

	public override toString(): string {
		return `[${ this.invariants.map((it) => `${ it.optional ? '?: ' : '' }${ it.type }`).join(', ') }]`;
	}

	@instanceOf(() => VALUE.Tuple)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	@instanceOf(() => TypeTuple)
	public override isSubtypeOf(t: Type): boolean {
		return (
			this.minCount >= (t as TypeTuple).minCount &&
			(t as TypeTuple).invariants.every((thattype, i) => {
				/* eslint-disable @typescript-eslint/no-unnecessary-condition */
				const thistype: TypeEntry | undefined = this.invariants[i];
				if (!thattype.optional) {
					/* NOTE: We can assert `thistype` exists and is not optional because of item ordering.
						We cannot do so with record types since properties are not ordered. */
					assert.strictEqual(thistype?.optional, false, `${ thistype.type } should exist and not be optional.`);
				}
				return thistype?.type.isSubtypeOf(thattype.type) ?? true; // Covariance for tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.
			})
		);
	}

	public get(index: bigint, accessor: AST.ASTNodeIndex): TypeEntry {
		const n: number = this.invariants.length;
		const i: number = Number(index);
		return (
			(-n <= i && i < 0) ? this.invariants[i + n] :
			(0  <= i && i < n) ? this.invariants[i] :
			assert.fail(new TypeErrorNoEntry('index', this, accessor))
		);
	}

	public itemTypes(): Type {
		return Union.all(this.invariants.map((t) => t.type));
	}

	#getBuiltIndices(index: number): number | readonly number[] {
		if (!this.#builtIndices) {
			let counter: number = 0;
			function walk(entries: readonly TypeEntry[]): typeof indices {
				const indices: Array<number | readonly number[]> = [];
				entries.forEach((entry) => {
					if (entry.type instanceof TypeTuple) {
						indices.push(walk(entry.type.invariants).flat()); // only need to flatten once, due to recursion
					} else {
						indices.push(counter);
						counter += 1;
					}
				});
				return indices;
			}
			this.#builtIndices = walk(this.invariants);
		}
		return this.#builtIndices[index];
	}

	public buildAccess(builder: Builder, base_build: binaryen.ExpressionRef, accessor_index: number): binaryen.ExpressionRef {
		const builtIndex: number | readonly number[] = this.#getBuiltIndices(accessor_index);
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
			this.invariants.map((_, i) => this.#getBuiltIndices(i)),
			expected,
			message,
		);
	}
}
export {TypeTuple as Tuple};
