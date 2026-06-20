import * as assert from 'node:assert';
import {
	TypeErrorNoEntry,
	type AST,
} from '../../index.ts';
import type {EntryType} from '../utils-public.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
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
	 * Construct a new TypeRecord object.
	 * @param typeargs a map of this type’s property ids along with their associated types
	 */
	public constructor(public readonly typeargs: ReadonlyMap<bigint, EntryType> = new Map()) {
		super(new Set<VALUE.Record>([VALUE.RECORD_EMPTY]));
	}

	/** The minimum possible number of properties in this record type. */
	public get minCount(): bigint {
		return BigInt([...this.typeargs.values()].filter((val) => !val.optional).length);
	}

	public override toString(): string {
		return `(${ [...this.typeargs].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') })`;
	}

	@instanceOf(() => VALUE.Record)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
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

	public get(key: bigint, accessor: AST.Key): EntryType {
		return this.isKeyCanonical(key)
			? this.typeargs.get(key)!
			: assert.fail(new TypeErrorNoEntry('key', this, accessor));
	}

	public set(key: bigint, typ: Type, accessor: AST.Key): void {
		const entrytype: EntryType | undefined = this.typeargs.get(key);
		if (entrytype) {
			(this.typeargs as Map<bigint, EntryType>).set(key, {...entrytype, type: typ});
		} else {
			throw new TypeErrorNoEntry('key', this, accessor);
		}
	}

	public valueTypes(): Type {
		return Union.all(...[...this.typeargs.values()].map((t) => t.type));
	}

	public isKeyCanonical(key: bigint): boolean {
		return this.typeargs.has(key);
	}
}
export {TypeRecord as Record};
