import {
	AssignmentError01,
	AssignmentError02,
	AssignmentError10,
} from './index.js';
import type {ConstructorType} from './utils-private.js';
import {ErrorCode} from './ErrorCode.js';



/**
 * An AssignmentError is thrown when the validator detects an illegal declaration or assignment.
 *
 * Known subclasses:
 * - AssignmentError01
 * - AssignmentError02
 * - AssignmentError03
 */
export class AssignmentError extends ErrorCode {
	static readonly #CODE = 2200;

	protected static get CODES(): ReadonlyMap<ConstructorType<AssignmentError>, number> {
		return new Map<ConstructorType<AssignmentError>, number>([
			[AssignmentError01,  1],
			[AssignmentError02,  2],
			[AssignmentError10, 10],
		]);
	}


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
			code: AssignmentError.#CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
