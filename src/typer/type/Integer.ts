import {Keyword} from '../../index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing the `int` type.
 * @singleton
 * @final
 */
export class Integer extends ValueType {
	public constructor() {
		super();
	}

	public override toString(): string {
		return Keyword.INT;
	}

	@instanceOf(() => VALUE.Integer)
	public override includes(_v: VALUE.Value): boolean {
		return true;
	}
}
