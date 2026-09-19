import {Keyword} from '../../index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing the `str` type.
 * @final
 */
class TypeString extends ValueType {
	public constructor() {
		super();
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
