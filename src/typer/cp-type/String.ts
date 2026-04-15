import {Keyword} from '../../parser/index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {UnenumeratedPrimitiveType} from './UnenumeratedPrimitiveType.ts';



/**
 * Class for constructing the `str` type.
 * @final
 */
class TypeString extends UnenumeratedPrimitiveType {
	public constructor() {
		super(new Set([VALUE.STR_EMPTY]));
	}

	public override toString(): string {
		return Keyword.STR;
	}

	@instanceOf(() => VALUE.String)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
export {TypeString as String};
