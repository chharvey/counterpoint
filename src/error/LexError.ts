import {ErrorCode} from './ErrorCode.js';



/**
 * A LexError is thrown when a span of source code fails to
 * produce a valid token per the rules of the defined lexical grammar.
 */
export class LexError extends ErrorCode {
	/** The name of this class of errors. */
	public static override readonly NAME = 'LexError';
	/** The number series of this class of errors. */
	public static readonly CODE: number = 1100;


	/**
	 * Construct a new LexError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: LexError.NAME,
			code: LexError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
