import * as OBJ from '../cp-object/index.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `int` type.
 * @final
 */
export class TypeInteger extends Type {
	public static readonly INSTANCE = new TypeInteger();


	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = false;

	private constructor() {
		super(false, new Set([OBJ.Integer.ZERO]));
	}

	public override toString(): string {
		return 'int';
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Integer;
	}
}
