/**
 * A character in source code.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.1
 */
export class Char {
	/**
	 * Construct a new Char object.
	 *
	 * @param cargo       The actual character.
	 * @param sourceIndex The index of the character in source text.
	 * @param lineIndex   The index of the line the character is on.
	 * @param colIndex    The index of the column the character is on.
	 * @param sourceText  The entire source text.
	 */
	constructor(
		readonly cargo       : string,
		readonly sourceIndex : number,
		readonly lineIndex   : number,
		readonly colIndex    : number,
		readonly sourceText  : string,
	) {
	}
	toString(): string {
		const cargo = new Map([
			['\u0000' , 'NULL (U+0000)'],
			[' '      , 'SPACE (U+0020)'],
			['\u00a0' , 'NO-BREAK SPACE (U+00a0)'],
			['\n'     , 'LINE FEED (U+000a)'],
			['\t'     , 'CHARACTER TABULATION (U+0009)'],
			['\u0003' , 'END OF TEXT (U+0003)'],
		]).get(this.cargo) || this.cargo
		return `    ${this.lineIndex+1}    ${this.colIndex+1}    ${cargo}` // for some dumb reason, lines and cols start at 1 instad of 0
	}
}


/**
 * A Scanner object reads through the sourceText and returns one character at a time.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.2
 */
export default class Scanner {
	/** The index of the character in source text. */
	sourceIndex: number = 0
	/** The index of the line the character is on. */
	lineIndex: number = 0
	/** The index of the column the character is on. */
	colIndex: number = 0
	/** The last index of the source text. (Equal to `this.sourceText.length - 1`) */
	readonly lastIndex: number;

	/**
	 * Construct a new Scanner object.
	 *
	 * @param sourceText  The entire source text.
	 */
	constructor(readonly sourceText: string) {
		this.lastIndex = this.sourceText.length - 1 // sourceText.lastIndex
	}

	/**
	 * Return the next character in sourceText.
	 * @returns the next character in sourceText
	 */
	next(): Char {
		// If we’ve read past the end of sourceText, return the ENDMARK character.
		const ch: string = (this.sourceIndex <= this.lastIndex) ? this.sourceText[this.sourceIndex] : '\u0003'
		const returned: Char = new Char(ch, this.sourceIndex, this.lineIndex, this.colIndex, this.sourceText)
		// maintain the line count
		// if current character is newline, then feed line and return carriage
		if (ch === '\n') {
			this.lineIndex += 1
			this.colIndex   = -1
		}
		this.sourceIndex += 1
		this.colIndex    += 1
		return returned
	}

	/**
	 * Lookahead one character.
	 * @returns the next character without advancing this scanner
	 */
	lookahead(): Char {
		const ch: string = (this.sourceIndex <= this.lastIndex) ? this.sourceText[this.sourceIndex] : '\u0003'
		let sourceIndex = this.sourceIndex
		let lineIndex   = this.lineIndex
		let colIndex    = this.colIndex
		if (ch === '\n') {
			lineIndex += 1
			colIndex   = -1
		}
		sourceIndex += 1
		colIndex    += 1
		return new Char(ch, sourceIndex, lineIndex, colIndex, this.sourceText)
	}
}
