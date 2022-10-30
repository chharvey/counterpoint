import {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `bool` type.
 * @final
 */
export class TypeBoolean extends Type {
	public static readonly INSTANCE = new TypeBoolean();
	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([OBJ.Boolean.FALSE, OBJ.Boolean.TRUE]));
	}

	public override toString(): string {
		return 'bool';
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Boolean;
	}
}
