import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {UnenumeratedPrimitiveType} from './UnenumeratedPrimitiveType.ts';



/**
 * Class for constructing the `sym` type.
 * @final
 */
class TypeSymbol extends UnenumeratedPrimitiveType {
	public constructor() {
		super(false, new Set([VALUE.SYM_NOTHING]));
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
