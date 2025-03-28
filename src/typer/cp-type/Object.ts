import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import {
	subtypeRules,
	type Type,
} from './Type.js';
import {ReferenceType} from './ReferenceType.js';



/**
 * Class for constructing the `Object` type.
 * @final
 */
class TypeObject extends ReferenceType {
	public constructor() {
		super(false, new Set([
			new VALUE.List(),
			new VALUE.Dict(),
			new VALUE.Set(),
			new VALUE.Map(),
		]));
	}

	public override toString(): string {
		return 'Object';
	}

	public override includes(v: VALUE.Value): boolean {
		return (
			v instanceof VALUE.List ||
			v instanceof VALUE.Dict ||
			v instanceof VALUE.Set  ||
			v instanceof VALUE.Map
		);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	public override isSubtypeOf(_t: Type): boolean {
		return false;
	}
}
export {TypeObject as Object};
