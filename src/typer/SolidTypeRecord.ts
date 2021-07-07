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
		super(new Set([new SolidRecord()]));
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
}
