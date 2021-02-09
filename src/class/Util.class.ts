export type EncodedChar =
	| readonly [bigint]
	| readonly [bigint, bigint]
	| readonly [bigint, bigint, bigint]
	| readonly [bigint, bigint, bigint, bigint]
	| readonly [bigint, bigint, bigint, bigint, bigint]
	| readonly [bigint, bigint, bigint, bigint, bigint, bigint]
;

/**
 * Utility fields and methods.
 */
export default class Util {
	static REPLACEMENT_CHARACTER: 0xfffdn = 0xfffdn;
	/**
	 * Return a random boolean value.
	 * @returns a random boolean value
	 */
	static randomBool(): boolean {
		return Math.random() < 0.5
	}

	/**
	 * Return a random integer from 0 to the argument.
	 * @example
	 * randomInt(16); // returns a random integer within the interval [0, 16)
	 * @param   n - the upper bound, exclusive
	 * @returns a random integer between 0 (inclusive) and n (exclusive)
	 */
	static randomInt(n: number): number {
		return Math.floor(Math.random() * n)
	}

	/**
	 * Return a random code point, an integer between 0x20 (inclusive) and
	 * 0x7f (the highest ASCII code point, inclusive),
	 * as a character in a string.
	 * Any exceptions given will not be returned.
	 * @param   except - a list of exceptions
	 * @returns          a random character whose code point is not in the exceptions list
	 */
	static randomChar(except: string[] = []): string {
		const exceptcodes: number[] = except.map((s) => s.codePointAt(0) !)
		let code: number;
		do {
			code = Util.randomInt(0x80 - 0x20) + 0x20
		} while (exceptcodes.includes(code))
		return String.fromCodePoint(code)
	}

	/**
	 * Remove indentation from string templates, and appends a line feed.
	 * @param   s the string to remove indentation from each line
	 * @returns   the string with indentation removed and a line feed appended
	 */
	static dedent(s: string): string {
		const indents: RegExpMatchArray|null = s.match(/\n\t*/)
		return `${
			(indents) ? s.replace(new RegExp(`\\n\\t{${indents[0].length - 1}}`, 'g'), '\n').trim() : s
		}\n`
	}

	/**
	 * Select a random element from the provided array.
	 * @param   array - the array to select from
	 * @returns         a uniformly-distributed random element from the array
	 */
	static arrayRandom<T>(array: readonly T[]): T {
		return array[Math.floor(Math.random() * array.length)]
	}

	/**
	 * The UTF-8 encoding of a numeric code point value.
	 * @param   codepoint a positive integer within [0x0, 0x10_ffff]
	 * @returns           a code unit sequence representing the code point
	 */
	static utf8Encode(codepoint: bigint): EncodedChar {
		/**
		 * Divides a code point into an integer quotient and integer remainder.
		 * @param cp    the code point
		 * @param count into how many code units?
		 * @returns     the sequence of code unit bodies (excluding the headers such as "110")
		 */
		function divide(cp: bigint, count: bigint = 1n): bigint[] {
			return (count <= 1n)
				? [cp]
				: [...divide(cp / 0x40n, count - 1n), cp % 0x40n]
			;
		}
		if (codepoint < 0n) {
			throw new RangeError(`Code point \`0x${ codepoint.toString(16) }\` must be greater than or equal to 0.`); // TODO this should be a LexError
		};
		return (
			(codepoint < 0x80)        ? [codepoint] :
			(codepoint < 0x800)       ? divide(codepoint, 2n).map((cu, i) => i === 0 ? 0xc0n + cu : 0x80n + cu) as [bigint, bigint] :
			(codepoint < 0x1_0000)    ? divide(codepoint, 3n).map((cu, i) => i === 0 ? 0xe0n + cu : 0x80n + cu) as [bigint, bigint, bigint] :
			(codepoint < 0x20_0000)   ? divide(codepoint, 4n).map((cu, i) => i === 0 ? 0xf0n + cu : 0x80n + cu) as [bigint, bigint, bigint, bigint] :
			(codepoint < 0x400_0000)  ? divide(codepoint, 5n).map((cu, i) => i === 0 ? 0xf8n + cu : 0x80n + cu) as [bigint, bigint, bigint, bigint, bigint] :
			(codepoint < 0x8000_0000) ? divide(codepoint, 6n).map((cu, i) => i === 0 ? 0xfcn + cu : 0x80n + cu) as [bigint, bigint, bigint, bigint, bigint, bigint] :
			(() => { throw new RangeError(`Code point \`0x${ codepoint.toString(16) }\` must be less than 0x8000_0000.`); })() // TODO this should be a LexError
		);
	}

	/**
	 * The UTF-8 decoding of a sequence of code units.
	 * @param   codeunits code units conforming to the UTF-8 specification
	 * @returns           a sequence of numeric code point values within [0x0, 0x10_ffff]
	 */
	static utf8Decode(codeunits: EncodedChar): bigint {
		/**
		 * Multiplies a sequence of code units into a numeric code point.
		 * @param ns the code units
		 * @returns  the code point
		 */
		function multiply(ns: readonly bigint[]): bigint {
			return (!ns.length)
				? 0n
				: multiply(ns.slice(0, -1)) * 0x40n + ns[ns.length - 1]
			;
		}
		function kontinue(units: readonly bigint[]): void {
			return units.slice(1).forEach((unit, i) => { // `i == 0` starts at `units[1]`
				if (
					   unit <  0x80n // "0bbb_bbbb"
					|| unit >= 0xc0n // "11bb_bbbb"
				) {
					throw new UTF8DecodeError(units.slice(0, i + 2), i + 1);
				};
			});
		}
		return (
			(codeunits[0] < 0x00n)                   ? Util.REPLACEMENT_CHARACTER :
			(codeunits[0] < 0x80n) /* "0bbb_bbbb" */ ? codeunits[0] :
			(codeunits[0] < 0xc0n) /* "10bb_bbbb" */ ? Util.REPLACEMENT_CHARACTER :
			(codeunits[0] < 0xe0n) /* "110b_bbbb" */ ? (kontinue(codeunits.slice(0, 2)), multiply(codeunits.slice(0, 2).map((cu, i) => i === 0 ? cu - 0xc0n : cu - 0x80n))) :
			(codeunits[0] < 0xf0n) /* "1110_bbbb" */ ? (kontinue(codeunits.slice(0, 3)), multiply(codeunits.slice(0, 3).map((cu, i) => i === 0 ? cu - 0xe0n : cu - 0x80n))) :
			(codeunits[0] < 0xf8n) /* "1111_0bbb" */ ? (kontinue(codeunits.slice(0, 4)), multiply(codeunits.slice(0, 4).map((cu, i) => i === 0 ? cu - 0xf0n : cu - 0x80n))) :
			(codeunits[0] < 0xfcn) /* "1111_10bb" */ ? (kontinue(codeunits.slice(0, 5)), multiply(codeunits.slice(0, 5).map((cu, i) => i === 0 ? cu - 0xf8n : cu - 0x80n))) :
			(codeunits[0] < 0xfen) /* "1111_110b" */ ? (kontinue(codeunits.slice(0, 6)), multiply(codeunits.slice(0, 6).map((cu, i) => i === 0 ? cu - 0xfcn : cu - 0x80n))) :
			Util.REPLACEMENT_CHARACTER
		);
	}

	/**
	 * The UTF16Encoding of a numeric code point value.
	 * @see http://ecma-international.org/ecma-262/10.0/#sec-utf16encoding
	 * @param   codepoint - a positive integer within [0x0, 0x10ffff]
	 * @returns             a code unit sequence representing the code point
	 */
	static utf16Encoding(codepoint: number): [number] | [number, number] {
		if (codepoint < 0 || 0x10ffff < codepoint) throw new RangeError(`Code point \`0x${codepoint.toString(16)}\` must be within [0x0, 0x10ffff].`) // TODO this should be a LexError
		if (codepoint <= 0xffff) return [codepoint]
		const cu1: number = (codepoint - 0x10000) / 0x400
		const cu2: number = (codepoint - 0x10000) % 0x400
		return [Math.floor(cu1) + 0xd800, cu2 + 0xdc00]
	}
}



/**
 * An error when decoding a UTF-8-encoded sequence of code units.
 * Typically, this error is thrown when the code units do not follow the UTF-8 specification,
 * for example when a byte "110bbbbb" is not followed by a byte "10bbbbbb".
 */
export class UTF8DecodeError extends Error {
	/**
	 * Construct a new UTF8DecodeError object.
	 * @param invalid the code units that were invalid
	 * @param index   the index of the code unit that contained the error
	 */
	constructor (
		invalid: readonly bigint[],
		public readonly index: number,
	) {
		super(`Invalid sequence of code points: ${ invalid.map((n) => `0x${ n.toString(16) }`).join() }`);
	}
}
