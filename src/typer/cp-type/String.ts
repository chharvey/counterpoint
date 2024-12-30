import {instanceOf} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `str` type.
 * @final
 */
class TypeString extends ValueType {
	public constructor() {
		super(false, new Set([VALUE.STR_EMPTY]));
	}

	public override toString(): string {
		return 'str';
	}

	@instanceOf(() => VALUE.String)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
export {TypeString as String};
