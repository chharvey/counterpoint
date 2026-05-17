import {Primitive} from './Primitive.ts';
import type {
	Integer,
	Natural,
	Float,
} from './index.ts';



/**
 * A numeric Counterpoint Language Value.
 * Known subclasses:
 * - Integer
 * - Natural
 * - Float
 */
abstract class ValueNumber<T = unknown> extends Primitive {
	/**
	 * @final
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.eq0();
	}

	/**
	 * Type-coerce this number into an int.
	 * @returns the equivalent signed integer value
	 */
	public abstract toInt(): Integer;

	/**
	 * Type-coerce this number into a nat.
	 * @returns the equivalent unsigned integer value
	 */
	public abstract toNat(): Natural;

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
	 * @param multiplier - the multiplier
	 * @return the product, `this multiplicand * multiplier`
	 */
	public abstract times(multiplier: T): T;
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
	 * Is the number equal to one?
	 * @returns Is the number equal to one?
	 */
	public abstract eq1(): boolean;
	/**
	 * Is the number strictly less than the argument?
	 * @param y - the argument
	 * @returns Is the number strictly less than the argument?
	 */
	public abstract lt(y: ValueNumber): boolean;
}
export {ValueNumber as Number};
