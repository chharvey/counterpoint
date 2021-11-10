import {ErrorCode} from './ErrorCode.js';



/**
 * A MutabilityError is thrown when the validator recognizes an attempt to mutate an immutable object.
 */
export class MutabilityError extends ErrorCode {
	/** The name of this class of errors. */
	static override readonly NAME: string = 'MutabilityError';
	/** The number series of this class of errors. */
	static readonly CODE: number = 2400;
	/**
	 * Construct a new MutabilityError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: MutabilityError.NAME,
			code: MutabilityError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
