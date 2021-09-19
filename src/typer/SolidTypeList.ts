import {strictEqual} from './package.js';
import {
	SolidObject,
	SolidTuple,
	SolidList,
} from './index.js';
import {SolidType} from './SolidType.js';



export class SolidTypeList extends SolidType {
	override readonly isBottomType: boolean = false;

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

	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeList
			&& this.types.isSubtypeOf(t.types)
		);
	}
}
