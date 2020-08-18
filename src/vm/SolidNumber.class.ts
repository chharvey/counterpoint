import SolidObject from './SolidObject.class'
import type Float64 from './Float64.class'



/**
 * A numeric Solid Language Value.
 */
export default abstract class SolidNumber<T> extends SolidObject {
	/**
	 * Type-coerse this number into a float.
	 * @returns the equivalent floating-point value
	 */
	abstract toFloat(): Float64;

	/**
	 * Add two numbers.
	 * @param addend - the addend
	 * @return the sum, `this augend + addend`
	 */
	abstract plus(addend: T): T;
	/**
	 * Subtract two numbers.
	 * @param subtrahend - the subtrahend
	 * @return the difference, `this minuend - subtrahend`
	 */
	abstract minus(subtrahend: T): T;
	/**
	 * Multiply two numbers.
	 * @param multiplicand - the multiplicand
	 * @return the product, `this multiplier * multiplicand`
	 */
	abstract times(multiplicand: T): T;
	/**
	 * Divide two numbers.
	 * @param divisor - the divisor
	 * @return the quotient, `this dividend / divisor`
	 * @throws {RangeError} if the divisor is zero
	 */
	abstract divide(divisor: T): T;
	/**
	 * Exponentiate two numbers.
	 * @param exponent - the exponent
	 * @return the power, `this base ^ exponent`
	 */
	abstract exp(exponent: T): T;
	/**
	 * Return the negation (additive inverse) of this number.
	 * @return the additive inverse of this number
	 */
	abstract neg(): T;
	/**
	 * Does this number have the same (an identical) bit-wise encoding as the argument?
	 * Note that while the integer values `0` and `-0` are encoded the same,
	 * the floating-point values `0.0` and `-0.0` do not have the same encoding.
	 * @param x the number to compare
	 * @returns are the numbers identically the same?
	 */
	protected abstract is(x: T): boolean;
	/**
	 * Are the numbers mathematically equal?
	 * This treats all integer and all non-zero floating-point numbers the same as does {@link #is},
	 * while also returning `true` for the floating-point values `0.0` and `-0.0`.
	 * @param x the number to compare
	 * @returns do the numbers have the same mathematical value?
	 */
	protected abstract eq(x: T): boolean;
	/**
	 * Is the number equal to zero?
	 * @returns Is the number equal to zero?
	 */
	abstract eq0(): boolean;
	/**
	 * Is the number strictly less than the argument?
	 * @returns Is the number strictly less than the argument?
	 */
	abstract lt(y: T): boolean;
}
