import {ErrorCode} from './ErrorCode.js';



/**
 * A TypeError is thrown when the validator recognizes a type mismatch.
 */
export class TypeError extends ErrorCode {
	/** The number series of this class of errors. */
	public static readonly CODE: number = 2300;
	/**
	 * Construct a new TypeError object.
	 * @param message - a message to the user
	 * @param code    - the error number
	 * @param line    - the line index in source code
	 * @param col     - the column index in source code
	 */
	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: TypeError.name,
			code: TypeError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
