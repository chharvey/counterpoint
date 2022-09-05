import * as xjs from 'extrajs'
import type {Object as CPObject} from './Object.js';
import {Number} from './Number.js';



/**
 * A 64-bit floating-point number.
 * @final
 */
export class Float extends Number<Float> {
	constructor (private readonly data: number = 0) {
		super()
		xjs.Number.assertType(this.data, xjs.NumericType.FINITE);
	}

	override toString(): string {
		return `${ this.data }${ (this.data % 1 === 0) ? '.0' : '' }`;
	}
	protected override identical_helper(value: CPObject): boolean {
		return value instanceof Float && Object.is(this.data, value.data);
	}
	protected override equal_helper(value: CPObject): boolean {
		return value instanceof Number && this.data === value.toFloat().data;
	}

	override toFloat(): this {
		return this
	}

	override plus(addend: Float): Float {
		return new Float(this.data + addend.data);
	}
	override minus(subtrahend: Float): Float {
		return new Float(this.data - subtrahend.data);
	}
	override times(multiplicand: Float): Float {
		return new Float(this.data * multiplicand.data);
	}
	override divide(divisor: Float): Float {
		if (divisor.data === 0) { throw new RangeError('Division by zero.'); }
		return new Float(this.data / divisor.data);
	}
	override exp(exponent: Float): Float {
		return new Float(this.data ** exponent.data);
	}
	override neg(): Float {
		return new Float(-this.data);
	}
	/**
	 * The floating-point numbers `0.0` and `-0.0`, while not identical, are mathematically equal.
	 */
	override eq0(): boolean {
		return this.data === 0;
	}
	override lt(y: Float): boolean {
		return this.data < y.data;
	}
}
