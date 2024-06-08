import {TypeError04} from '../../index.js';
import {
	type IntRange,
	throw_expression,
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



export class TypeRecord extends Type {
	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeRecord from type properties, assuming each properties is required.
	 * @param propertytypes the types of the record
	 * @param is_mutable is the record type mutable?
	 * @return a new record type with the provided properties
	 */
	public static fromTypes(propertytypes: ReadonlyMap<bigint, Type> = new Map(), is_mutable: boolean = false): TypeRecord {
		return new TypeRecord(new Map<bigint, TypeEntry>([...propertytypes].map(([id, t]) => [id, {
			type:     t,
			optional: false,
		}])), is_mutable);
	}


	/**
	 * Construct a new TypeRecord object.
	 * @param invariants a map of this type’s property ids along with their associated types
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariants: ReadonlyMap<bigint, TypeEntry> = new Map(),
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Record()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || [...this.invariants.values()].some((t) => t.type.hasMutable);
	}

	/** The possible number of values in this record type. */
	public get count(): IntRange {
		return [
			BigInt([...this.invariants.values()].filter((val) => !val.optional).length),
			BigInt(this.invariants.size) + 1n,
		];
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }[${ [...this.invariants].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') }]`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Record && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeRecord
			&& this.count[0] >= t.count[0]
			&& (!t.isMutable || this.isMutable)
			&& [...t.invariants].every(([id, thattype]) => {
				const thistype: TypeEntry | undefined = this.invariants.get(id);
				if (!thattype.optional) {
					/* NOTE: We *cannot* assert `thistype` exists and is not optional since properties are not ordered.
						We can however make the assertion in tuple types because of item ordering. */
					if (thistype?.optional !== false) {
						return false;
					}
				}
				return (!thistype || ((t.isMutable)
					? thistype.type.equals(thattype.type)      // Invariance for mutable records: `A == B --> mutable Record.<A> <: mutable Record.<B>`.
					: thistype.type.isSubtypeOf(thattype.type) // Covariance for immutable records: `A <: B --> Record.<A> <: Record.<B>`.
				));
			})
		);
	}

	public override mutableOf(): TypeRecord {
		return new TypeRecord(this.invariants, true);
	}

	public override immutableOf(): TypeRecord {
		return new TypeRecord(this.invariants, false);
	}

	public get(key: bigint, access_kind: ValidAccessOperator, accessor: AST.ASTNodeKey): Type {
		return updateAccessedStaticType(
			((this.invariants.has(key))
				? this.invariants.get(key)!
				: throw_expression(new TypeError04('property', this, accessor))
			),
			access_kind,
		);
	}

	public valueTypes(): Type {
		return Type.unionAll([...this.invariants.values()].map((t) => t.type));
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type intersection is taken.
	 */
	public intersectWithRecord(t: TypeRecord): TypeRecord {
		const props = new Map<bigint, TypeEntry>([...this.invariants]);
		[...t.invariants].forEach(([id, typ]) => {
			props.set(id, this.invariants.has(id) ? {
				type:     this.invariants.get(id)!.type.intersect(typ.type),
				optional: this.invariants.get(id)!.optional && typ.optional,
			} : typ);
		});
		return new TypeRecord(props);
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type union is taken.
	 */
	public unionWithRecord(t: TypeRecord): TypeRecord {
		const props = new Map<bigint, TypeEntry>();
		[...t.invariants].forEach(([id, typ]) => {
			if (this.invariants.has(id)) {
				props.set(id, {
					type:     this.invariants.get(id)!.type.union(typ.type),
					optional: this.invariants.get(id)!.optional || typ.optional,
				});
			}
		});
		return new TypeRecord(props);
	}
}
