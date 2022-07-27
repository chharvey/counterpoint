import {ErrorCode} from './ErrorCode.js';



/**
 * A ReferenceError is thrown when the validator fails to dereference an identifier.
 */
export class ReferenceError extends ErrorCode {
	/** The name of this class of errors. */
	static override readonly NAME: string = 'ReferenceError';
	/** The number series of this class of errors. */
	static readonly CODE: number = 2100;
	/**
	 * Construct a new ReferenceError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: ReferenceError.NAME,
			code: ReferenceError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
