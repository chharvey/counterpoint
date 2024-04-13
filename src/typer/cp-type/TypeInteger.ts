import * as OBJ from '../cp-object/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `int` type.
 * @final
 */
export class TypeInteger extends ValueType {
	public static readonly INSTANCE = new TypeInteger();


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
