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
import {
	FALSE,
	TRUE,
} from './index.ts';
import type {Value} from './Value.ts';
import {Primitive} from './Primitive.ts';



/**
 * The Counterpoint Language Type `Boolean` has two values: `true` and `false`.
 * These values are constant and the only two instances of this class.
 * @final
 */
class ValueBoolean extends Primitive {
	/**
	 * Return the Counterpoint Language Value `true` or `false` based on the argument.
	 * @param b a native boolean value
	 * @returns the argument converted into a ValueBoolean
	 */
	public static fromBoolean(b: boolean): ValueBoolean {
		return b ? TRUE : FALSE;
	}

	/**
	 * Construct a new ValueBoolean object.
	 * @param data The native boolean value of this object.
	 */
	public constructor(private readonly data: boolean = false) {
		super();
	}

	public override toString(): string {
		return `${ this.data }`;
	}

	public override get isTruthy(): boolean {
		return this.data;
	}

	@strictEqual
	@noopMethod(memoizeBinOp(true, true))
	@instanceOf(() => ValueBoolean)
	public override identical(value: Value): boolean {
		return this.data === (value as ValueBoolean).data;
	}

	@noopMethod(memoizeMethod)
	public override toType(): TYPE.Unit<this> {
		// @ts-expect-error --- this class is final, so type `this` will always be type `ValueBoolean`
		return this.data ? TYPE.TRUE : TYPE.FALSE;
	}

	@noopMethod(memoizeMethod)
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.getConst(this.data);
	}
}
export {ValueBoolean as Boolean};
