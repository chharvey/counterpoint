type Int16Datatype = readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean]
type Int16DatatypeMutable =   [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean]



/**
 * A 16-bit signed integer in two’s complement.
 */
export default class Int16 {
	private static readonly BITCOUNT: number = 16

	private static readonly ZERO  : Int16 = new Int16(    new Array(Int16.BITCOUNT    ).fill(false)               as Int16DatatypeMutable)
	private static readonly UNIT  : Int16 = new Int16([...new Array(Int16.BITCOUNT - 1).fill(false)      , true ] as Int16DatatypeMutable)
	private static readonly RADIX : Int16 = new Int16([...new Array(Int16.BITCOUNT - 2).fill(false), true, false] as Int16DatatypeMutable)

	private static mod(n: bigint, modulus: bigint): bigint {
		return (n % modulus + modulus) % modulus
	}

	private readonly internal: Int16Datatype;

	/**
	 * Construct a new Int16 object from a bigint or from data.
	 * @param data - a numeric value or data
	 * @returns the value represented as a 16-bit signed integer
	 */
	constructor(data: bigint|Int16Datatype) {
		this.internal = (typeof data === 'bigint')
			? [...Int16.mod(data, 2n ** BigInt(Int16.BITCOUNT)).toString(2).padStart(Int16.BITCOUNT, '0')].map((bit) => !!+bit) as Int16DatatypeMutable
			: data
	}

	/**
	 * Return the signed interpretation of this integer.
	 * @returns the numeric value
	 */
	toNumeric(): bigint {
		const unsigned: number = this.internal.map((bit, i) => +bit * 2 ** (Int16.BITCOUNT - 1 - i)).reduce((a, b) => a + b)
		return BigInt(unsigned < 2 ** (Int16.BITCOUNT - 1) ? unsigned : unsigned - 2 ** Int16.BITCOUNT)
	}
	/**
	 * Add two 16-bit signed integers in two’s complement.
	 * @param addend - the integer addend
	 * @return the sum, `this augend + addend`
	 */
	plus(addend: Int16): Int16 {
		type Carry = [bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint]
		const sum   : Carry = [...new Array(Int16.BITCOUNT).fill(0n)] as Carry
		const carry : Carry = [...new Array(Int16.BITCOUNT).fill(0n)] as Carry
		for (let i = Int16.BITCOUNT - 1; i >= 0; i--) {
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
		return new Int16(sum.map((bit) => !!bit) as Int16DatatypeMutable)
	}
	/**
	 * Subtract two 16-bit signed integers in two’s complement.
	 * @param subtrahend - the integer subtrahend
	 * @return the difference, `this minuend - subtrahend`
	 */
	minus(subtrahend: Int16): Int16 {
		return this.plus(subtrahend.neg())
	}
	/**
	 * Multiply two 16-bit signed integers in two’s complement.
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
	 * @param multiplicand - the integer multiplicand
	 * @return the product, `this multiplier * multiplicand`
	 */
	times(multiplicand: Int16): Int16 {
		return (
			(this.eq0()) ? Int16.ZERO         :
			(this.eq1()) ? multiplicand       :
			(this.eq2()) ? multiplicand.bsl() :
			(multiplicand.lt0()) ? this.times(multiplicand.neg()).neg() :
			(multiplicand.eq0()) ? Int16.ZERO                           :
			(multiplicand.eq1()) ? this                                 :
			(multiplicand.eq2()) ? this.bsl()                           :
			(multiplicand.isEven())
				?           this.times(Int16.RADIX).times(multiplicand                  .divide(Int16.RADIX))
				: this.plus(this.times(Int16.RADIX).times(multiplicand.minus(Int16.UNIT).divide(Int16.RADIX)))
		)
	}
	/**
	 * Divide two 16-bit signed integers in two’s complement.
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
	 * @param divisor - the integer divisor
	 * @return the quotient, `this dividend / divisor`
	 */
	divide(divisor: Int16): Int16 {
		return (
			(divisor.eq0()) ? (() => { throw new Error('Division by zero.') })() :
			(this   .eq0()) ? Int16.ZERO                                         :
			(divisor.lt0()) ? this.divide(divisor.neg()).neg() :
			(this   .lt0()) ? this.neg().divide(divisor).neg() :
			(divisor.eq1()) ? this       :
			(divisor.eq2()) ? this.bsr() :
			(() => {
				const quotient  : Int16DatatypeMutable = [...new Array(Int16.BITCOUNT).fill(false)] as Int16DatatypeMutable
				let   remainder : Int16DatatypeMutable = [...new Array(Int16.BITCOUNT).fill(false)] as Int16DatatypeMutable
				for (let i: number = 0; i < Int16.BITCOUNT; i++) {
					remainder = [
						...remainder.slice(1),
						this.internal[i],
					] as Int16DatatypeMutable
					const diff: Int16 = new Int16(remainder).minus(divisor)
					if (!diff.lt0()) {
						remainder = diff.internal as Int16DatatypeMutable
						quotient[i] = true
					}
				}
				return new Int16(quotient)
			})()
		)
	}
	/**
	 * Exponentiate two 16-bit signed integers in two’s complement.
	 * ```
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
	 * 		(exponent % 2 === 0)
	 * 			?        expFast(base ** 2,  exponent      / 2)
	 * 			: base * expFast(base ** 2, (exponent - 1) / 2)
	 * 	)
	 * }
	 * ```
	 * @see https://stackoverflow.com/a/101613/877703
	 * @param exponent - the integer exponent
	 * @return the power, `this base ^ exponent`
	 */
	exp(exponent: Int16): Int16 {
		return (
			(exponent.lt0()) ? Int16.ZERO       :
			(exponent.eq0()) ? Int16.UNIT       :
			(exponent.eq1()) ? this             :
			(exponent.eq2()) ? this.times(this) :
			(exponent.isEven())
				?            this.exp(Int16.RADIX).exp(exponent                  .divide(Int16.RADIX))
				: this.times(this.exp(Int16.RADIX).exp(exponent.minus(Int16.UNIT).divide(Int16.RADIX)))
		)
		// let returned: Int16 = Int16.UNIT
		// while (true) {
		// 	if (!exponent.isEven()) {
		// 		returned = returned.times(base) // returned *= base
		// 	}
		// 	exponent = exponent.divide(Int16.RADIX) // exponent /= 2n
		// 	if (exponent.eq0()) break
		// 	base = base.times(base) // base *= base
		// }
		// return returned
	}
	/**
	 * Return the negation (additive inverse) of a 16-bit signed integer in two’s complement.
	 * Equivalently, this is the “two’s complement” of the integer.
	 * @param int - the integer
	 * @return the additive inverse of the integer
	 */
	neg(): Int16 {
		return this.cpl().plus(Int16.UNIT)
	}
	/**
	 * Return the ones’ complement of a 16-bit signed integer.
	 * @see https://en.wikipedia.org/wiki/Ones%27_complement
	 * @param int - the integer
	 * @return the ones’ complement, equivalent to `-a - 1`
	 */
	private cpl(): Int16 {
		return new Int16(this.internal.map((bit) => !bit) as Int16DatatypeMutable)
	}
	/**
	 * Perform an arithmetic left bit shift of a 16-bit signed integer.
	 * @param int - the integer
	 * @return a left bit shift of 1 bit, dropping the first bit and appending `false` to the end
	 */
	bsl(): Int16 {
		return new Int16([
			...this.internal.slice(1),
			false,
		] as Int16DatatypeMutable)
	}
	/**
	 * Perform an arithmetic right bit shift of a 16-bit signed integer.
	 * The shift is arithmetic, which means that the new first bit is the same as the original first bit.
	 * @param int - the integer
	 * @return a right bit shift of 1 bit, dropping the last bit and prepending a copy of the original first bit
	 */
	bsr(): Int16 {
		return new Int16([
			this.internal[0],
			...this.internal.slice(0, -1)
		] as Int16DatatypeMutable)
	}
	/**
	 * Is the 16-bit signed integer equal to 0?
	 * @returns Is this integer equal to 0?
	 */
	private eq0(): boolean {
		return this === Int16.ZERO || this.equals(Int16.ZERO)
	}
	/**
	 * Is the 16-bit signed integer equal to 1?
	 * @returns Is this integer equal to 1?
	 */
	private eq1(): boolean {
		return this === Int16.UNIT || this.equals(Int16.UNIT)
	}
	/**
	 * Is the 16-bit signed integer equal to 2?
	 * @returns Is this integer equal to 2?
	 */
	private eq2(): boolean {
		return this === Int16.RADIX || this.equals(Int16.RADIX)
	}
	/**
	 * Are the 16-bit signed integers equal?
	 * @returns Are the integers equal in value?
	 */
	private equals(int: Int16): boolean {
		return this === int || this.internal.every((bit, i) => bit === int.internal[i])
	}
	/**
	 * Is the 16-bit signed integer negative?
	 * @returns Is this integer less than 0?
	 */
	private lt0(): boolean {
		return this.internal[0] === true
	}
	/**
	 * Is the 16-bit signed integer even?
	 * @returns Is this integer divisible by 2?
	 */
	private isEven(): boolean {
		return this.internal[Int16.BITCOUNT - 1] === false
	}
}
