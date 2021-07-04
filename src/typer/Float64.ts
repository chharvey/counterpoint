import * as xjs from 'extrajs'

import type {SolidType} from './SolidType';
import type {SolidObject} from './SolidObject';
import {SolidNumber} from './SolidNumber';



/**
 * A 64-bit floating-point number.
 * @final
 */
export class Float64 extends SolidNumber<Float64> {
	static override toString(): string {
		return 'float';
	}
	static override values: SolidType['values'] = new Set([new Float64(0.0)])


	constructor (private readonly value: number = 0) {
		super()
		xjs.Number.assertType(this.value, xjs.NumericType.FINITE)
	}

	override toString(): string {
		return `${ this.value }`
	}
	protected override identical_helper(value: SolidObject): boolean {
		return value instanceof Float64 && this.is(value)
	}
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		return value instanceof SolidNumber && this.eq(value.toFloat())
	}

	override toFloat(): this {
		return this
	}

	override plus(addend: Float64): Float64 {
		return new Float64(this.value + addend.value)
	}
	override minus(subtrahend: Float64): Float64 {
		return new Float64(this.value - subtrahend.value)
	}
	override times(multiplicand: Float64): Float64 {
		return new Float64(this.value * multiplicand.value)
	}
	override divide(divisor: Float64): Float64 {
		if (divisor.value === 0) { throw new RangeError('Division by zero.') }
		return new Float64(this.value / divisor.value)
	}
	override exp(exponent: Float64): Float64 {
		return new Float64(this.value ** exponent.value)
	}
	override neg(): Float64 {
		return new Float64(-this.value)
	}
	protected override is(fl: Float64): boolean {
		return this === fl || Object.is(this.value, fl.value)
	}
	protected override eq(fl: Float64): boolean {
		return this.is(fl) || this.value === fl.value
	}
	/**
	 * The floating-point numbers `0.0` and `-0.0`, while not identical, are mathematically equal.
	 */
	override eq0(): boolean {
		return this.value === 0
	}
	override lt(y: Float64): boolean {
		return this.value < y.value
	}
}
