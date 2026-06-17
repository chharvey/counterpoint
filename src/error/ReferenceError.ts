import type {ConstructorType} from '../lib/index.ts';
import {
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
} from './index.ts';
import {ErrorCode} from './ErrorCode.ts';



/**
 * A CplReferenceError is thrown when the validator fails to dereference an identifier.
 *
 * Known subclasses:
 * - ReferenceErrorUndeclared
 * - ReferenceErrorDeadZone
 * - ReferenceErrorKind
 */
class CplReferenceError extends ErrorCode {
	static readonly #CODE = 2100;

	protected static get CODES(): ReadonlyMap<ConstructorType<CplReferenceError>, number> {
		return new Map<ConstructorType<CplReferenceError>, number>([
			[ReferenceErrorUndeclared, 1],
			[ReferenceErrorDeadZone,   2],
			[ReferenceErrorKind,       3],
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
			name: CplReferenceError.name,
			code: CplReferenceError.#CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
export {CplReferenceError as ReferenceError};
