import {
	SolidObject,
	Int16,
} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing the `int` type.
 * @final
 */
export class SolidTypeInteger extends SolidType {
	static get INSTANCE(): SolidTypeInteger { return new SolidTypeInteger(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([Int16.ZERO]));
	}
	override toString(): string {
		return 'int';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof Int16;
	}
}
