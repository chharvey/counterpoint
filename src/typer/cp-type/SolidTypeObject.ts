import type {SolidObject} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `obj` type.
 * @final
 */
export class SolidTypeObject extends Type {
	static readonly INSTANCE: SolidTypeObject = new SolidTypeObject();
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
