import {instanceOf} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class Float extends ValueType {
	public constructor() {
		super(false, new Set([VALUE.FLOAT_0, VALUE.FLOAT_N0]));
	}

	public override toString(): string {
		return 'float';
	}

	@instanceOf(() => VALUE.Float)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
