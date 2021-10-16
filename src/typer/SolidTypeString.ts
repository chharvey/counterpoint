import {
	SolidObject,
	SolidString,
} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing the `str` type.
 * @final
 */
export class SolidTypeString extends SolidType {
	static readonly INSTANCE: SolidTypeString = new SolidTypeString();
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false);
	}
	override toString(): string {
		return 'str';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof SolidString;
	}
}
