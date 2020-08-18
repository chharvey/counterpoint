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
	/**
	 * Return the “logical value” of this value.
	 * @returns the associated Boolean value of this value
	 */
	get isTruthy(): SolidBoolean {
		return (
			(this instanceof SolidNull) ? SolidBoolean.FALSE :
			(this instanceof SolidBoolean) ? this :
			SolidBoolean.TRUE
		)
	}
	/**
	 * Is this value the same exact object as the argument?
	 * @param value the object to compare
	 * @returns are the objects identically the same?
	 * @final
	 */
	identical(value: SolidLanguageValue): boolean {
		return this === value || this.identical_helper(value)
	}
	/**
	 * Helper method for {@link this.identical}. Override as needed.
	 * @param _value the object to compare
	 * @returns are the objects identically the same?
	 */
	protected identical_helper(_value: SolidLanguageValue): boolean {
		return false
	}
	/**
	 * Are the values considered equal?
	 * If {@link this.identical} returns `true`, this method will return `true`.
	 * @param value the object to compare
	 * @returns are the objects equal?
	 * @final
	 */
	equal(value: SolidLanguageValue): boolean {
		return this.identical(value) || this.equal_helper(value)
	}
	/**
	 * Helper method for {@link this.equal}. Override as needed.
	 * @param _value the object to compare
	 * @returns are the objects equal?
	 */
	protected equal_helper(_value: SolidLanguageValue): boolean {
		return false
	}
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
	/** @override */
	toString(): string {
		return 'null'
	}
	/** @override */
	protected identical_helper(value: SolidLanguageValue): boolean {
		return value instanceof SolidNull
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
	/**
	 * Return the Solid Language Value `true` or `false` based on the argument.
	 * @param b a native boolean value
	 * @returns the argument converted into a SolidBoolean
	 */
	static fromBoolean(b: boolean): SolidBoolean {
		return (b) ? SolidBoolean.TRUE : SolidBoolean.FALSE
	}
	/**
	 * Construct a new SolidBoolean object.
	 * @param value The native boolean value of this object.
	 */
	protected constructor (readonly value: boolean = false) {
		super()
	}
	/** @override */
	toString(): string {
		return `${ this.value }`
	}
	/** @override */
	protected identical_helper(value: SolidLanguageValue): boolean {
		return value instanceof SolidBoolean && this.value === value.value
	}
	/**
	 * Return the negation of this Boolean.
	 * @returns `true <-|-> false`
	 */
	get not(): SolidBoolean {
		return SolidBoolean.fromBoolean(!this.value)
	}
	/**
	 * Compute the logical conjunction of this value with the argument.
	 * @param sb the right-hand operator
	 * @returns `this && sb`
	 */
	and(sb: SolidBoolean): SolidBoolean {
		return SolidBoolean.fromBoolean(this.value && sb.value)
	}
	/**
	 * Compute the logical disjunction of this value with the argument.
	 * @param sb the right-hand operator
	 * @returns `this || sb`
	 */
	or(sb: SolidBoolean): SolidBoolean {
		return SolidBoolean.fromBoolean(this.value || sb.value)
	}
}



/**
 * A numeric Solid Language Value.
 */
export abstract class SolidNumber<T = unknown> extends SolidLanguageValue {
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



export class SolidString extends SolidLanguageValue {
}
