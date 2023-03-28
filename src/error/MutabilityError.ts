import {MutabilityError01} from './index.js';
import type {ConstructorType} from './utils-private.js';
import {ErrorCode} from './ErrorCode.js';



/**
 * A MutabilityError is thrown when the validator recognizes an attempt to mutate an immutable object.
 */
export class MutabilityError extends ErrorCode {
	/** The number series of this class of errors. */
	public static readonly CODE: number = 2400;

	protected static get CODES(): ReadonlyMap<ConstructorType<MutabilityError>, number> {
		return new Map<ConstructorType<MutabilityError>, number>([
			[MutabilityError01, 1],
		]);
	}


	/**
	 * Construct a new MutabilityError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: MutabilityError.name,
			code: MutabilityError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
