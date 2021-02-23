import * as xjs from 'extrajs';



/**
 * A code point is a number within [0, 0x10_ffff] that represents
 * the index of a character in the Unicode Universal Character Set.
 */
export type CodePoint = number;

/**
 * A code unit is a number within [0, 0xff] that represents
 * a byte of an encoded Unicode code point.
 */
export type CodeUnit = number;

export type EncodedChar =
	| [CodeUnit]
	| [CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit, CodeUnit, CodeUnit]
;



/**
 * Utility fields and methods.
 */
export default class Util {
	static REPLACEMENT_CHARACTER: CodePoint & 0xfffd = 0xfffd;

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
	static utf8Encode(codepoint: CodePoint): EncodedChar {
		/**
		 * Divides a code point into an integer quotient and integer remainder.
		 * @param cp    the code point
		 * @param count into how many code units?
		 * @returns     the sequence of code unit bodies (excluding the headers such as "110")
		 */
		function divide(cp: CodePoint, count: bigint = 1n): number[] {
			return (count <= 1n)
				? [cp]
				: [...divide(Math.floor(cp / 0x40), count - 1n), cp % 0x40]
			;
		}
		xjs.Number.assertType(codepoint, xjs.NumericType.NATURAL);
		return (
			(codepoint <        0x80) ? [codepoint] :
			(codepoint <       0x800) ? divide(codepoint, 2n).map((cu, i) => i === 0 ? 0xc0 + cu : 0x80 + cu) as [CodeUnit, CodeUnit] :
			(codepoint <    0x1_0000) ? divide(codepoint, 3n).map((cu, i) => i === 0 ? 0xe0 + cu : 0x80 + cu) as [CodeUnit, CodeUnit, CodeUnit] :
			(codepoint <   0x20_0000) ? divide(codepoint, 4n).map((cu, i) => i === 0 ? 0xf0 + cu : 0x80 + cu) as [CodeUnit, CodeUnit, CodeUnit, CodeUnit] :
			(codepoint <  0x400_0000) ? divide(codepoint, 5n).map((cu, i) => i === 0 ? 0xf8 + cu : 0x80 + cu) as [CodeUnit, CodeUnit, CodeUnit, CodeUnit, CodeUnit] :
			(codepoint < 0x8000_0000) ? divide(codepoint, 6n).map((cu, i) => i === 0 ? 0xfc + cu : 0x80 + cu) as [CodeUnit, CodeUnit, CodeUnit, CodeUnit, CodeUnit, CodeUnit] :
			(() => { throw new RangeError(`Code point \`0x${ codepoint.toString(16) }\` must be less than 0x8000_0000.`); })() // TODO this should be a LexError
		);
	}

	/**
	 * The UTF-8 decoding of a sequence of code units.
	 * @param   codeunits code units conforming to the UTF-8 specification
	 * @returns           a sequence of numeric code point values within [0x0, 0x10_ffff]
	 */
	static utf8Decode(codeunits: Readonly<EncodedChar>): CodePoint {
		/**
		 * Multiplies a sequence of code units into a numeric code point.
		 * @param units the code units
		 * @returns     the code point
		 */
		function multiply(units: readonly CodeUnit[]): CodePoint {
			return (!units.length)
				? 0
				: multiply(units.slice(0, -1)) * 0x40 + units[units.length - 1]
			;
		}
		/**
		 * Parse a sequence of code units.
		 * @param units the code units to validate
		 * @throws {UTF8DecodeError} if the sequence of bits is not well-formed
		 */
		function parse(units: readonly CodeUnit[]): void {
			return units.slice(1).forEach((unit, i) => { // `i == 0` starts at `units[1]`
				if (
					   unit <  0x80 // "0bbb_bbbb"
					|| unit >= 0xc0 // "11bb_bbbb"
				) {
					throw new UTF8DecodeError(units.slice(0, i + 2), i + 1);
				};
			});
		}
		/**
		 * Validate a sequence of code units.
		 *
		 * UTF-8 defines certain encodings that are invalid, even if they are well-formed (parse correctly).
		 * For example, the encoding `C1 9C` is well-formed, and if decoded naïvely, would decode to
		 * U+005C REVERSE SOLIDUS (which should have been encoded as `5C`).
		 *
		 * UTF-8 defines a one-to-one correspondance between Unicode code points and their encodings,
		 * and every code point must be encoded with the least number of bytes possible.
		 * Furthermore, certain code points are reserved for UTF-16 and are forbidden in UTF-8.
		 * These code points, if naïvely or maliciously encoded, would lead to invalid byte sequences.
		 *
		 * @param units the code units to validate
		 * @throws {UTF8DecodeError} if the sequence of bits is not valid
		 */
		function validate(units: readonly CodeUnit[]): void {
			if (units.length === 2 &&                      units[0] < 0xc2) { throw new UTF8DecodeError(units, 0); };
			if (units.length === 3 && units[0] === 0xe0 && units[1] < 0xa0) { throw new UTF8DecodeError(units, 1); };
			if (units.length === 4 && units[0] === 0xf0 && units[1] < 0x90) { throw new UTF8DecodeError(units, 1); };
			if (units.length === 5 && units[0] === 0xf8 && units[1] < 0x88) { throw new UTF8DecodeError(units, 1); };
			if (units.length === 6 && units[0] === 0xfc && units[1] < 0x84) { throw new UTF8DecodeError(units, 1); };
		}
		return (
			(codeunits[0] < 0x00)                   ? Util.REPLACEMENT_CHARACTER :
			(codeunits[0] < 0x80) /* "0bbb_bbbb" */ ? codeunits[0] :
			(codeunits[0] < 0xc0) /* "10bb_bbbb" */ ? Util.REPLACEMENT_CHARACTER :
			(codeunits[0] < 0xe0) /* "110b_bbbb" */ ? (parse(codeunits.slice(0, 2)), validate(codeunits.slice(0, 2)), multiply(codeunits.slice(0, 2).map((cu, i) => i === 0 ? cu - 0xc0 : cu - 0x80))) :
			(codeunits[0] < 0xf0) /* "1110_bbbb" */ ? (parse(codeunits.slice(0, 3)), validate(codeunits.slice(0, 3)), multiply(codeunits.slice(0, 3).map((cu, i) => i === 0 ? cu - 0xe0 : cu - 0x80))) :
			(codeunits[0] < 0xf8) /* "1111_0bbb" */ ? (parse(codeunits.slice(0, 4)), validate(codeunits.slice(0, 4)), multiply(codeunits.slice(0, 4).map((cu, i) => i === 0 ? cu - 0xf0 : cu - 0x80))) :
			(codeunits[0] < 0xfc) /* "1111_10bb" */ ? (parse(codeunits.slice(0, 5)), validate(codeunits.slice(0, 5)), multiply(codeunits.slice(0, 5).map((cu, i) => i === 0 ? cu - 0xf8 : cu - 0x80))) :
			(codeunits[0] < 0xfe) /* "1111_110b" */ ? (parse(codeunits.slice(0, 6)), validate(codeunits.slice(0, 6)), multiply(codeunits.slice(0, 6).map((cu, i) => i === 0 ? cu - 0xfc : cu - 0x80))) :
			Util.REPLACEMENT_CHARACTER
		);
	}

	/**
	 * Decode a stream of UTF-8 code units into a sequence of code points.
	 * @param   codeunits a stream of code units, each conforming to the UTF-8 specification
	 * @returns           a sequence of numeric code point values within [0x0, 0x10_ffff]
	 */
	static decodeUTF8Stream(codeunits: readonly CodeUnit[]): CodePoint[] {
		function group(count: number): CodePoint[] {
			if (count < 0 || 6 < count) {
				throw new RangeError('Argument must be within 0 <= n <= 6.');
			};
			let current: CodePoint;
			try {
				current = Util.utf8Decode(codeunits.slice(0, count) as EncodedChar);
			} catch (err) {
				if (err instanceof UTF8DecodeError) {
					current = Util.REPLACEMENT_CHARACTER;
					count   = err.index;
				} else {
					throw err;
				};
			};
			return [current, ...Util.decodeUTF8Stream(codeunits.slice(count))];
		}
		return (
			(!codeunits.length) ? [] :
			(codeunits[0] < 0xc0) /* "bbbb_bbbb" */ ? group(1) :
			(codeunits[0] < 0xe0) /* "110b_bbbb" */ ? group(2) :
			(codeunits[0] < 0xf0) /* "1110_bbbb" */ ? group(3) :
			(codeunits[0] < 0xf8) /* "1111_0bbb" */ ? group(4) :
			(codeunits[0] < 0xfc) /* "1111_10bb" */ ? group(5) :
			(codeunits[0] < 0xfe) /* "1111_110b" */ ? group(6) :
			group(1)
		);
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
		invalid: readonly CodeUnit[],
		public readonly index: number,
	) {
		super(`Invalid sequence of code points: ${ invalid.map((n) => `0x${ n.toString(16) }`).join() }`);
	}
}
