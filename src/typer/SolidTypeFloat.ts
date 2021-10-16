import {
	SolidObject,
	Float64,
} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class SolidTypeFloat extends SolidType {
	static readonly INSTANCE: SolidTypeFloat = new SolidTypeFloat();
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false);
	}
	override toString(): string {
		return 'int';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof Float64;
	}
}
