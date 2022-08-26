import type {
	Serializable,
} from './package.js';
import {ErrorCode} from './ErrorCode.js';



/**
 * A ParseError is thrown when the parser fails to parse a span of source code
 * per the rules of the defined syntactic grammar.
 */
class ParseError extends ErrorCode {
	/** The name of this class of errors. */
	static override readonly NAME = 'ParseError';
	/** The number series of this class of errors. */
	static readonly CODE: number = 1200;


	/**
	 * Construct a new ParseError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: ParseError.NAME,
			code: ParseError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}



/**
 * A ParseError01 is thrown when the parser does not recognize the lookahead token.
 */
// @ts-expect-error
class ParseError01 extends ParseError {
	/** The number series of this class of errors. */
	static override readonly CODE = 1;


	/**
	 * Construct a new ParseError01 object.
	 * @param token the unexpected token
	 */
	constructor(token: Serializable) {
		super(`Unexpected token: \`${ token.source }\` at line ${ token.line_index + 1 } col ${ token.col_index + 1 }.`, ParseError01.CODE, token.line_index, token.col_index);
	}
}
