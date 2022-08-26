import type {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `obj` type.
 * @final
 */
export class TypeObject extends Type {
	static readonly INSTANCE: TypeObject = new TypeObject();
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor() {
		super(false);
	}
	override toString(): string {
		return 'obj';
	}
	override includes(_v: OBJ.Object): boolean {
		return true;
	}
}
