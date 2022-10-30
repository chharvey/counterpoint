import {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `str` type.
 * @final
 */
export class TypeString extends Type {
	public static readonly INSTANCE = new TypeString();
	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = false;
	private constructor() {
		super(false, new Set([new OBJ.String('')]));
	}

	public override toString(): string {
		return 'str';
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.String;
	}
}
