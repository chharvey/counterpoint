import {instanceOf} from '../../lib/decorators.js';
import * as VALUE from '../cp-value/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `int` type.
 * @final
 */
export class Integer extends ValueType {
	public constructor() {
		super(false, new Set([VALUE.INT_0]));
	}

	public override toString(): string {
		return 'int';
	}

	@instanceOf(() => VALUE.Integer)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
