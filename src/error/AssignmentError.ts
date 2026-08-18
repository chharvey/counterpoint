import type {ConstructorType} from '../lib/index.ts';
import {
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorDuplicateKey,
	AssignmentErrorReassignment,
	AssignmentErrorDeletion,
	AssignmentErrorMissingType,
} from './index.ts';
import {ErrorCode} from './ErrorCode.ts';



/**
 * An AssignmentError is thrown when the validator detects an illegal declaration or assignment.
 *
 * Known subclasses:
 * - AssignmentErrorDuplicateDeclaration
 * - AssignmentErrorDuplicateKey
 * - AssignmentErrorReassignment
 * - AssignmentErrorMissingType
 */
export class AssignmentError extends ErrorCode {
	static readonly #CODE = 2200;

	protected static get CODES(): ReadonlyMap<ConstructorType<AssignmentError>, number> {
		return new Map<ConstructorType<AssignmentError>, number>([
			[AssignmentErrorDuplicateDeclaration,  1],
			[AssignmentErrorDuplicateKey,          2],
			[AssignmentErrorReassignment,         10],
			[AssignmentErrorDeletion,             11],
			[AssignmentErrorMissingType,          20],
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
