import {ErrorCode} from './ErrorCode.js';



/**
 * An AssignmentError is thrown when the validator detects an illegal declaration or assignment.
 */
export class AssignmentError extends ErrorCode {
	/** The number series of this class of errors. */
	public static readonly CODE: number = 2200;
	/**
	 * Construct a new AssignmentError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: AssignmentError.name,
			code: AssignmentError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
