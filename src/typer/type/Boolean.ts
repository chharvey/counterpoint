import {Keyword} from '../../index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	FALSE,
	TRUE,
} from './index.ts';
import {Union} from './Union.ts';



/**
 * Class for constructing the `bool` type.
 * @final
 */
class TypeBoolean extends Union {
	public constructor() {
		super(FALSE, TRUE);
	}

	public override toString(): string {
		return Keyword.BOOL;
	}

	@instanceOf(() => VALUE.Boolean)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
export {TypeBoolean as Boolean};
