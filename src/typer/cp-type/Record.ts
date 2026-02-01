import * as assert from 'node:assert';
import {TypeErrorNoEntry} from '../../index.ts';
import type {
	ValidAccessOperator,
	AST,
} from '../../validator/index.ts';
import type {EntryType} from '../utils-public.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {updateAccessedStaticType} from './utils-private.ts';
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
	 * Construct a new TypeRecord object.
	 * @param invariants a map of this type’s property ids along with their associated types
	 */
	public constructor(public readonly invariants: ReadonlyMap<bigint, EntryType> = new Map()) {
		super(false, new Set([new VALUE.Record()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || [...this.invariants.values()].some((t) => t.type.hasMutable);
	}

	/** The minimum possible number of properties in this record type. */
	public get minCount(): bigint {
		return BigInt([...this.invariants.values()].filter((val) => !val.optional).length);
	}

	public override toString(): string {
		return `[${ [...this.invariants].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') }]`;
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
			[...(t as TypeRecord).invariants].every(([id, thattype]) => {
				const thistype: EntryType | undefined = this.invariants.get(id);
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

	public get(key: bigint, access_kind: ValidAccessOperator, accessor: AST.ASTNodeKey): Type {
		return updateAccessedStaticType(
			((this.invariants.has(key))
				? this.invariants.get(key)!
				: assert.fail(new TypeErrorNoEntry('property', this, accessor))
			),
			access_kind,
		);
	}

	public valueTypes(): Type {
		return Union.all([...this.invariants.values()].map((t) => t.type));
	}
}
export {TypeRecord as Record};
