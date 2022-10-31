import {
	TypeError04,
	IntRange,
	throw_expression,
	strictEqual,
	ValidAccessOperator,
	AST,
	TypeEntry,
	OBJ as VALUE,
} from './package.js';
import {updateAccessedStaticType} from './utils-private.js';
import {Type} from './Type.js';
import {TypeUnit} from './TypeUnit.js';
import {OBJ} from './index.js';



export class TypeRecord extends Type {
	/**
	 * Is the argument a unit record type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Record`
	 */
	public static isUnitType(type: Type): type is TypeUnit<VALUE.Record> {
		return type instanceof TypeUnit && type.value instanceof VALUE.Record;
	}


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
	 * @param propertytypes a map of this type’s property ids along with their associated types
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly propertytypes: ReadonlyMap<bigint, TypeEntry> = new Map(),
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.Record()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || [...this.propertytypes.values()].some((t) => t.type.hasMutable);
	}

	/** The possible number of values in this record type. */
	public get count(): IntRange {
		return [
			BigInt([...this.propertytypes.values()].filter((val) => !val.optional).length),
			BigInt(this.propertytypes.size) + 1n,
		];
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }[${ [...this.propertytypes].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') }]`;
	}

	public override includes(v: VALUE.Object): boolean {
		return v instanceof VALUE.Record && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(OBJ) || (
			t instanceof TypeRecord
			&& this.count[0] >= t.count[0]
			&& (!t.isMutable || this.isMutable)
			&& [...t.propertytypes].every(([id, thattype]) => {
				const thistype: TypeEntry | null = this.propertytypes.get(id) || null;
				return (
					(thattype.optional || thistype && !thistype.optional)
					&& (!thistype || ((t.isMutable)
						? thistype.type.equals(thattype.type)
						: thistype.type.isSubtypeOf(thattype.type)
					))
				);
			})
		);
	}

	public override mutableOf(): TypeRecord {
		return new TypeRecord(this.propertytypes, true);
	}

	public override immutableOf(): TypeRecord {
		return new TypeRecord(this.propertytypes, false);
	}

	public get(key: bigint, access_kind: ValidAccessOperator, accessor: AST.ASTNodeKey): Type {
		return updateAccessedStaticType(
			((this.propertytypes.has(key))
				? this.propertytypes.get(key)!
				: throw_expression(new TypeError04('property', this, accessor))
			),
			access_kind,
		);
	}

	public valueTypes(): Type {
		return Type.unionAll([...this.propertytypes.values()].map((t) => t.type));
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type intersection is taken.
	 */
	public intersectWithRecord(t: TypeRecord): TypeRecord {
		const props = new Map<bigint, TypeEntry>([...this.propertytypes]);
		[...t.propertytypes].forEach(([id, typ]) => {
			props.set(id, this.propertytypes.has(id) ? {
				type:     this.propertytypes.get(id)!.type.intersect(typ.type),
				optional: this.propertytypes.get(id)!.optional && typ.optional,
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
		[...t.propertytypes].forEach(([id, typ]) => {
			if (this.propertytypes.has(id)) {
				props.set(id, {
					type:     this.propertytypes.get(id)!.type.union(typ.type),
					optional: this.propertytypes.get(id)!.optional || typ.optional,
				});
			}
		});
		return new TypeRecord(props);
	}
}
