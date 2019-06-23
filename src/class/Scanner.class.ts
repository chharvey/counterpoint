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
	/**
	 * Construct a new Char object.
	 *
	 * @param cargo       The actual character.
	 * @param sourceIndex The index of the character in source text.
	 * @param lineIndex   The index of the line the character is on.
	 * @param colIndex    The index of the column the character is on.
	 */
	constructor(
		readonly cargo       : string,
		readonly sourceIndex : number,
		readonly lineIndex   : number,
		readonly colIndex    : number,
	) {
	}
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
			/** Array of characters from source start until current iteration (not including current character). */
			const prev_chars: readonly string[] = [...sourceText].slice(0, source_index)
			/** The current character. */
			const curr_char = sourceText[source_index]
			/** Zero-based line number of the current character (first line is line 0). */
			const line_index: number = prev_chars.filter((c) => c === '\n').length
			/** Zero-based column number of the current character (first col is col 0). */
			const col_index: number = source_index - ((findLastIndex(prev_chars, (c) => c === '\n') || -1) + 1)

			/** The lookahead character: the character after the current character. */
			const lookahead: string|null = (curr_char === ENDMARK) ? null : sourceText[source_index + 1];

			yield [
				new Char(curr_char, source_index, line_index, col_index),
				(lookahead === null) ? null : new Char(
					lookahead,
					source_index + 1,
					(curr_char === '\n') ? line_index + 1 : line_index,
					(curr_char === '\n') ? 0              : col_index + 1,
				),
			]
		}
	}
}
