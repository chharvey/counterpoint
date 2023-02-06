import type binaryen from 'binaryen';
import * as xjs from 'extrajs'
import type {SolidObject} from './SolidObject.js';
import {SolidNumber} from './SolidNumber.js';



/**
 * A 64-bit floating-point number.
 * @final
 */
export class Float64 extends SolidNumber<Float64> {
	constructor (private readonly data: number = 0) {
		super()
		xjs.Number.assertType(this.data, xjs.NumericType.FINITE);
	}

	override toString(): string {
		return `${ this.data }${ (this.data % 1 === 0) ? '.0' : '' }`;
	}
	protected override identical_helper(value: SolidObject): boolean {
		return value instanceof Float64 && Object.is(this.data, value.data);
	}
	protected override equal_helper(value: SolidObject): boolean {
		return value instanceof SolidNumber && this.data === value.toFloat().data;
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		if (Object.is(this.data, -0.0)) {
			return mod.f64.ceil(mod.f64.const(-0.5));
		}
		return mod.f64.const(this.data);
	}

	override toFloat(): this {
		return this
	}

	override plus(addend: Float64): Float64 {
		return new Float64(this.data + addend.data);
	}
	override minus(subtrahend: Float64): Float64 {
		return new Float64(this.data - subtrahend.data);
	}
	override times(multiplicand: Float64): Float64 {
		return new Float64(this.data * multiplicand.data);
	}
	override divide(divisor: Float64): Float64 {
		if (divisor.data === 0) { throw new RangeError('Division by zero.'); }
		return new Float64(this.data / divisor.data);
	}
	override exp(exponent: Float64): Float64 {
		return new Float64(this.data ** exponent.data);
	}
	override neg(): Float64 {
		return new Float64(-this.data);
	}
	/**
	 * The floating-point numbers `0.0` and `-0.0`, while not identical, are mathematically equal.
	 */
	override eq0(): boolean {
		return this.data === 0;
	}
	override lt(y: Float64): boolean {
		return this.data < y.data;
	}
}
