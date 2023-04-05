import * as OBJ from '../cp-object/index.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class TypeFloat extends Type {
	public static readonly INSTANCE = new TypeFloat();


	public override readonly isReference:  boolean = false;
	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = false;

	private constructor() {
		super(false, new Set([new OBJ.Float(0.0)]));
	}

	public override toString(): string {
		return 'float';
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Float;
	}
}
