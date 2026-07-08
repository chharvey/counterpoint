import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	noopMethod,
	memoizeMethod,
} from '../../lib/index.ts';
import {TYPE} from '../index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import type {Value} from './Value.ts';
import {Primitive} from './Primitive.ts';



/**
 * The class for the Counterpoint Language Value `null`.
 *
 * A Null object is used as a placeholder for missing values.
 * It has no fields or methods, and it is “falsy” when used as a condition.
 *
 * This class is a singleton: there exists only one instance.
 * The reference to the instance of this class is a constant named `null`.
 *
 * @final
 */
export class Null extends Primitive {
	public constructor() {
		super();
	}

	public override toString(): string {
		return 'null';
	}

	public override get isTruthy(): boolean {
		return false;
	}

	@strictEqual
	@noopMethod(memoizeBinOp(true, true))
	@instanceOf(() => Null)
	public override identical(_value: Value): boolean {
		return true;
	}

	@noopMethod(memoizeMethod)
	public override toType(): TYPE.Unit<this> {
		// @ts-expect-error --- this class is final, so type `this` will always be type `Null`
		return TYPE.NULL;
	}

	@noopMethod(memoizeMethod)
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.getConst(null);
	}
}
