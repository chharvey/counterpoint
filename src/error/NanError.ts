import type {ASTNode} from '../validator/index.js';
import {ErrorCode} from './ErrorCode.js';



/**
 * Known subclasses:
 * - NanError01
 * - NanError02
 */
class NanError extends ErrorCode {
	static readonly #CODE = 3200;
	public constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: NanError.name,
			code: NanError.#CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		});
	}
}
export class NanError01 extends NanError {
	static readonly #CODE = 1;
	public constructor(node: ASTNode) {
		super('Not a valid number.', NanError01.#CODE, node.line_index, node.col_index);
	}
}
export class NanError02 extends NanError {
	static readonly #CODE = 2;
	public constructor(node: ASTNode) {
		super('Division by zero.', NanError02.#CODE, node.line_index, node.col_index);
	}
}
