import {Filebound} from '../lexer/'
import type {GrammarSymbol} from '../parser/'



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
	 * Transform `PascalCase` into `SCREAMING_CASE`.
	 * @param s the string to transform, in `AbcDef` format
	 * @return the string in `ABC_DEF` format
	 */
	static pascalToScreaming(s: string): string {
		return s.replace(/[A-Z]/g, '_$&').slice(1).toUpperCase()
	}

	/**
	 * Transform `SCREAMING_CASE` into `PascalCase`.
	 * @param s the string to transform, in `ABC_DEF` format
	 * @return the string in `AbcDef` format
	 */
	static screamingToPascal(s: string): string {
		return s.split('_').map((ss) => `${ ss[0] }${ ss.slice(1).toLowerCase() }`).join('')
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
	 * Are the two arrays “equal”?
	 *
	 * Two arrays are “equal” if they are the same object,
	 * or if index by index, their elements are either strictly equal (`===`),
	 * or “equal” by some other predicate.
	 *
	 * @param   <T> the types of the arrays
	 * @param   a1 - the first array
	 * @param   a2 - the second array
	 * @param   predicate - the comparison function to determine equality
	 * @returns      do the two arrays have the exact same elements at the same indices?
	 */
	static equalArrays<T>(a1: readonly T[], a2: readonly T[], predicate: (t1: T, t2: T) => boolean = (t1: T, t2: T) => t1 === t2): boolean {
		return a1 === a2 || a1.length === a2.length && a1.every((e1, i) => e1 === a2[i] || predicate(e1, a2[i]))
	}

	/**
	 * Are the two sets “equal”?
	 *
	 * Two sets are “equal” if they are the same object,
	 * or if they are subsets of each other (that is, if each set has the same elements as the other).
	 *
	 * @param   <T> the types of the sets
	 * @param   s1 - the first set
	 * @param   s2 - the second set
	 * @returns      do the two set have the exact same elements?
	 */
	static equalSets<T>(s1: ReadonlySet<T>, s2: ReadonlySet<T>): boolean {
		return s1 === s2 || s1.size === s2.size && [...s1].every((e1) => s2.has(e1))
	}

	/**
	 * The UTF16Encoding of a numeric code point value.
	 * @see http://ecma-international.org/ecma-262/10.0/#sec-utf16encoding
	 * @param   codepoint - a positive integer within [0x0, 0x10ffff]
	 * @returns             a code unit sequence representing the code point
	 */
	static utf16Encoding(codepoint: number): [number] | [number, number] {
		if (codepoint < 0 || 0x10ffff < codepoint) throw new RangeError(`Code point \`0x${codepoint.toString(16)}\` must be within [0x0, 0x10ffff].`) // TODO this should be a ParseError
		if (codepoint <= 0xffff) return [codepoint]
		const cu1: number = (codepoint - 0x10000) / 0x400
		const cu2: number = (codepoint - 0x10000) % 0x400
		return [Math.floor(cu1) + 0xd800, cu2 + 0xdc00]
	}

	/**
	 * Return a map of key-value pairs as a string of XML attributes.
	 *
	 * For example, given the map `[[key0, value0],  [key1, value1]]`,
	 * this method returns the string `key0="value0" key1="value1"`.
	 * @param   attributes a map of key-value pairs
	 * @returns            an XML string of space-separated attributes
	 */
	static stringifyAttributes(attributes: Map<string, string>): string {
		return [...attributes].map(([attr, val]) => `${ attr }="${ val
			.replace(/\&/g, '&amp;' )
			.replace(/\</g, '&lt;'  )
			.replace(/\>/g, '&gt;'  )
			.replace(/\'/g, '&apos;')
			.replace(/\"/g, '&quot;')
			.replace(/\\/g, '&#x5c;')
			.replace(/\t/g, '&#x09;')
			.replace(/\n/g, '&#x0a;')
			.replace(/\r/g, '&#x0d;')
			.replace('\u0002', '\u2402') // SYMBOL FOR START OF TEXT
			.replace('\u0003', '\u2403') // SYMBOL FOR END   OF TEXT
			.replace(/[^\u0020-\u007e\u2402-\u2403]/g, (match) => `&#x${ match.codePointAt(0)!.toString(16) };`)
		}"`).join(' ')
	}
	/**
	 * Display a string of grammar symbols for debugging purposes.
	 *
	 * @param   arr - the array of grammar symbols
	 * @returns       a string representing the sequence of those symbols
	 */
	static stringOfSymbols(arr: readonly GrammarSymbol[]): string {
		return arr.map((symbol) => (typeof symbol === 'string') ?
			`"${ symbol }"`
				.replace(Filebound.SOT, '\u2402') // SYMBOL FOR START OF TEXT
				.replace(Filebound.EOT, '\u2403') // SYMBOL FOR END   OF TEXT
			: symbol.displayName
		).join(' ')
	}
	/**
	 * Sanitize a string for the text content of an XML element.
	 * @param   contents the original element contents
	 * @returns contents with XML special characters escaped
	 */
static sanitizeContent(contents: string): string {
		return contents
			.replace(/\&/g, '&amp;' )
			.replace(/\</g, '&lt;'  )
			.replace(/\>/g, '&gt;'  )
			.replace(/\\/g, '&#x5c;')
			.replace('\u0002', '\u2402') // SYMBOL FOR START OF TEXT
			.replace('\u0003', '\u2403') // SYMBOL FOR END   OF TEXT
	}
}
