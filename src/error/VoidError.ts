import type {ASTNode} from '../validator/index.js';
import {ErrorCode} from './ErrorCode.js';



/**
 * Known subclasses:
 * - VoidError01
 */
class VoidError extends ErrorCode {
	static readonly #CODE = 3100;
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
/**
 * A VoidError01 is thrown when an expression that has no value is used in some way.
 */
export class VoidError01 extends VoidError {
	static readonly #CODE = 1;
	public constructor(node: ASTNode) {
		super('Value is undefined.', VoidError01.#CODE, node.line_index, node.col_index);
	}
}
