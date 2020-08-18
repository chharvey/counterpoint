import type SemanticNode from '../typer/SemanticNode.class'
import SolidError from './SolidError.class'


export default class NanError extends SolidError {
	static readonly NAME: string = 'NanError'
	static readonly CODE: number = 3200
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name       : NanError.NAME,
			code       : NanError.CODE + code,
			line_index : line,
			col_index  : col,
		})
	}
}
export class NanError01 extends NanError {
	static readonly CODE = 1
	constructor (node: SemanticNode) {
		super(`Not a valid number.`, NanError01.CODE, node.line_index, node.col_index)
	}
}
export class NanError02 extends NanError {
	static readonly CODE = 2
	constructor (node: SemanticNode) {
		super(`Division by zero.`, NanError02.CODE, node.line_index, node.col_index)
	}
}
