import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
	type Type,
} from './Type.ts';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.ts';



/**
 * Class for constructing the `Class` type.
 * @singleton
 * @final
 */
class TypeClass extends ReferenceType {
	/**
	 * Construct a new TypeClass object.
	 * @param typearg the types of the instances of this class
	 */
	public constructor() {
		super(false);
	}


	public override toString(): string {
		return 'Class';
	}

	@instanceOf(() => VALUE.Class)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => TypeClass)
	public override isSubtypeOf(_t: Type): boolean {
		return true;
	}

	public override mutableOf(): TypeClass {
		return this;
	}
}
export {TypeClass as Class};
