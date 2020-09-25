import Util from '../class/Util.class'
import type Serializable from '../iface/Serializable.iface'
import type {ScannerSolid as Scanner} from './Scanner.class'
import {
	Filebound,
} from './Token.class'



/**
 * A character in source code.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.1
 */
export default class Char implements Serializable {
	/**
	 * Test whether the characters given, when joined, equal the expected string.
	 * If any character argument is `null`, return `false`.
	 *
	 * @example
	 * let a: Char;
	 * let b: Char;
	 * a.cargo; // 'a'
	 * b.cargo; // 'b'
	 * Char.eq('ab', a, b); // true
	 * @param   expected - the expected string
	 * @param   test     - the first Char object test
	 * @param   tests    - succeeding Char objects to concatenate and test
	 * @returns            Does the concatenation of the tests’ cargos equal the expected string?
	 */
	static eq(expected: string, test: Char|null, ...tests: readonly (Char|null)[]): boolean {
		tests = [test, ...tests]
		return tests.every((char) => char !== null) && tests.map((char) => char !.source).join('') === expected
	}

	/**
	 * Test whether the characters given, when joined, is included in the array of expected strings.
	 * If any character argument is `null`, return `false`.
	 *
	 * @example
	 * let a: Char;
	 * let b: Char;
	 * a.cargo; // 'a'
	 * b.cargo; // 'b'
	 * Char.inc(['ab', 'bc'], a, b); // true
	 * @param   expected - the array of expected strings
	 * @param   test     - the first Char object test
	 * @param   tests    - succeeding Char objects to concatenate and test
	 * @returns            Is the concatenation of the tests’ cargos included in the array of expected strings?
	 */
	static inc(expected: readonly string[], test: Char|null, ...tests: readonly (Char|null)[]): boolean {
		tests = [test, ...tests]
		return tests.every((char) => char !== null) && expected.includes(tests.map((char) => char !.source).join(''))
	}


	/** @implements Serializable */
	readonly tagname: string = 'char'
	/** @implements Serializable */
	readonly source: string = this.scanner.source_text[this.source_index]
	/** @implements Serializable */
	readonly line_index: number;
	/** @implements Serializable */
	readonly col_index: number;

	/**
	 * Construct a new Char object.
	 * @param   scanner      - The scanner containing the source text.
	 * @param   source_index - The index of the character in source text.
	 */
	constructor(
		private readonly scanner: Scanner,
		/** @implements Serializable */
		readonly source_index: number,
	) {
		/** Array of characters from source start until current iteration (not including current character). */
		const prev_chars: readonly string[] = [...this.scanner.source_text].slice(0, this.source_index)
		this.line_index = prev_chars.filter((c) => c === '\n').length
		this.col_index = this.source_index - (prev_chars.lastIndexOf('\n') + 1)

		this.line_index--; // subtract 1 line due to the prepended STX + LF
	}

	/**
	 * Return the next character after this character.
	 * @param   n the number of times to lookahead
	 * @returns the character succeeding this character
	 * @throws  {RangeError} if the argument is not a positive integer
	 */
	lookahead(n: number = 1): Char|null {
		if (n % 1 !== 0 || n <= 0) throw new RangeError('Argument must be a positive integer.')
		if (n === 1) {
			return (this.source === Filebound.EOT) ? null : new Char(this.scanner, this.source_index + 1)
		} else {
			const recurse: Char|null = this.lookahead(n - 1)
			return recurse && recurse.lookahead()
		}
	}

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const formatted: string = this.source
			.replace('\u0000'      /* NULL                 \u0000 */, '\u2400' /* SYMBOL FOR NULL                  */)
			.replace(' '           /* SPACE                \u0020 */, '\u2420' /* SYMBOL FOR SPACE                 */)
			.replace('\t'          /* CHARACTER TABULATION \u0009 */, '\u2409' /* SYMBOL FOR HORIZONTAL TABULATION */)
			.replace('\n'          /* LINE FEED (LF)       \u000a */, '\u240a' /* SYMBOL FOR LINE FEED             */)
			.replace('\r'          /* CARRIAGE RETURN (CR) \u000d */, '\u240d' /* SYMBOL FOR CARRIAGE RETURN       */)
		return `<${ this.tagname } ${ Util.stringifyAttributes(new Map<string, string>([
			['line', `${ this.line_index + 1 }`],
			['col',  `${ this.col_index  + 1 }`],
		])) }>${ Util.sanitizeContent(formatted) }</${ this.tagname }>`
	}
}
