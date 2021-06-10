import {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports
import {SolidObject} from '../validator/SolidObject';
import {SolidRecord} from './SolidRecord';



export class SolidTypeRecord extends SolidLanguageType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeRecord object.
	 * @param propertytypes a map of this type’s property ids along with their associated types
	 */
	constructor (
		private readonly propertytypes: ReadonlyMap<bigint, SolidLanguageType> = new Map(),
	) {
		super(new Set([new SolidRecord()]));
	}

	override toString(): string {
		return `[${ [...this.propertytypes].map(([key, value]) => `${ key }: ${ value }`).join(', ') }]`;
	}

	override isSubtypeOf_do(t: SolidLanguageType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeRecord
			&& this.propertytypes.size >= t.propertytypes.size
			&& [...t.propertytypes].every(([id, thattype]) => {
				const thistype: SolidLanguageType | null = this.propertytypes.get(id) || null;
				return !!thistype && thistype.isSubtypeOf(thattype);
			})
		);
	}
}
