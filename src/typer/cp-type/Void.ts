import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../cp-value/index.ts';
import {
	NEVER,
	VOID,
} from './index.ts';
import {
	intersectionRules,
	subtypeRules,
	Type,
} from './Type.ts';



/**
 * Class for constructing the `void` type.
 * @final
 */
export class Void extends Type {
	public constructor() {
		super(false);
	}

	public override toString(): string {
		return 'void';
	}

	public override get isReference(): boolean {
		throw new Error();
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
