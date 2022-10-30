import type {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `obj` type.
 * @final
 */
export class TypeObject extends Type {
	public static readonly INSTANCE: TypeObject = new TypeObject();
	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = false;
	private constructor() {
		super(false);
	}

	public override toString(): string {
		return 'obj';
	}

	public override includes(_v: OBJ.Object): boolean {
		return true;
	}
}
