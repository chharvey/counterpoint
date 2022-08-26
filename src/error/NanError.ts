import type {ASTNode} from './package.js';
import {ErrorCode} from './ErrorCode.js';



class NanError extends ErrorCode {
	static override readonly NAME: string = 'NanError';
	static readonly CODE: number = 3200
	constructor(message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name: NanError.NAME,
			code: NanError.CODE + code,
			...((line !== void 0) ? {line_index: line} : {}),
			...((col  !== void 0) ? {col_index:  col}  : {}),
		})
	}
}
export class NanError01 extends NanError {
	static override readonly CODE = 1;
	constructor(node: ASTNode) {
		super(`Not a valid number.`, NanError01.CODE, node.line_index, node.col_index)
	}
}
export class NanError02 extends NanError {
	static override readonly CODE = 2;
	constructor(node: ASTNode) {
		super(`Division by zero.`, NanError02.CODE, node.line_index, node.col_index)
	}
}
