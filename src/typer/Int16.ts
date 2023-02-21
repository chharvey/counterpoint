import type binaryen from 'binaryen';
import {Float64} from './index.js';
import type {SolidObject} from './SolidObject.js';
import {SolidNumber} from './SolidNumber.js';



const BITS_PER_BYTE = 8;



/**
 * A 16-bit signed integer in two’s complement.
 * @final
 */
export class Int16 extends SolidNumber<Int16> {
	private static readonly BITCOUNT: number = Int16Array.BYTES_PER_ELEMENT * BITS_PER_BYTE;
	public  static readonly ZERO             = new Int16(0n);
	public  static readonly UNIT             = new Int16(1n);


	/**
	 * Internal implementation of this Int16.
	 * A signed array of 16-bit integers with length 1.
	 */
	private readonly internal: Readonly<Int16Array>;

	/**
	 * Construct a new Int16 object from a bigint or from data.
	 * @param data - a numeric value or data
	 * @returns the value represented as a 16-bit signed integer
	 */
	public constructor(data: bigint = 0n) {
		const internal = new Int16Array(1);
		internal[0] = Number(data);
		super();
		this.internal = internal;
	}

	override toString(): string {
		return `${ this.toNumeric() }`;
	}

	protected override identical_helper(value: SolidObject): boolean {
		return value instanceof Int16 && this.internal[0] === value.internal[0];
	}

	protected override equal_helper(value: SolidObject): boolean {
		return value instanceof Float64 && this.toFloat().equal(value);
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.i32.const(Number(this.toNumeric()));
	}

	public override toFloat(): Float64 {
		return new Float64(Number(this.toNumeric()));
	}

	/**
	 * Return the signed or unsigned interpretation of this integer.
	 * @param  u Interpret as unsigned?
	 * @return   the numeric value
	 */
	public toNumeric(u: boolean = false): bigint {
		const signed: number = this.internal[0];
		return BigInt(u && signed < 0 ? signed + 2 ** Int16.BITCOUNT : signed);
	}

	public override plus(addend: Int16): Int16 {
		return new Int16(BigInt(this.internal[0] + addend.internal[0]));
	}

	public override minus(subtrahend: Int16): Int16 {
		return new Int16(BigInt(this.internal[0] - subtrahend.internal[0]));
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
	public override times(multiplicand: Int16): Int16 {
		return new Int16(BigInt(this.internal[0] * multiplicand.internal[0]));
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
	public override divide(divisor: Int16): Int16 {
		if (divisor.eq0()) {
			throw new RangeError('Division by zero.');
		}
		return new Int16(BigInt(Math.trunc(this.internal[0] / divisor.internal[0])));
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
	public override exp(exponent: Int16): Int16 {
		return new Int16(BigInt(this.internal[0] ** exponent.internal[0]));
	}

	/**
	 * Equivalently, this is the “two’s complement” of the integer.
	 */
	public override neg(): Int16 {
		return new Int16(BigInt(-this.internal[0]));
	}

	public override eq0(): boolean {
		return this.equal(Int16.ZERO);
	}

	public override lt(y: Int16): boolean {
		return this.internal[0] < y.internal[0];
	}
}
