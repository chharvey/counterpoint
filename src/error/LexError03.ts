import {LexError} from './LexError.js';



/**
 * A LexError03 is thrown when an integer literal or string literal contains an invalid Unicode escape sequence.
 * @example
 * 'this is invalid: \u{defg}'; % LexError03: Invalid escape sequence...
 */
export class LexError03 extends LexError {
	/**
	 * Construct a new LexError03 object.
	 * @param span - the invalid escape sequence
	 * @param line - the line   index of the string’s location
	 * @param col  - the column index of the string’s location
	 */
	public constructor(span: string, line: number, col: number) {
		super(
			`Invalid escape sequence: \`${ span }\` at line ${ line + 1 } col ${ col + 1 }.`,
			LexError.CODES.get(LexError03),
			line,
			col,
		);
	}
}
