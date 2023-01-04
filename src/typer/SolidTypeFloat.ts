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
	static get INSTANCE(): SolidTypeFloat { return new SolidTypeFloat(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([new Float64(0.0)]));
	}
	override toString(): string {
		return 'float';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof Float64;
	}
}
