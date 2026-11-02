import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../value/index.ts';
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
		return v.isReference;
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@instanceOf(() => TypeObject)
	public override isSubtypeOf(_t: Type): boolean {
		return true;
	}

	public override mutableOf(): TypeObject {
		return this;
	}
}
export {TypeObject as Object};
