import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
	type Type,
} from './Type.ts';
import {ReferenceType} from './ReferenceType.ts';



/**
 * Class for constructing the `Object` type.
 * @final
 */
class TypeObject extends ReferenceType {
	public constructor() {
		super();
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
	@subtypeLaws
	public override isSubtypeOf(_t: Type): boolean {
		return false;
	}
}
export {TypeObject as Object};
