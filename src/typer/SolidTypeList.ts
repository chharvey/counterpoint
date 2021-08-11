import {
	SolidObject,
	SolidTuple,
	SolidList,
} from '../index.js'; // avoids circular imports
import {SolidType} from './SolidType.js';



export class SolidTypeList extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeList object.
	 * @param types a union of types in this list type
	 */
	constructor (
		readonly types: SolidType,
	) {
		super(SolidList.values);
	}

	override toString(): string {
		return `List.<${ this.types }>`;
	}

	override includes(v: SolidObject): boolean {
		return (
			   v instanceof SolidList  && v.toType().isSubtypeOf(this)
			|| v instanceof SolidTuple && v.toType().isSubtypeOf(this)
		);
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeList
			&& this.types.isSubtypeOf(t.types)
		);
	}
}
