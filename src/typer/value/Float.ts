import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../../index.ts';
import {
	noopMethod,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import {Number as ValueNumber} from './Number.ts';
import {Integer} from './Integer.ts';
import {Natural} from './Natural.ts';



/**
 * A 64-bit floating-point number.
 * @final
 */
export class Float extends ValueNumber<Float> {
	public constructor(private readonly data: number = 0.0) {
		xjs.Number.assertType(data, xjs.NumericType.FINITE);
		super();
	}

	public override toString(): string {
		return `${ this.data }${ Number.isInteger(this.data) ? '.0' : '' }`;
	}

	@strictEqual
	@noopMethod(memoizeBinOp(true, true))
	@instanceOf(() => Float)
	public override identical(value: Value): boolean {
		return Object.is(this.data, (value as Float).data);
	}

	@strictEqual
	@identical
	@noopMethod(memoizeBinOp(true, true))
	@instanceOf(() => ValueNumber)
	public override equal(value: Value): boolean {
		// non-identical Floats can be equal in exactly one case: `0.0` and `-0.0`
		return this.data === (value as ValueNumber).toFloat().data;
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newPrimitive(cg.vm.Vect.newFloat((Object.is(this.data, -0.0)
			? cg.mod.f64.ceil(cg.mod.f64.const(-0.5))
			: cg.mod.f64.const(this.data)
		)));
	}

	public override toInt(): Integer {
		return new Integer(BigInt(Math.trunc(this.data)));
	}

	public override toNat(): Natural {
		const trunc = BigInt(Math.trunc(this.data));
		return new Natural(trunc < 0n ? 0n : trunc);
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
		return this.data < y.toFloat().data;
	}
}
