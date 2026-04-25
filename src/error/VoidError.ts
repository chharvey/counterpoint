import type {ConstructorType} from '../lib/index.ts';
import {VoidErrorOutOfBounds} from './index.ts';
import {ErrorCode} from './ErrorCode.ts';



/**
 * Known subclasses:
 * - VoidErrorOutOfBounds
 */
export class VoidError extends ErrorCode {
	static readonly #CODE = 3100;

	protected static get CODES(): ReadonlyMap<ConstructorType<VoidError>, number> {
		return new Map<ConstructorType<VoidError>, number>([
			[VoidErrorOutOfBounds, 1],
		]);
	}


	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: VoidError.name,
			code: VoidError.#CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
