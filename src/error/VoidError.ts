import type {ASTNode} from './package.js';
import {ErrorCode} from './ErrorCode.js';



class VoidError extends ErrorCode {
	static override readonly NAME: string = 'VoidError';
	static readonly CODE: number = 3100;
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: VoidError.NAME,
			code: VoidError.CODE + code,
			line_index: line,
			col_index: col,
		});
	}
}
/**
 * A VoidError01 is thrown when an expression that has no value is used in some way.
 */
export class VoidError01 extends VoidError {
	static override readonly CODE = 1;
	constructor (node: ASTNode) {
		super(`Value is undefined.`, VoidError01.CODE, node.line_index, node.col_index);
	}
}
