import {Primitive} from './Primitive.js';
import type {Float} from './index.js';



/**
 * A numeric Counterpoint Language Value.
 * Known subclasses:
 * - Integer
 * - Float
 */
abstract class CPNumber<T = unknown> extends Primitive {
	/**
	 * @final
	 */
	public override get isEmpty(): boolean {
		return this.eq0();
	}

	/**
	 * Type-coerce this number into a float.
	 * @returns the equivalent floating-point value
	 */
	public abstract toFloat(): Float;

	/**
	 * Add two numbers.
	 * @param addend - the addend
	 * @return the sum, `this augend + addend`
	 */
	public abstract plus(addend: T): T;
	/**
	 * Subtract two numbers.
	 * @param subtrahend - the subtrahend
	 * @return the difference, `this minuend - subtrahend`
	 */
	public abstract minus(subtrahend: T): T;
	/**
	 * Multiply two numbers.
	 * @param multiplicand - the multiplicand
	 * @return the product, `this multiplier * multiplicand`
	 */
	public abstract times(multiplicand: T): T;
	/**
	 * Divide two numbers.
	 * @param divisor - the divisor
	 * @return the quotient, `this dividend / divisor`
	 * @throws {RangeError} if the divisor is zero
	 */
	public abstract divide(divisor: T): T;
	/**
	 * Exponentiate two numbers.
	 * @param exponent - the exponent
	 * @return the power, `this base ^ exponent`
	 */
	public abstract exp(exponent: T): T;
	/**
	 * Return the negation (additive inverse) of this number.
	 * @return the additive inverse of this number
	 */
	public abstract neg(): T;
	/**
	 * Is the number equal to zero?
	 * @returns Is the number equal to zero?
	 */
	public abstract eq0(): boolean;
	/**
	 * Is the number strictly less than the argument?
	 * @param y - the argument
	 * @returns Is the number strictly less than the argument?
	 */
	public abstract lt(y: T): boolean;
}
export {CPNumber as Number};
