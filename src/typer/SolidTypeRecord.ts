import {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports
import {SolidObject} from '../validator/SolidObject';



export class SolidTypeRecord extends SolidLanguageType {
	/** @overrides SolidLanguageType */
	readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeRecord object.
	 * @param propertytypes a map of this type’s property ids along with their associated types
	 */
	constructor (
		private readonly propertytypes: ReadonlyMap<bigint, SolidLanguageType> = new Map(),
	) {
		super();
	}

	/** @overrides SolidLanguageType */
	isSubtypeOf_do(t: SolidLanguageType): boolean {
		return (
			(t === SolidObject) ? true : // TODO use `.equals` and add dummy values to constructor
			(t instanceof SolidTypeRecord) ? ((this.propertytypes.size < t.propertytypes.size)
				? false
				: [...t.propertytypes].every(([id, thattype]) => {
					const thistype: SolidLanguageType | null = this.propertytypes.get(id) || null;
					return (thistype)
						? thistype.isSubtypeOf(thattype)
						: false;
				})
			) :
			false
		);
	}
}
