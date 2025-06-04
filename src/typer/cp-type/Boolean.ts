import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing the `bool` type.
 * @final
 */
class TypeBoolean extends ValueType {
	public constructor() {
		super(false, new Set([VALUE.FALSE, VALUE.TRUE]));
	}

	public override toString(): string {
		return 'bool';
	}

	@instanceOf(() => VALUE.Boolean)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
export {TypeBoolean as Boolean};
