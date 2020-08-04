import type Float64 from './Float64.class'



/**
 * Parent class for all Solid Language Values.
 * Known subclasses:
 * - Null
 * - Boolean
 * - Int16
 * - Float64
 */
export default class SolidLanguageValue {
}



/**
 * The class for the Solid Language Value `null`.
 *
 * A Null object is used as a placeholder for missing values.
 * It has no fields or methods, and it is “falsy” when used as a condition.
 *
 * This class is a singleton: there exists only one instance.
 * The reference to the instance of this class is a constant named `null`.
 *
 * The type of the value `null` is this class (the class `Null`),
 * but as a shorthand in type declarations that type is referred to as `null`.
 *
 * @final
 */
export class SolidNull extends SolidLanguageValue {
	/** The Solid Language Value `null`. */
	static readonly NULL: SolidNull = new SolidNull()
	private constructor () {
		super()
	}
	toString(): string {
		return 'null'
	}
}



/**
 * The Solid Language Type `Boolean` has two values: `true` and `false`.
 * These values are constant and the only two instances of this class.
 *
 * The type of the boolean values is this class (the class `Boolean`),
 * but as a shorthand in type declarations that type is referred to as `bool`.
 *
 * @final
 */
export class SolidBoolean extends SolidLanguageValue {
	/** The Solid Language Value `false`. */
	static readonly FALSE: SolidBoolean = new SolidBoolean()
	/** The Solid Language Value `true`. */
	static readonly TRUE: SolidBoolean = new SolidBoolean(true)
	protected constructor (private readonly value: boolean = false) {
		super()
	}
	toString(): string {
		return `${ this.value }`
	}
}



/**
 * A numeric Solid Language Value.
 */
export abstract class SolidNumber<T> extends SolidLanguageValue {
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
	 * Is the number equal to zero?
	 * @returns Is the number equal to zero?
	 */
	abstract eq0(): boolean;
}
