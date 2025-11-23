import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type Builder,
	BinVect,
} from '../../index.ts';
import {
	strictEqual,
	instanceOf,
} from '../utils-private.ts';
import {Integer} from './index.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import {Number as ValueNumber} from './Number.ts';



/**
 * A 64-bit floating-point number.
 * @final
 */
export class Float extends ValueNumber<Float> {
	public constructor(private readonly data: number = 0.0) {
		super();
		xjs.Number.assertType(this.data, xjs.NumericType.FINITE);
	}

	public override toString(): string {
		return `${ this.data }${ Number.isInteger(this.data) ? '.0' : '' }`;
	}

	@strictEqual
	@instanceOf(() => Float)
	// @memoizeBinOp(true, true) // memoizing takes longer than a simple comparison
	public override identical(value: Value): boolean {
		return Object.is(this.data, (value as Float).data);
	}

	@strictEqual
	@identical
	@instanceOf(() => ValueNumber)
	// @memoizeBinOp(true, true) // memoizing takes longer than a simple comparison
	public override equal(value: Value): boolean {
		return this.data === (value as ValueNumber).toFloat().data;
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return new BinVect(
			builder.module,
			Object.is(this.data, -0.0)
				? builder.module.f64.ceil(builder.module.f64.const(-0.5))
				: builder.module.f64.const(this.data),
		).vect;
	}

	public override toInt(): Integer {
		return new Integer(BigInt(Math.trunc(this.data)));
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

	public override times(multiplier: Float): Float {
		return new Float(this.data * multiplier.data);
	}

	public override divide(divisor: Float): Float {
		if (divisor.eq0()) {
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
		return this.data === 0.0;
	}

	public override eq1(): boolean {
		return this.data === 1.0;
	}

	public override lt(y: ValueNumber): boolean {
		return this.data < (y instanceof Float ? y.data : y.toFloat().data);
	}
}
