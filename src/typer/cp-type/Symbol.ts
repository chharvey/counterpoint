import {instanceOf} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `sym` type.
 * @final
 */
class TypeSymbol extends ValueType {
	public constructor() {
		super(false, new Set([VALUE.SYM_NEVER]));
	}

	public override toString(): string {
		return 'sym';
	}

	@instanceOf(() => VALUE.Symbol)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
export {TypeSymbol as Symbol};
