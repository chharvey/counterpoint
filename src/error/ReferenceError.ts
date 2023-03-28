import {
	ReferenceError01,
	ReferenceError02,
	ReferenceError03,
} from './index.js';
import type {ConstructorType} from './utils-private.js';
import {ErrorCode} from './ErrorCode.js';



/**
 * A ReferenceError is thrown when the validator fails to dereference an identifier.
 */
export class ReferenceError extends ErrorCode {
	/** The number series of this class of errors. */
	public static readonly CODE: number = 2100;

	protected static get CODES(): ReadonlyMap<ConstructorType<ReferenceError>, number> {
		return new Map<ConstructorType<ReferenceError>, number>([
			[ReferenceError01, 1],
			[ReferenceError02, 2],
			[ReferenceError03, 3],
		]);
	}


	/**
	 * Construct a new ReferenceError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: ReferenceError.name,
			code: ReferenceError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
