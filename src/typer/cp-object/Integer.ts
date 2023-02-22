import type binaryen from 'binaryen';
import {throw_expression} from '../../lib/index.js';
import {Float} from './index.js';
import type {Object as CPObject} from './Object.js';
import {Number as CPNumber} from './Number.js';



const BITS_PER_BYTE = 8;



/**
 * A 16-bit signed integer in two’s complement.
 * @final
 */
export class Integer extends CPNumber<Integer> {
	public static readonly ZERO = new Integer(0n);
	public static readonly UNIT = new Integer(1n);


	/**
	 * Internal implementation of this Int16.
	 * A 16-bit integer stored in a Int16Array.
	 */
	private readonly data: number;

	/**
	 * Construct a new Integer object from a bigint or from data.
	 * @param data - a numeric value or data
	 * @returns the value represented as a 16-bit signed integer
	 */
	public constructor(data: bigint = 0n) {
		const internal = new Int16Array(1);
		internal[0] = Number(data); // need to store in Int16Array first to ensure 16-bit
		super();
		this.data = internal[0];
	}

	public override toString(): string {
		return `${ this.toNumber() }`;
	}

	protected override identical_helper(value: CPObject): boolean {
		return value instanceof Integer && this.data === value.data;
	}

	protected override equal_helper(value: CPObject): boolean {
		return value instanceof Float && this.toFloat().equal(value);
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.i32.const(this.toNumber());
	}

	public override toFloat(): Float {
		return new Float(this.toNumber());
	}

	/**
	 * Return the signed or unsigned interpretation of this integer.
	 * @param  u Interpret as unsigned?
	 * @return   the numeric value
	 */
	public toNumber(u: boolean = false): number {
		return u && this.data < 0 ? this.data + 2 ** (Int16Array.BYTES_PER_ELEMENT * BITS_PER_BYTE) : this.data;
	}

	public override plus(addend: Integer): Integer {
		return new Integer(BigInt(this.data + addend.data));
	}

	public override minus(subtrahend: Integer): Integer {
		return new Integer(BigInt(this.data - subtrahend.data));
	}

	/**
	 * ```ts
	 * function mulSlow(multiplier: number, multiplicand: number): number {
	 * 	return (
	 * 		(multiplier === 0) ? 0                 :
	 * 		(multiplier === 1) ? multiplicand      :
	 * 		(multiplier === 2) ? multiplicand << 1 :
	 * 		(multiplicand <   0) ? -mulSlow(multiplier, -multiplicand) :
	 * 		(multiplicand === 0) ? 0                                   :
	 * 		(multiplicand === 1) ? multiplier                          :
	 * 		(multiplicand === 2) ? multiplier << 1                     :
	 * 		multiplier + mulSlow(multiplier, multiplicand - 1)
	 * 	)
	 * }
	 * function mulFast(multiplier: number, multiplicand: number): number {
	 * 	return (
	 * 		(multiplier === 0) ? 0                 :
	 * 		(multiplier === 1) ? multiplicand      :
	 * 		(multiplier === 2) ? multiplicand << 1 :
	 * 		(multiplicand <   0) ? -mulFast(multiplier, -multiplicand) :
	 * 		(multiplicand === 0) ? 0                                   :
	 * 		(multiplicand === 1) ? multiplier                          :
	 * 		(multiplicand === 2) ? multiplier << 1                     :
	 * 		(multiplicand % 2 === 0)
	 * 			?              mulFast(multiplier * 2,  multiplicand      / 2)
	 * 			: multiplier + mulFast(multiplier * 2, (multiplicand - 1) / 2)
	 * 	)
	 * }
	 * ```
	 */
	public override times(multiplicand: Integer): Integer {
		return new Integer(BigInt(this.data * multiplicand.data));
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
		return (divisor.eq0())
			? throw_expression(new RangeError('Division by zero.'))
			: new Integer(BigInt(Math.trunc(this.data / divisor.data)));
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
	 * 		(exponent % 2 === 0)
	 * 			?        expFast(base ** 2,  exponent      / 2)
	 * 			: base * expFast(base ** 2, (exponent - 1) / 2)
	 * 	);
	 * }
	 * ```
	 * @see https://stackoverflow.com/a/101613/877703
	 */
	public override exp(exponent: Integer): Integer {
		return new Integer(BigInt(this.data ** exponent.data));
	}

	/**
	 * Equivalently, this is the “two’s complement” of the integer.
	 */
	public override neg(): Integer {
		return new Integer(BigInt(-this.data));
	}

	public override eq0(): boolean {
		return this.equal(Integer.ZERO);
	}

	public override lt(y: Integer): boolean {
		return this.data < y.data;
	}
}
