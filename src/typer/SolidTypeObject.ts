import type {SolidObject} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing the `obj` type.
 * @final
 */
export class SolidTypeObject extends SolidType {
	static get INSTANCE(): SolidTypeObject { return new SolidTypeObject(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false);
	}
	override toString(): string {
		return 'obj';
	}
	override includes(_v: SolidObject): boolean {
		return true;
	}
}
