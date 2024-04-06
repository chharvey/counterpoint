import * as OBJ from '../cp-object/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `bool` type.
 * @final
 */
export class TypeBoolean extends ValueType {
	public static readonly INSTANCE = new TypeBoolean();


	private constructor() {
		super(false, new Set([OBJ.Boolean.FALSE, OBJ.Boolean.TRUE]));
	}

	public override toString(): string {
		return 'bool';
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Boolean;
	}
}
