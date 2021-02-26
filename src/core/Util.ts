import * as xjs from 'extrajs';
import * as utf8 from 'utf8';



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
export class Util {
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
		xjs.Number.assertType(codepoint, xjs.NumericType.NATURAL);
		return [...utf8.encode(String.fromCodePoint(codepoint))].map((ch) => ch.codePointAt(0)!) as EncodedChar;
	}

	/**
	 * Decode a stream of UTF-8 code units into a sequence of code points.
	 * @param   codeunits a stream of code units, each conforming to the UTF-8 specification
	 * @returns           a sequence of numeric code point values within [0x0, 0x10_ffff]
	 */
	static decodeUTF8Stream(codeunits: readonly CodeUnit[]): CodePoint[] {
		return [...utf8.decode(codeunits.map((unit) => String.fromCodePoint(unit)).join(''))]
			.map((char) => char.codePointAt(0)!);
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
