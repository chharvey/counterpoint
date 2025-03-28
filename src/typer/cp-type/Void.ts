import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.js';
import type * as VALUE from '../cp-value/index.js';
import {
	NEVER,
	VOID,
} from './index.js';
import {
	intersectionRules,
	subtypeRules,
	type Type,
} from './Type.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `void` type.
 * @final
 */
export class Void extends ValueType {
	public constructor() {
		super(false);
	}

	public override toString(): string {
		return 'void';
	}

	public override includes(_v: VALUE.Value): boolean {
		return false;
	}

	@memoizeBinOp(true)
	// @typeConstant // slower than returning a constant
	@intersectionRules
	public override intersect(_t: Type): Type {
		return NEVER;
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	public override isSubtypeOf(_t: Type): boolean {
		return false;
	}

	@strictEqual
	@memoizeBinOp(true)
	public override equals(t: Type): boolean {
		return t === VOID || super.equals(t);
	}
}
