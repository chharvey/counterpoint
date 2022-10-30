import type {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the Top Type, the type containing all values.
 * @final
 */
export class TypeUnknown extends Type {
	public static readonly INSTANCE: TypeUnknown = new TypeUnknown();

	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = true;

	private constructor() {
		super(false);
	}

	public override toString(): string {
		return 'unknown';
	}

	public override includes(_v: OBJ.Object): boolean {
		return true;
	}

	public override equals(t: Type): boolean {
		return t.isTopType;
	}
}
