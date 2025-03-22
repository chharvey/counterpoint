import {instanceOf} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `int` type.
 * @final
 */
export class Integer extends ValueType {
	public constructor() {
		super(false, new Set([VALUE.INT_0, VALUE.INT_1]));
	}

	public override toString(): string {
		return 'int';
	}

	@instanceOf(() => VALUE.Integer)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
