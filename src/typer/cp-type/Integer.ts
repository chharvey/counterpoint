import {Keyword} from '../../parser/index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {UnenumeratedPrimitiveType} from './UnenumeratedPrimitiveType.ts';



/**
 * Class for constructing the `int` type.
 * @final
 */
export class Integer extends UnenumeratedPrimitiveType {
	public constructor() {
		super(false, new Set([VALUE.INT_0, VALUE.INT_1]));
	}

	public override toString(): string {
		return Keyword.INT;
	}

	// @instanceOf(() => VALUE.Integer)
	public override includes(value: VALUE.Value): boolean {
		instanceOf; // TODO: add TYPE.Natural, put back the decorator.
		return value instanceof VALUE.Integer || value instanceof VALUE.Natural;
		// return true;
	}
}
