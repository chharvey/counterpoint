import type Char from '../class/Char.class'
import type Token from '../class/Token.class'

import SolidError from './SolidError.class'



/**
 * A LexError is thrown when a span of source code fails to
 * produce a valid token per the rules of the defined lexical grammar.
 */
export default class LexError extends SolidError {
	/** The name of this class of errors. */
	static readonly NAME: string = 'LexError'
	/** The number series of this class of errors. */
	static readonly CODE: number = 1100
	/**
	 * Construct a new LexError object.
	 * @param message - a message to the user
	 * @param code    - the error number
	 * @param line    - the line index in source code
	 * @param col     - the column index in source code
	 */
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name       : LexError.NAME,
			code       : LexError.CODE + code,
			line_index : line,
			col_index  : col,
		})
	}
}


/**
 * A LexError01 is thrown when the lexer reaches an unrecognized character.
 * @example
 * let æ: str = 'ae'; % LexError01: Unrecognized character...
 */
export class LexError01 extends LexError {
	/** The number series of this class of errors. */
	static readonly CODE = 1
	/**
	 * Construct a new LexError01 object.
	 * @param char - the unrecognized character
	 */
	constructor (char: Char) {
		super(`Unrecognized character: \`${char.source}\` at line ${char.line_index + 1} col ${char.col_index + 1}.`, LexError01.CODE, char.line_index, char.col_index)
	}
}
/**
 * A LexError02 is thrown when the lexer reaches the end of the file before the end of a token.
 * @example
 * let i: int %% a comment
 * % LexError02: Found end of file before end of comment.
 */
export class LexError02 extends LexError {
	/** The number series of this class of errors. */
	static readonly CODE = 2
	/**
	 * Construct a new LexError02 object.
	 * @param token - the token that did not finish
	 */
	constructor (token: Token) {
		super(`Found end of file before end of ${token.tagname}.`, LexError02.CODE, token.line_index, token.col_index)
	}
}
/**
 * A LexError03 is thrown when an integer literal or string literal contains an invalid Unicode escape sequence.
 * @example
 * 'this is invalid: \u{defg}'; % LexError03: Invalid escape sequence...
 */
export class LexError03 extends LexError {
	/** The number series of this class of errors. */
	static readonly CODE = 3
	/**
	 * Construct a new LexError03 object.
	 * @param span - the invalid escape sequence
	 * @param line - the line   index of the string’s location
	 * @param col  - the column index of the string’s location
	 */
	constructor (span: string, line: number, col: number) {
		super(`Invalid escape sequence: \`${span}\` at line ${line + 1} col ${col + 1}.`, LexError03.CODE, line, col)
	}
}
/**
 * A LexError04 is thrown when a numeric separator was found in a number literal but was not expected.
 *
 * The numeric separator is the underscore character, `_` **U+005F LOW LINE**,
 * and may be used to separate the digits in a number literal token to improve readability.
 * This error is thrown when a numeric separator is found where it does not belong.
 * @example
 * 1_000__000; % LexError04: Numeric separator not allowed...
 * 1_000_000_; % LexError04: Numeric separator not allowed...
 */
export class LexError04 extends LexError {
	/** The number series of this class of errors. */
	static readonly CODE = 4
	/**
	 * Construct a new LexError03 object.
	 * @param char - the numeric separator character
	 */
	constructor (char: Char) {
		super(`Numeric separator not allowed: at line ${char.line_index + 1} col ${char.col_index + 1}.`, LexError04.CODE, char.line_index, char.col_index)
	}
}
/**
 * A LexError05 is thrown when a float literal has an invalid format.
 * @example
 * 5.e+2; % LexError05: Invalid floating-point literal format...
 * 5.0E2; % LexError05: Invalid floating-point literal format...
 * 5.0e;  % LexError05: Invalid floating-point literal format...
 */
export class LexError05 extends LexError {
	/** The number series of this class of errors. */
	static readonly CODE = 5
	/**
	 * Construct a new LexError05 object.
	 * @param token - the float literal token
	 */
	constructor (char: Char) {
		super(`Invalid exponential notation: at line ${char.line_index + 1} col ${char.col_index + 1}.`, LexError05.CODE, char.line_index, char.col_index)
	}
}
