import {
	AST,
	Operator,
	ValidAccessOperator,
} from '../validator/index.js';
import {TypeError04} from '../error/index.js';
import {
	SolidTypeHash,
	SolidObject,
	SolidNull,
	SolidRecord,
} from '../index.js'; // avoids circular imports
import {
	TypeEntry,
	IntRange,
	SolidType,
} from './SolidType.js';



export class SolidTypeRecord extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeRecord from type properties, assuming each properties is required.
	 * @param propertytypes the types of the record
	 * @return a new record type with the provided properties
	 */
	static fromTypes(propertytypes: ReadonlyMap<bigint, SolidType> = new Map()): SolidTypeRecord {
		return new SolidTypeRecord(new Map<bigint, TypeEntry>([...propertytypes].map(([id, t]) => [id, {
			type:     t,
			optional: false,
		}])));
	}


	/**
	 * Construct a new SolidTypeRecord object.
	 * @param propertytypes a map of this type’s property ids along with their associated types
	 */
	constructor (
		private readonly propertytypes: ReadonlyMap<bigint, TypeEntry> = new Map(),
	) {
		super(SolidRecord.values);
	}

	/** The possible number of values in this record type. */
	private get count(): IntRange {
		return [
			[...this.propertytypes].filter(([_, entry]) => !entry.optional).length,
			this.propertytypes.size + 1,
		];
	}

	override toString(): string {
		return `[${ [...this.propertytypes].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') }]`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidRecord && v.toType().isSubtypeOf(this);
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeRecord
			&& this.count[0] >= t.count[0]
			&& [...t.propertytypes].every(([id, thattype]) => {
				const thistype: TypeEntry | null = this.propertytypes.get(id) || null;
				return (
					(thattype.optional || thistype && !thistype.optional)
					&& (!thistype || thistype.type.isSubtypeOf(thattype.type))
				);
			})
		) || (
			t instanceof SolidTypeHash
			&& this.valueTypes().isSubtypeOf(t.types)
		);
	}

	get(key: bigint, access_kind: ValidAccessOperator, accessor: AST.ASTNodeKey): SolidType {
		const entry: TypeEntry = (this.propertytypes.has(key))
			? this.propertytypes.get(key)!
			: (() => { throw new TypeError04('property', this, accessor); })();
		return (access_kind === Operator.CLAIMDOT)
			? entry.type.subtract(SolidType.VOID)
			: entry.type.union((entry.optional) ? (access_kind === Operator.OPTDOT) ? SolidNull : SolidType.VOID : SolidType.NEVER);
	}

	valueTypes(): SolidType {
		return (this.propertytypes.size)
			? [...this.propertytypes.values()].map((t) => t.type).reduce((a, b) => a.union(b))
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
