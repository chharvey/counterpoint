import {instanceOf} from '../../lib/decorators.js';
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

	@instanceOf(() => OBJ.Float)
	public override includes(_: OBJ.Object): boolean {
		return true;
	}
}
