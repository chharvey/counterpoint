import {
	ASTNode,
	ErrorCode,
} from '@chharvey/parser';
import type {SolidType} from '../typer/index.js';


class MutabilityError extends ErrorCode {
	static override readonly NAME: string = 'MutabilityError';
	static readonly CODE: number = 2400;
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name:       MutabilityError.NAME,
			code:       MutabilityError.CODE + code,
			line_index: line,
			col_index:  col,
		});
	}
}
export class MutabilityError01 extends MutabilityError {
	static override readonly CODE = 1;
	constructor (node: ASTNode, typ: SolidType) {
		super(`Mutation of an object of immutable type \`${ typ }\`.`, MutabilityError01.CODE, node.line_index, node.col_index);
	}
}
