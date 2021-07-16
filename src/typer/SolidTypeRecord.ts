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
		super(new Set([new SolidRecord()]));
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
