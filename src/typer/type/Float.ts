import {Keyword} from '../../index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class Float extends ValueType {
	public constructor() {
		super();
	}

	public override toString(): string {
		return Keyword.FLOAT;
	}

	@instanceOf(() => VALUE.Float)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
