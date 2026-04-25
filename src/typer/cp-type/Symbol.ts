import {Keyword} from '../../parser/index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {UnenumeratedPrimitiveType} from './UnenumeratedPrimitiveType.ts';



/**
 * Class for constructing the `sym` type.
 * @final
 */
class TypeSymbol extends UnenumeratedPrimitiveType {
	public constructor() {
		super(new Set<VALUE.Symbol>([VALUE.SYM_NOTHING]));
	}

	public override toString(): string {
		return Keyword.SYM;
	}

	@instanceOf(() => VALUE.Symbol)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
export {TypeSymbol as Symbol};
