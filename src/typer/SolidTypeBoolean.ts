import {
	SolidObject,
	SolidBoolean,
} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing the `bool` type.
 * @final
 */
export class SolidTypeBoolean extends SolidType {
	static readonly INSTANCE: SolidTypeBoolean = new SolidTypeBoolean();
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false);
	}
	override toString(): string {
		return 'bool';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof SolidBoolean;
	}
}
