import type {AST} from '../validator/index.js';
import {TypeError04} from '../error/index.js';
import {
	SolidObject,
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
		return `[${ [...this.propertytypes].map(([key, value]) => `${ key }: ${ value }`).join(', ') }]`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidRecord && v.toType().isSubtypeOf(this);
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type intersection is taken.
	 */
	override intersect_do(t: SolidType): SolidType {
		if (t instanceof SolidTypeRecord) {
			const thisproptypes = new Map([...this.propertytypes].map(([id, t]) => [id, t.type]));
			const thatproptypes = new Map([...t.propertytypes].map(([id, t]) => [id, t.type]));
			const props: Map<bigint, SolidType> = thisproptypes;
			[...thatproptypes].forEach(([id, typ]) => {
				props.set(id, typ.intersect(thisproptypes.get(id) || SolidType.UNKNOWN));
			});
			return SolidTypeRecord.fromTypes(props);
		} else {
			return super.intersect_do(t);
		}
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type union is taken.
	 */
	override union_do(t: SolidType): SolidType {
		if (t instanceof SolidTypeRecord) {
			const thisproptypes = new Map([...this.propertytypes].map(([id, t]) => [id, t.type]));
			const thatproptypes = new Map([...t.propertytypes].map(([id, t]) => [id, t.type]));
			const props: Map<bigint, SolidType> = new Map();
			[...thatproptypes].forEach(([id, typ]) => {
				if (this.propertytypes.has(id)) {
					props.set(id, typ.union(thisproptypes.get(id)!));
				}
			})
			return SolidTypeRecord.fromTypes(props);
		} else {
			return super.union_do(t);
		}
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
		);
	}

	get(key: bigint, accessor: AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression): SolidType {
		return (this.propertytypes.has(key))
			? this.propertytypes.get(key)!.type
			: (() => { throw new TypeError04('property', this, accessor); })();
	}

	valueTypes(): SolidType {
		return [...this.propertytypes.values()].map((t) => t.type).reduce((a, b) => a.union(b));
	}
}
