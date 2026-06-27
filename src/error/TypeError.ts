import type {ConstructorType} from '../lib/index.ts';
import {
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	TypeErrorNoEntry,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from './index.ts';
import {ErrorCode} from './ErrorCode.ts';



/**
 * A CplTypeError is thrown when the validator recognizes a type mismatch.
 *
 * Known subclasses:
 * - TypeErrorInvalidOperation
 * - TypeErrorNotNarrow
 * - TypeErrorNotAssignable
 * - TypeErrorNoEntry
 * - TypeErrorNotCallable
 * - TypeErrorArgCount
 */
class CplTypeError extends ErrorCode {
	static readonly #CODE = 2300;

	protected static get CODES(): ReadonlyMap<ConstructorType<CplTypeError>, number> {
		return new Map<ConstructorType<CplTypeError>, number>([
			[TypeErrorInvalidOperation, 1],
			[TypeErrorNotNarrow,        2],
			[TypeErrorNotAssignable,    3],
			[TypeErrorNoEntry,          4],
			[TypeErrorNotCallable,      5],
			[TypeErrorArgCount,         6],
		]);
	}


	/**
	 * Construct a new CplTypeError object.
	 * @param message - a message to the user
	 * @param code    - the error number
	 * @param line    - the line index in source code
	 * @param col     - the column index in source code
	 */
	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: CplTypeError.name,
			code: CplTypeError.#CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
export {CplTypeError as TypeError};
