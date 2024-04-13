import * as OBJ from '../cp-object/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class TypeFloat extends ValueType {
	public static readonly INSTANCE = new TypeFloat();


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
