import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {BinVect} from '../../index.js';
import {
	strictEqual,
	instanceOf,
} from '../../lib/index.js';
import {equalsDeco} from './decorators.js';
import type {Object as CPObject} from './Value.js';
import {Number as CPNumber} from './Number.js';



/**
 * A 64-bit floating-point number.
 * @final
 */
export class Float extends CPNumber<Float> {
	public constructor(private readonly data: number = 0) {
		super();
		xjs.Number.assertType(this.data, xjs.NumericType.FINITE);
	}

	public override toString(): string {
		return `${ this.data }${ (this.data % 1 === 0) ? '.0' : '' }`;
	}

	@strictEqual
	@instanceOf(() => Float)
	// @memoizeBinOp(true, true) // memoizing takes longer than a simple comparison
	public override identical(value: CPObject): boolean {
		return Object.is(this.data, (value as Float).data);
	}

	@strictEqual
	@equalsDeco
	@instanceOf(() => CPNumber)
	// @memoizeBinOp(true, true) // memoizing takes longer than a simple comparison
	public override equal(value: CPObject): boolean {
		return this.data === (value as CPNumber).toFloat().data;
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return new BinVect(
			mod,
			Object.is(this.data, -0.0)
				? mod.f64.ceil(mod.f64.const(-0.5))
				: mod.f64.const(this.data),
		).vect;
	}

	public override toFloat(): this {
		return this;
	}

	public override plus(addend: Float): Float {
		return new Float(this.data + addend.data);
	}

	public override minus(subtrahend: Float): Float {
		return new Float(this.data - subtrahend.data);
	}

	public override times(multiplicand: Float): Float {
		return new Float(this.data * multiplicand.data);
	}

	public override divide(divisor: Float): Float {
		if (divisor.data === 0) {
			throw new RangeError('Division by zero.');
		}
		return new Float(this.data / divisor.data);
	}

	public override exp(exponent: Float): Float {
		return new Float(this.data ** exponent.data);
	}

	public override neg(): Float {
		return new Float(-this.data);
	}

	/**
	 * The floating-point numbers `0.0` and `-0.0`, while not identical, are mathematically equal.
	 */
	public override eq0(): boolean {
		return this.data === 0;
	}

	public override lt(y: Float): boolean {
		return this.data < y.data;
	}
}
