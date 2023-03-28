import {
	LexError01,
	LexError03,
	LexError04,
	LexError05,
} from './index.js';
import type {ConstructorType} from './utils-private.js';
import {ErrorCode} from './ErrorCode.js';



/**
 * A LexError is thrown when a span of source code fails to
 * produce a valid token per the rules of the defined lexical grammar.
 */
export class LexError extends ErrorCode {
	static readonly #CODE = 1100;

	protected static get CODES(): ReadonlyMap<ConstructorType<LexError>, number> {
		return new Map<ConstructorType<LexError>, number>([
			[LexError01, 1],
			[LexError03, 3],
			[LexError04, 4],
			[LexError05, 5],
		]);
	}


	/**
	 * Construct a new LexError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: LexError.name,
			code: LexError.#CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
