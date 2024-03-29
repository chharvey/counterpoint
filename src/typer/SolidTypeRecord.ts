import {
	TypeError04,
	IntRange,
	ValidAccessOperator,
	AST,
} from './package.js';
import {
	SolidObject,
	SolidRecord,
} from './index.js';
import type {TypeEntry} from './utils-public.js';
import {updateAccessedStaticType} from './utils-private.js';
import {SolidType} from './SolidType.js';
import {SolidTypeUnit} from './SolidTypeUnit.js';



export class SolidTypeRecord extends SolidType {
	/**
	 * Is the argument a unit record type?
	 * @return whether the argument is a `SolidTypeUnit` and its value is a `SolidRecord`
	 */
	static isUnitType(type: SolidType): type is SolidTypeUnit<SolidRecord> {
		return type instanceof SolidTypeUnit && type.value instanceof SolidRecord;
	}


	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeRecord from type properties, assuming each properties is required.
	 * @param propertytypes the types of the record
	 * @param is_mutable is the record type mutable?
	 * @return a new record type with the provided properties
	 */
	static fromTypes(propertytypes: ReadonlyMap<bigint, SolidType> = new Map(), is_mutable: boolean = false): SolidTypeRecord {
		return new SolidTypeRecord(new Map<bigint, TypeEntry>([...propertytypes].map(([id, t]) => [id, {
			type:     t,
			optional: false,
		}])), is_mutable);
	}


	/**
	 * Construct a new SolidTypeRecord object.
	 * @param propertytypes a map of this type’s property ids along with their associated types
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		public readonly propertytypes: ReadonlyMap<bigint, TypeEntry> = new Map(),
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new SolidRecord()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || [...this.propertytypes.values()].some((t) => t.type.hasMutable);
	}

	/** The possible number of values in this record type. */
	public get count(): IntRange {
		return [
			BigInt([...this.propertytypes.values()].filter((val) => !val.optional).length),
			BigInt(this.propertytypes.size) + 1n,
		];
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }[${ [...this.propertytypes].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') }]`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidRecord && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidType.OBJ) || (
			t instanceof SolidTypeRecord
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

	override mutableOf(): SolidTypeRecord {
		return new SolidTypeRecord(this.propertytypes, true);
	}

	override immutableOf(): SolidTypeRecord {
		return new SolidTypeRecord(this.propertytypes, false);
	}

	get(key: bigint, access_kind: ValidAccessOperator, accessor: AST.ASTNodeKey): SolidType {
		return updateAccessedStaticType(((this.propertytypes.has(key))
			? this.propertytypes.get(key)!
			: (() => { throw new TypeError04('property', this, accessor); })()
		), access_kind);
	}

	valueTypes(): SolidType {
		return (this.propertytypes.size)
			? SolidType.unionAll([...this.propertytypes.values()].map((t) => t.type))
			: SolidType.NEVER;
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type intersection is taken.
	 */
	intersectWithRecord(t: SolidTypeRecord): SolidTypeRecord {
		const props: Map<bigint, TypeEntry> = new Map([...this.propertytypes]);
		[...t.propertytypes].forEach(([id, typ]) => {
			props.set(id, this.propertytypes.has(id) ? {
				type:     this.propertytypes.get(id)!.type.intersect(typ.type),
				optional: this.propertytypes.get(id)!.optional && typ.optional,
			} : typ);
		});
		return new SolidTypeRecord(props);
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type union is taken.
	 */
	unionWithRecord(t: SolidTypeRecord): SolidTypeRecord {
		const props: Map<bigint, TypeEntry> = new Map();
		[...t.propertytypes].forEach(([id, typ]) => {
			if (this.propertytypes.has(id)) {
				props.set(id, {
					type:     this.propertytypes.get(id)!.type.union(typ.type),
					optional: this.propertytypes.get(id)!.optional || typ.optional,
				});
			}
		})
		return new SolidTypeRecord(props);
	}
}
