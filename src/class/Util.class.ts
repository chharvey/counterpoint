/**
 * Utility fields and methods.
 */
export default class Util {
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
	 * Return a random code point, an integer between 0 (inclusive) and
	 * 0x7f (the highest ASCII code point, inclusive), or
	 * 0x10ffff (the highest Unicode code point, inclusive),
	 * as a character in a string.
	 * Any exceptions given will not be returned.
	 * @param   except - a list of exceptions
	 * @param   ascii  - should the returned character be limited to the ASCII character set?
	 * @returns          a random character whose code point is not in the exceptions list
	 */
	static randomChar(except: string[] = [], ascii: boolean = true): string {
		let code: number;
		do {
			code = Util.randomInt(ascii ? 0x80 : 0x110000)
		} while (except.map((s) => s.codePointAt(0) !).includes(code))
		return String.fromCodePoint(code)
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
	 * Are the two arrays “equal”?
	 *
	 * Two arrays are “equal” if they are the same object,
	 * or if index by index, their elements are strictly equal (`===`).
	 *
	 * @param   <T> the types of the arrays
	 * @param   a1 - the first array
	 * @param   a2 - the second array
	 * @returns      do the two arrays have the exact same elements at the same indices?
	 */
	static equalArrays<T>(a1: readonly T[], a2: readonly T[]): boolean {
		return a1 === a2 || a1.length === a2.length && a1.every((e1, i) => e1 === a2[i])
	}
}
