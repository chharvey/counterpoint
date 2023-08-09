import {
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	TypeErrorNoEntry,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from './index.js';
import type {ConstructorType} from './utils-private.js';
import {ErrorCode} from './ErrorCode.js';



/**
 * A TypeError is thrown when the validator recognizes a type mismatch.
 *
 * Known subclasses:
 * - TypeErrorInvalidOperation
 * - TypeErrorNotNarrow
 * - TypeErrorNotAssignable
 * - TypeErrorNoEntry
 * - TypeErrorNotCallable
 * - TypeErrorArgCount
 */
export class TypeError extends ErrorCode {
	static readonly #CODE = 2300;

	protected static get CODES(): ReadonlyMap<ConstructorType<TypeError>, number> {
		return new Map<ConstructorType<TypeError>, number>([
			[TypeErrorInvalidOperation, 1],
			[TypeErrorNotNarrow,        2],
			[TypeErrorNotAssignable,    4],
			[TypeErrorNoEntry,          5],
			[TypeErrorNotCallable,      6],
			[TypeErrorArgCount,         7],
		]);
	}


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
			code: TypeError.#CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
