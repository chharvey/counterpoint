import {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports



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
		if (t instanceof SolidTypeTuple) {
			if (this.types.length < t.types.length) {
				return false;
			};
			return t.types.every((thattype, i) => this.types[i].isSubtypeOf(thattype));
		} else {
			return false;
		};
	}
}
