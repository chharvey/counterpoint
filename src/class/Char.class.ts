import type Scanner from './Scanner.class'



/** START OF TEXT */
export const STX: '\u0002' = '\u0002'
/** END OF TEXT */
export const ETX: '\u0003' = '\u0003'



/**
 * A character in source code.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.1
 */
export default class Char {
	/** The actual character string. */
	readonly cargo: string;
	/** Zero-based line number of this character (first line is line 0).*/
	readonly line_index: number;
	/** Zero-based column number of this character (first col is col 0). */
	readonly col_index: number;

	/**
	 * Construct a new Char object.
	 * @param   scanner      - The scanner containing the source text.
	 * @param   source_index - The index of the character in source text.
	 */
	constructor(
		private readonly scanner: Scanner,
		readonly source_index: number,
	) {
		/** Array of characters from source start until current iteration (not including current character). */
		const prev_chars: readonly string[] = [...this.scanner.source_text].slice(0, this.source_index)
		this.cargo = this.scanner.source_text[this.source_index]
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
			return (this.cargo === ETX) ? null : new Char(this.scanner, this.source_index + 1)
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
		const cargo: string = new Map([
			['\u0000' /* NULL                 \u0000 */, '\u2400' /* SYMBOL FOR NULL                  */],
			[' '      /* SPACE                \u0020 */, '\u2420' /* SYMBOL FOR SPACE                 */],
			['\t'     /* CHARACTER TABULATION \u0009 */, '\u2409' /* SYMBOL FOR HORIZONTAL TABULATION */],
			['\n'     /* LINE FEED (LF)       \u000a */, '\u240a' /* SYMBOL FOR LINE FEED             */],
			['\r'     /* CARRIAGE RETURN (CR) \u000d */, '\u240d' /* SYMBOL FOR CARRIAGE RETURN       */],
			[STX      /* START OF TEXT        \u0002 */, '\u2402' /* SYMBOL FOR START OF TEXT         */],
			[ETX      /* END OF TEXT          \u0003 */, '\u2403' /* SYMBOL FOR END OF TEXT           */],
		]).get(this.cargo) || this.cargo
		return `    ${this.line_index+1}    ${this.col_index+1}    ${cargo}` // for some dumb reason, lines and cols start at 1 instad of 0
	}
}
