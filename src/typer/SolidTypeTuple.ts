import {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports
import {SolidObject} from '../validator/SolidObject';



export class SolidTypeTuple extends SolidLanguageType {
	/** @overrides SolidLanguageType */
	readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeTuple object.
	 * @param types this type’s item types
	 */
	constructor (
		private readonly types: readonly SolidLanguageType[] = [],
	) {
		super();
	}

	/** @overrides SolidLanguageType */
	isSubtypeOf_do(t: SolidLanguageType): boolean {
		return (
			(t === SolidObject) ? true : // TODO use `.equals` and add dummy values to constructor
			(t instanceof SolidTypeTuple) ? ((this.types.length < t.types.length)
				? false
				: t.types.every((thattype, i) => this.types[i].isSubtypeOf(thattype))
			) :
			false
		);
	}
}
