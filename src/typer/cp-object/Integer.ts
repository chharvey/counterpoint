import {strictEqual} from './package.js';
import {Float} from './index.js';
import {Object as CPObject} from './Object.js';
import {Number as CPNumber} from './Number.js';



type Datatype = readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
type DatatypeMutable =   [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];



/**
 * A 16-bit signed integer in two’s complement.
 * @final
 */
export class Integer extends CPNumber<Integer> {
	private static readonly BITCOUNT: number = 16

	public  static readonly ZERO:  Integer = new Integer(0n);
	public  static readonly UNIT:  Integer = new Integer(1n);
	private static readonly RADIX: Integer = new Integer(2n);

	private static mod(n: bigint, modulus: bigint): bigint {
		return (n % modulus + modulus) % modulus
	}

	private readonly internal: Datatype;

	/**
	 * Construct a new Integer object from a bigint or from data.
	 * @param data - a numeric value or data
	 * @returns the value represented as a 16-bit signed integer
	 */
	constructor (data: bigint | Datatype = 0n) {
		super()
		this.internal = (typeof data === 'bigint')
			? [...Integer.mod(data, 2n ** BigInt(Integer.BITCOUNT)).toString(2).padStart(Integer.BITCOUNT, '0')].map((bit) => !!+bit) as DatatypeMutable
			: data
	}

	override toString(): string {
		return `${ this.toNumeric() }`
	}
	@strictEqual
	override identical(value: CPObject): boolean {
		return value instanceof Integer && this.internal.every((bit, i) => bit === value.internal[i]);
	}
	@CPObject.equalsDeco
	override equal(value: CPObject): boolean {
		return value instanceof Float && this.toFloat().equal(value);
	}

	override toFloat(): Float {
		return new Float(Number(this.toNumeric()));
	}
	/**
	 * Return the signed interpretation of this integer.
	 * @returns the numeric value
	 */
	toNumeric(): bigint {
		const unsigned: number = this.internal.map((bit, i) => +bit * 2 ** (Integer.BITCOUNT - 1 - i)).reduce((a, b) => a + b);
		return BigInt(unsigned < 2 ** (Integer.BITCOUNT - 1) ? unsigned : unsigned - 2 ** Integer.BITCOUNT);
	}

	override plus(addend: Integer): Integer {
		type Carry = [bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint]
		const sum:   Carry = [...new Array(Integer.BITCOUNT).fill(0n)] as Carry;
		const carry: Carry = [...new Array(Integer.BITCOUNT).fill(0n)] as Carry;
		for (let i = Integer.BITCOUNT - 1; i >= 0; i--) {
			const digit: bigint = carry[i] + BigInt(this.internal[i]) + BigInt(addend.internal[i])
			if (digit <= 1n) {
				sum[i] = digit
			} else {
				sum[i] = digit - 2n
				if (i > 0) {
					carry[i - 1] = 1n
				} // else do nothing (drop the overflow)
			}
		}
		return new Integer(sum.map((bit) => !!bit) as DatatypeMutable);
	}
	override minus(subtrahend: Integer): Integer {
		return this.plus(subtrahend.neg())
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
	override times(multiplicand: Integer): Integer {
		return (
			(this.eq0()) ? Integer.ZERO       :
			(this.eq1()) ? multiplicand       :
			(this.eq2()) ? multiplicand.bsl() :
			(multiplicand.lt0()) ? this.times(multiplicand.neg()).neg() :
			(multiplicand.eq0()) ? Integer.ZERO                         :
			(multiplicand.eq1()) ? this                                 :
			(multiplicand.eq2()) ? this.bsl()                           :
			(multiplicand.isEven())
				?           this.times(Integer.RADIX).times(multiplicand                    .divide(Integer.RADIX))
				: this.plus(this.times(Integer.RADIX).times(multiplicand.minus(Integer.UNIT).divide(Integer.RADIX)))
		)
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
	 * 		(() => {
	 * 			let quotient: int = 0
	 * 			while (dividend  >= divisor) {
	 * 				dividend -= divisor
	 * 				++quotient
	 * 			}
	 * 			return quotient
	 * 		})()
	 * 	)
	 * }
	 * function divFast(dividend: number, divisor: number): number {
	 * 	return (
	 * 		(divisor  === 0) ? throw new NanError('Division by zero.') :
	 * 		(dividend === 0) ? 0                                       :
	 * 		(divisor  <   0) ? -divFast( dividend, -divisor)           :
	 * 		(dividend <   0) ? -divFast(-dividend,  divisor)           :
	 * 		(divisor === 1) ? dividend      :
	 * 		(divisor === 2) ? dividend >> 1 :
	 * 		(() => {
	 * 			let quotient = 0
	 * 			let remainder = 0
	 * 			for (let i = 0; i < BITCOUNT; i++) {
	 * 				remainder = remainder << 1
	 * 				remainder[BITCOUNT - 1] = dividend[i]
	 * 				if (remainder >= divisor) {
	 * 					remainder = remainder - divisor
	 * 					quotient[i] = true
	 * 				}
	 * 			}
	 * 			return quotient
	 * 		})()
	 * 	)
	 * }
	 * ```
	 */
	override divide(divisor: Integer): Integer {
		return (
			(divisor.eq0()) ? (() => { throw new RangeError('Division by zero.') })() :
			(this   .eq0()) ? Integer.ZERO                     :
			(divisor.lt0()) ? this.divide(divisor.neg()).neg() :
			(this   .lt0()) ? this.neg().divide(divisor).neg() :
			(divisor.eq1()) ? this       :
			(divisor.eq2()) ? this.bsr() :
			(() => {
				const quotient:  DatatypeMutable = [...new Array(Integer.BITCOUNT).fill(false)] as DatatypeMutable;
				let   remainder: DatatypeMutable = [...new Array(Integer.BITCOUNT).fill(false)] as DatatypeMutable;
				for (let i: number = 0; i < Integer.BITCOUNT; i++) {
					remainder = [
						...remainder.slice(1),
						this.internal[i],
					] as DatatypeMutable;
					const diff: Integer = new Integer(remainder).minus(divisor);
					if (!diff.lt0()) {
						remainder = diff.internal as DatatypeMutable;
						quotient[i] = true
					}
				}
				return new Integer(quotient);
			})()
		)
	}
	/**
	 * ```ts
	 * function expSlow(base: number, exponent: number): number {
	 * 	return (
	 * 		(exponent <   0) ? 0 :
	 * 		(exponent === 0) ? 1 :
	 * 		(exponent === 1) ? base :
	 * 		(exponent === 2) ? base * base :
	 * 		base * expSlow(base, exponent - 1)
	 * 	)
	 * }
	 * function expFast(base: number, exponent: number): number {
	 * 	return (
	 * 		(exponent <   0) ? 0 :
	 * 		(exponent === 0) ? 1 :
	 * 		(exponent === 1) ? base :
	 * 		(exponent === 2) ? base * base :
	 * 		(base === 0) ? 0 :
	 * 		(base === 1) ? 1 :
	 * 		(exponent % 2 === 0)
	 * 			?        expFast(base ** 2,  exponent      / 2)
	 * 			: base * expFast(base ** 2, (exponent - 1) / 2)
	 * 	)
	 * }
	 * ```
	 * @see https://stackoverflow.com/a/101613/877703
	 */
	override exp(exponent: Integer): Integer {
		return (
			(exponent.lt0()) ? Integer.ZERO     :
			(exponent.eq0()) ? Integer.UNIT     :
			(exponent.eq1()) ? this             :
			(exponent.eq2()) ? this.times(this) :
			(this.eq0()) ? Integer.ZERO :
			(this.eq1()) ? Integer.UNIT :
			(exponent.isEven())
				?            this.exp(Integer.RADIX).exp(exponent                    .divide(Integer.RADIX))
				: this.times(this.exp(Integer.RADIX).exp(exponent.minus(Integer.UNIT).divide(Integer.RADIX)))
		)
		// let returned: Integer = Integer.UNIT
		// while (true) {
		// 	if (!exponent.isEven()) {
		// 		returned = returned.times(base) // returned *= base
		// 	}
		// 	exponent = exponent.divide(Integer.RADIX) // exponent /= 2n
		// 	if (exponent.eq0()) break
		// 	base = base.times(base) // base *= base
		// }
		// return returned
	}
	/**
	 * Equivalently, this is the “two’s complement” of the integer.
	 */
	override neg(): Integer {
		return this.cpl().plus(Integer.UNIT);
	}
	override eq0(): boolean {
		return this.equal(Integer.ZERO);
	}
	/**
	 * Is the 16-bit signed integer equal to `1`?
	 */
	private eq1(): boolean {
		return this.equal(Integer.UNIT);
	}
	/**
	 * Is the 16-bit signed integer equal to `2`?
	 */
	private eq2(): boolean {
		return this.equal(Integer.RADIX);
	}
	override lt(y: Integer): boolean {
		return this.minus(y).lt0()
	}
	/**
	 * Return the ones’ complement of a 16-bit signed integer.
	 * @see https://en.wikipedia.org/wiki/Ones%27_complement
	 * @param int - the integer
	 * @return the ones’ complement, equivalent to `-a - 1`
	 */
	private cpl(): Integer {
		return new Integer(this.internal.map((bit) => !bit) as DatatypeMutable);
	}
	/**
	 * Perform an arithmetic left bit shift of a 16-bit signed integer.
	 * @param int - the integer
	 * @return a left bit shift of 1 bit, dropping the first bit and appending `false` to the end
	 */
	private bsl(): Integer {
		return new Integer([
			...this.internal.slice(1),
			false,
		] as DatatypeMutable);
	}
	/**
	 * Perform an arithmetic right bit shift of a 16-bit signed integer.
	 * The shift is arithmetic, which means that the new first bit is the same as the original first bit.
	 * @param int - the integer
	 * @return a right bit shift of 1 bit, dropping the last bit and prepending a copy of the original first bit
	 */
	private bsr(): Integer {
		return new Integer([
			this.internal[0],
			...this.internal.slice(0, -1)
		] as DatatypeMutable);
	}
	/**
	 * Is the 16-bit signed integer negative?
	 * @returns Is this integer less than `0`?
	 */
	private lt0(): boolean {
		return this.internal[0] === true
	}
	/**
	 * Is the 16-bit signed integer even?
	 * @returns Is this integer divisible by `2`?
	 */
	private isEven(): boolean {
		return this.internal[Integer.BITCOUNT - 1] === false;
	}
}
