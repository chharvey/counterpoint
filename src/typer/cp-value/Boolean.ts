import type binaryen from 'binaryen';
import {BinVect} from '../../index.js';
import {
	strictEqual,
	instanceOf,
} from '../../lib/index.js';
import type {TYPE} from '../index.js';
import {
	FALSE,
	TRUE,
} from './index.js';
import type {Value} from './Value.js';
import {Primitive} from './Primitive.js';



/**
 * The Counterpoint Language Type `Boolean` has two values: `true` and `false`.
 * These values are constant and the only two instances of this class.
 * @final
 */
class ValueBoolean extends Primitive {
	/** A Unit Type containing only the Counterpoint Language Value `false`. */
	public static get FALSETYPE(): TYPE.Unit<ValueBoolean> {
		return FALSE.toType();
	}

	/** A Unit Type containing only the Counterpoint Language Value `true`. */
	public static get TRUETYPE(): TYPE.Unit<ValueBoolean> {
		return TRUE.toType();
	}

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
	@instanceOf(() => ValueBoolean)
	// @memoizeBinOp(true, true) // memoizing takes longer than a simple comparison
	public override identical(value: Value): boolean {
		return this.data === (value as ValueBoolean).data;
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return new BinVect(mod, this.isTruthy).vect;
	}
}
export {ValueBoolean as Boolean};
