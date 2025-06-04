import {instanceOf} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import {UnenumeratedPrimitiveType} from './UnenumeratedPrimitiveType.js';



/**
 * Class for constructing the `sym` type.
 * @final
 */
class TypeSymbol extends UnenumeratedPrimitiveType {
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
