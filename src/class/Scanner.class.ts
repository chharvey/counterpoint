/** START OF TEXT */
export const STX: '\u0002' = '\u0002'
/** END OF TEXT */
export const ETX: '\u0003' = '\u0003'



/**
 * A character in source code.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.1
 */
export class Char {
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


	/** The actual character string. */
	readonly source: string;
	/** Zero-based line number of this character (first line is line 0).*/
	readonly line_index: number;
	/** Zero-based column number of this character (first col is col 0). */
	readonly col_index: number;

	/**
	 * Construct a new Char object.
	 * @param   scanner      - the scanner containing the source text
	 * @param   source_index - the index of the character in source text
	 */
	constructor(
		private readonly scanner: Scanner,
		private readonly source_index: number,
	) {
		/** Array of characters from source start until current iteration (not including current character). */
		const prev_chars: readonly string[] = [...this.scanner.source_text].slice(0, this.source_index)
		this.source = this.scanner.source_text[this.source_index]
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
			return (this.source === ETX) ? null : new Char(this.scanner, this.source_index + 1)
		} else {
			const recurse: Char|null = this.lookahead(n - 1)
			return recurse && recurse.lookahead()
		}
	}

	/**
	 * @override
	 * Return a row that describes this character in a table.
	 * @returns a string representation of this character’s data
	 */
	toString(): string {
		const formatted: string = new Map([
			['\u0000' /* NULL                 \u0000 */, '\u2400' /* SYMBOL FOR NULL                  */],
			[' '      /* SPACE                \u0020 */, '\u2420' /* SYMBOL FOR SPACE                 */],
			['\t'     /* CHARACTER TABULATION \u0009 */, '\u2409' /* SYMBOL FOR HORIZONTAL TABULATION */],
			['\n'     /* LINE FEED (LF)       \u000a */, '\u240a' /* SYMBOL FOR LINE FEED             */],
			['\r'     /* CARRIAGE RETURN (CR) \u000d */, '\u240d' /* SYMBOL FOR CARRIAGE RETURN       */],
			[STX      /* START OF TEXT        \u0002 */, '\u2402' /* SYMBOL FOR START OF TEXT         */],
			[ETX      /* END OF TEXT          \u0003 */, '\u2403' /* SYMBOL FOR END OF TEXT           */],
		]).get(this.source) || this.source
		return `    ${this.line_index+1}    ${this.col_index+1}    ${formatted}` // for some dumb reason, lines and cols start at 1 instad of 0
	}
}



/**
 * A Scanner object reads through the source text and returns one character at a time.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.2
 */
export default class Scanner {
	/**
	 * Construct a new Scanner object.
	 * @param   source_text - the entire source text
	 */
	constructor(
		public readonly source_text: string,
	) {
		this.source_text = `${STX}\n${this.source_text.replace(/\r\n|\r/g, '\n')}${ETX}`
	}

	/**
	 * Return the next character in source text.
	 * @returns the next character in source text
	 */
	* generate(): Iterator<Char, void> {
		for (let source_index: number = 0; source_index < this.source_text.length; source_index++) {
			yield new Char(this, source_index)
		}
	}
}
