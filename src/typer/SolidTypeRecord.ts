import type {AST} from '../validator/index.js';
import {TypeError04} from '../error/index.js';
import {SolidType} from './SolidType.js';
import {SolidObject} from './SolidObject.js';
import {SolidRecord} from './SolidRecord.js';



export class SolidTypeRecord extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeRecord object.
	 * @param propertytypes a map of this type’s property ids along with their associated types
	 */
	constructor (
		private readonly propertytypes: ReadonlyMap<bigint, SolidType> = new Map(),
	) {
		super(SolidRecord.values);
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
			&& this.propertytypes.size >= t.propertytypes.size
			&& [...t.propertytypes].every(([id, thattype]) => {
				const thistype: SolidType | null = this.propertytypes.get(id) || null;
				return !!thistype && thistype.isSubtypeOf(thattype);
			})
		);
	}

	get(key: bigint, accessor: AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression): SolidType {
		return (this.propertytypes.has(key))
			? this.propertytypes.get(key)!
			: (() => { throw new TypeError04('property', this, accessor); })();
	}

	valueTypes(): SolidType {
		return [...this.propertytypes.values()].reduce((a, b) => a.union(b));
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type intersection is taken.
	 */
	intersectWithRecord(t: SolidTypeRecord): SolidTypeRecord {
		const props: Map<bigint, SolidType> = new Map([...this.propertytypes]);
		[...t.propertytypes].forEach(([id, typ]) => {
			props.set(id, typ.intersect(this.propertytypes.get(id) || SolidType.UNKNOWN));
		});
		return new SolidTypeRecord(props);
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type union is taken.
	 */
	unionWithRecord(t: SolidTypeRecord): SolidTypeRecord {
		const props: Map<bigint, SolidType> = new Map();
		[...t.propertytypes].forEach(([id, typ]) => {
			if (this.propertytypes.has(id)) {
				props.set(id, typ.union(this.propertytypes.get(id)!));
			}
		})
		return new SolidTypeRecord(props);
	}
}
