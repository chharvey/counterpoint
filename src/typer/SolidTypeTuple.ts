import {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports
import {SolidObject} from '../validator/SolidObject';
import {SolidTuple} from './SolidTuple';



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
		super(new Set([new SolidTuple()]));
	}

	/** @overrides SolidLanguageType */
	isSubtypeOf_do(t: SolidLanguageType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeTuple
			&& this.types.length >= t.types.length
			&& t.types.every((thattype, i) => this.types[i].isSubtypeOf(thattype))
		);
	}
}
