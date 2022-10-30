import type {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the Bottom Type, the type containing no values.
 * @final
 */
export class TypeNever extends Type {
	public static readonly INSTANCE: TypeNever = new TypeNever();

	public override readonly isBottomType: boolean = true;
	public override readonly isTopType:    boolean = false;

	private constructor() {
		super(false);
	}

	public override toString(): string {
		return 'never';
	}

	public override includes(_v: OBJ.Object): boolean {
		return false;
	}

	public override equals(t: Type): boolean {
		return t.isBottomType;
	}
}
