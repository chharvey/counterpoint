/** ENDMARK character signifies end of file. */
const ENDMARK: '\u0003' = '\u0003'

/** Like {@link Array#findIndex}, but returns the end-most index. */
function findLastIndex<T>(arr: readonly T[], predicate: (it: T, ix: number) => boolean): number|null {
	const returned = arr.map((it, i) => [it, i] as [T, number])
		.filter((pair) => predicate(pair[0], pair[1]))
		.reverse()
	return (returned.length) ? returned[0][1] : null
}



/**
 * A character in source code.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.1
 */
export class Char {
	/** The actual character string. */
	readonly cargo: string;
	/** Zero-based line number of this character (first line is line 0).*/
	readonly lineIndex: number;
	/** Zero-based column number of this character (first col is col 0). */
	readonly colIndex: number;

	/**
	 * Construct a new Char object.
	 * @param sourceText  - The entire source text.
	 * @param sourceIndex - The index of the character in source text.
	 */
	constructor(readonly sourceText: string, readonly sourceIndex: number) {
		/** Array of characters from source start until current iteration (not including current character). */
		const prev_chars: readonly string[] = [...this.sourceText].slice(0, this.sourceIndex)
		this.cargo = this.sourceText[this.sourceIndex]
		this.lineIndex = prev_chars.filter((c) => c === '\n').length
		this.colIndex = this.sourceIndex - ((findLastIndex(prev_chars, (c) => c === '\n') || -1) + 1)
	}

	/**
	 * Return a row that describes this character in a table.
	 * @returns a string representation of this character’s data
	 */
	toString(): string {
		const cargo = new Map([
			['\u0000' , 'NULL (U+0000)'],
			[' '      , 'SPACE (U+0020)'],
			['\u00a0' , 'NO-BREAK SPACE (U+00a0)'],
			['\n'     , 'LINE FEED (U+000a)'],
			['\t'     , 'CHARACTER TABULATION (U+0009)'],
			[ENDMARK  , 'END OF TEXT (U+0003)'],
		]).get(this.cargo) || this.cargo
		return `    ${this.lineIndex+1}    ${this.colIndex+1}    ${cargo}` // for some dumb reason, lines and cols start at 1 instad of 0
	}
}


/**
 * A Scanner object reads through the sourceText and returns one character at a time.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.2
 */
export default class Scanner {
	/**
	 * Construct a new Scanner object.
	 */
	private constructor() {
	}

	/**
	 * Return the next character in sourceText.
	 * @param   sourceText - the entire source text
	 * @returns the next character in sourceText
	 */
	static * generate(sourceText: string): Iterator<[Char, Char|null]> {
		sourceText= sourceText + ENDMARK
		for (let source_index = 0; source_index < sourceText.length; source_index++) {
			/** The current character. */
			const curr_char = sourceText[source_index]

			/** The lookahead character: the character after the current character. */
			const lookahead: string|null = (curr_char === ENDMARK) ? null : sourceText[source_index + 1];

			yield [
				new Char(sourceText, source_index),
				(lookahead === null) ? null : new Char(sourceText, source_index + 1),
			]
		}
	}
}
