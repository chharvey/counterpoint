import {Keyword} from '../../index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing the `sym` type.
 * @final
 */
class TypeSymbol extends ValueType {
	public constructor() {
		super(new Set<VALUE.Symbol>([new VALUE.Symbol(0x100n, 'hello')]));
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
