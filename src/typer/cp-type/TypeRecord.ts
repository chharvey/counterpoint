import * as assert from 'assert';
import {TypeErrorNoEntry} from '../../index.js';
import {
	type IntRange,
	strictEqual,
} from '../../lib/index.js';
import type {
	ValidAccessOperator,
	AST,
} from '../../validator/index.js';
import type {TypeEntry} from '../utils-public.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
import {updateAccessedStaticType} from './utils-private.js';
import {Type} from './Type.js';
import {TypeUnion} from './TypeUnion.js';
import {ValueType} from './ValueType.js';



export class TypeRecord extends ValueType {
	/**
	 * Construct a new TypeRecord from type properties, assuming each property is required.
	 * @param propertytypes the types of the record
	 * @return a new record type with the provided properties
	 */
	public static fromTypes(propertytypes: ReadonlyMap<bigint, Type> = new Map()): TypeRecord {
		return new TypeRecord(new Map<bigint, TypeEntry>([...propertytypes].map(([id, t]) => [id, {
			type:     t,
			optional: false,
		}])));
	}


	/**
	 * Construct a new TypeRecord object.
	 * @param invariants a map of this type’s property ids along with their associated types
	 */
	public constructor(public readonly invariants: ReadonlyMap<bigint, TypeEntry> = new Map()) {
		super(false, new Set([new OBJ.Record()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || [...this.invariants.values()].some((t) => t.type.hasMutable);
	}

	/**
	 * The possible number of items in this record type.
	 * @final
	 */
	public get count(): IntRange {
		return [
			BigInt([...this.invariants.values()].filter((val) => !val.optional).length),
			BigInt(this.invariants.size) + 1n,
		];
	}

	public override toString(): string {
		return `[${ [...this.invariants].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') }]`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Record && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.memoizeSubtype
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeRecord &&
			this.count[0] >= t.count[0] &&
			[...t.invariants].every(([id, thattype]) => {
				const thistype: TypeEntry | undefined = this.invariants.get(id);
				if (!thattype.optional) {
					/* NOTE: We *cannot* assert `thistype` exists and is not optional since properties are not ordered.
						We can however make the assertion in tuple types because of item ordering. */
					if (thistype?.optional !== false) {
						return false;
					}
				}
				return !thistype || thistype.type.isSubtypeOf(thattype.type); // Covariance for records: `A <: B --> Record.<A> <: Record.<B>`.
			})
		);
	}

	/** @final */
	public get(key: bigint, access_kind: ValidAccessOperator, accessor: AST.ASTNodeKey): Type {
		return updateAccessedStaticType(
			((this.invariants.has(key))
				? this.invariants.get(key)!
				: assert.fail(new TypeErrorNoEntry('property', this, accessor))
			),
			access_kind,
		);
	}

	/** @final */
	public valueTypes(): Type {
		return TypeUnion.all([...this.invariants.values()].map((t) => t.type));
	}
}
