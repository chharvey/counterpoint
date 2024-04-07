import * as OBJ from '../cp-object/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `str` type.
 * @final
 */
export class TypeString extends ValueType {
	public static readonly INSTANCE = new TypeString();


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
