import type binaryen from 'binaryen';
import {
	bigint_to_i64,
	type CodeGenerator,
} from '../../index.ts';
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
	Natural,
	Float,
} from './index.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import {Number as ValueNumber} from './Number.ts';



/**
 * A 64-bit signed integer in two’s complement.
 * @final
 */
export class Integer extends ValueNumber<Integer> {
	/**
	 * Internal implementation of this Integer.
	 * A 64-bit integer stored in a BigInt64Array.
	 */
	private readonly data: bigint;

	/**
	 * Construct a new Integer object from a bigint or from data.
	 * @param data - a numeric value or data
	 * @returns the value represented as a 64-bit signed integer
	 */
	public constructor(data: bigint = 0n) {
		super();
		const internal = new BigInt64Array([data]); // need to store in BigInt64Array first to ensure 64-bit and signed
		this.data = internal[0];
	}

	public override toString(): string {
		return `${ this.data }`;
	}

	@strictEqual
	@noopMethod(memoizeBinOp(true, true))
	@instanceOf(() => Integer)
	public override identical(value: Value): boolean {
		return this.data === (value as Integer).data;
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueNumber)
	public override equal(value: Value): boolean {
		if (value instanceof Integer) {
			// non-identical Integers will never be equal
			return false;
		}
		if (value instanceof Natural) {
			return this.toNat().equal(value);
		}
		return this.toFloat().equal(value);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newPrimitive(cg.vm.Vect.newInt(bigint_to_i64(cg.mod, this.data)));
	}

	public override toInt(): Integer {
		return this;
	}

	public override toNat(): Natural {
		return new Natural(this.data);
	}

	public override toFloat(): Float {
		return new Float(Number(this.data));
	}

	/**
	 * Return the signed interpretation of this Integer.
	 * @return   the numeric value
	 */
	public toBigInt(): bigint {
		return this.data;
	}

	public override plus(addend: Integer): Integer {
		return new Integer(this.data + addend.data);
	}

	public override minus(subtrahend: Integer): Integer {
		return new Integer(this.data - subtrahend.data);
	}

	/**
	 * ```ts
	 * function mulSlow(multiplicand: number, multiplier: number): number {
	 * 	return (
	 * 		(multiplicand === 0) ? 0 :
	 * 		(multiplicand === 1) ? multiplier :
	 * 		(multiplicand === 2) ? multiplier << 1 :
	 * 		(multiplier <   0) ? -mulSlow(multiplicand, -multiplier) :
	 * 		(multiplier === 0) ? 0 :
	 * 		(multiplier === 1) ? multiplicand :
	 * 		(multiplier === 2) ? multiplicand << 1 :
	 * 		multiplicand + mulSlow(multiplicand, multiplier - 1)
	 * 	)
	 * }
	 * function mulFast(multiplicand: number, multiplier: number): number {
	 * 	return (
	 * 		(multiplicand === 0) ? 0 :
	 * 		(multiplicand === 1) ? multiplier :
	 * 		(multiplicand === 2) ? multiplier << 1 :
	 * 		(multiplier <   0) ? -mulFast(multiplicand, -multiplier) :
	 * 		(multiplier === 0) ? 0 :
	 * 		(multiplier === 1) ? multiplicand :
	 * 		(multiplier === 2) ? multiplicand << 1 :
	 * 		(multiplier % 2 === 0)
	 * 			?                mulFast(multiplicand * 2,  multiplier      / 2)
	 * 			: multiplicand + mulFast(multiplicand * 2, (multiplier - 1) / 2)
	 * 	)
	 * }
	 * ```
	 */
	public override times(multiplier: Integer): Integer {
		return new Integer(this.data * multiplier.data);
	}

	/**
	 * ```ts
	 * function divSlow(dividend: number, divisor: number): number {
	 * 	return (
	 * 		(divisor  === 0) ? throw new NanError('Division by zero.') :
	 * 		(dividend === 0) ? 0                                       :
	 * 		(divisor  <   0) ? -divSlow(dividend, -divisor)            :
	 * 		(dividend <   0) ? -divSlow(-dividend, divisor)            :
	 * 		(divisor === 1) ? dividend      :
	 * 		(divisor === 2) ? dividend >> 1 :
	 * 		((): int => {
	 * 			let quotient: int = 0;
	 * 			while (dividend  = divisor) {
	 * 				dividend -= divisor;
	 * 				++quotient;
	 * 			}
	 * 			return quotient;
	 * 		})()
	 * 	);
	 * }
	 * function divFast(dividend: number, divisor: number): number {
	 * 	return (
	 * 		(divisor  === 0) ? throw new NanError('Division by zero.') :
	 * 		(dividend === 0) ? 0                                       :
	 * 		(divisor  <   0) ? -divFast( dividend, -divisor)           :
	 * 		(dividend <   0) ? -divFast(-dividend,  divisor)           :
	 * 		(divisor === 1) ? dividend      :
	 * 		(divisor === 2) ? dividend >> 1 :
	 * 		((): int => {
	 * 			let quotient:  int = 0;
	 * 			let remainder: int = 0;
	 * 			for (let i = 0; i < BITCOUNT; i++) {
	 * 				remainder = remainder << 1;
	 * 				remainder[BITCOUNT - 1] = dividend[i];
	 * 				if (remainder >= divisor) {
	 * 					remainder = remainder - divisor;
	 * 					quotient[i] = true;
	 * 				}
	 * 			}
	 * 			return quotient;
	 * 		})()
	 * 	);
	 * }
	 * ```
	 */
	public override divide(divisor: Integer): Integer {
		if (divisor.eq0()) {
			throw new RangeError('Division by zero.');
		}
		return new Integer(this.data / divisor.data);
	}

	/**
	 * ```ts
	 * function expSlow(base: number, exponent: number): number {
	 * 	return (
	 * 		(exponent <   0) ? 0           :
	 * 		(exponent === 0) ? 1           :
	 * 		(exponent === 1) ? base        :
	 * 		(exponent === 2) ? base * base :
	 * 		base * expSlow(base, exponent - 1)
	 * 	);
	 * }
	 * function expFast(base: number, exponent: number): number {
	 * 	return (
	 * 		(exponent <   0) ? 0           :
	 * 		(exponent === 0) ? 1           :
	 * 		(exponent === 1) ? base        :
	 * 		(exponent === 2) ? base * base :
	 * 		(base === 0)     ? 0           :
	 * 		(base === 1)     ? 1           :
	 * 		(base === 2 && exponent < 64) ? 1 << exponent : // `1 << x` (when `x` is less than bit width) is a more performant way to do `2 ** x`
	 * 		(exponent % 2 === 0)
	 * 			// `x >> 1` is a more performant way to do `x / 2`
	 * 			?        expFast(base ** 2,  exponent      >> 1)
	 * 			: base * expFast(base ** 2, (exponent - 1) >> 1)
	 * 	);
	 * }
	 * ```
	 * @see https://stackoverflow.com/a/101613/877703
	 */
	public override exp(exponent: Integer): Integer {
		return new Integer(this.data ** exponent.data);
	}

	/**
	 * Equivalently, this is the “two’s complement” of the integer.
	 */
	public override neg(): Integer {
		return new Integer(-this.data);
	}

	public override eq0(): boolean {
		return this.data === 0n;
	}

	public override eq1(): boolean {
		return this.data === 1n;
	}

	public override lt(y: ValueNumber): boolean {
		if (y instanceof Integer) {
			return this.data < y.data;
		}
		if (y instanceof Natural) {
			return this.toNat().lt(y);
		}
		return this.toFloat().lt(y);
	}
}
