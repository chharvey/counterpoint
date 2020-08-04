import {
	SolidNumber,
} from './SolidLanguageValue.class'



/**
 * A 64-bit floating-point number.
 * @final
 */
export default class Float64 extends SolidNumber<Float64> {
	constructor (readonly value: number = 0) {
		super()
	}
	/** @override */
	toString(): string {
		return `${ this.value }`
	}
	/** @override */
	toFloat(): this {
		return this
	}

	/** @override */
	plus(addend: Float64): Float64 {
		return new Float64(this.value + addend.value)
	}
	/** @override */
	minus(subtrahend: Float64): Float64 {
		return new Float64(this.value - subtrahend.value)
	}
	/** @override */
	times(multiplicand: Float64): Float64 {
		return new Float64(this.value * multiplicand.value)
	}
	/** @override */
	divide(divisor: Float64): Float64 {
		if (divisor.value === 0) { throw new RangeError('Division by zero.') }
		return new Float64(this.value / divisor.value)
	}
	/** @override */
	exp(exponent: Float64): Float64 {
		return new Float64(this.value ** exponent.value)
	}
	/** @override */
	neg(): Float64 {
		return new Float64(-this.value)
	}
	/**
	 * @override
	 * The floating-point numbers `0.0` and `-0.0`, while not identical, are mathematically equal.
	 */
	eq0(): boolean {
		return this.value === 0
	}
}
