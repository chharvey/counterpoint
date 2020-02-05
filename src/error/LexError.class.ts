import Char from '../class/Char.class'
import Token from '../class/Token.class'

import SolidError from './SolidError.class'


export default class LexError extends SolidError {
	static readonly NAME: string = 'LexError'
	static readonly CODE: number = 1100
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name       : LexError.NAME,
			code       : LexError.CODE + code,
			line_index : line,
			col_index  : col,
		})
	}
}
export class LexError01 extends LexError {
	static readonly CODE = 1
	constructor (char: Char) {
		super(`Unrecognized character: \`${char.source}\` at line ${char.line_index + 1} col ${char.col_index + 1}.`, LexError01.CODE, char.line_index, char.col_index)
	}
}
export class LexError02 extends LexError {
	static readonly CODE = 2
	constructor (token: Token) {
		super(`Found end of file before end of ${token.tagname}.`, LexError02.CODE, token.line_index, token.col_index)
	}
}
export class LexError03 extends LexError {
	static readonly CODE = 3
	constructor (span: string, line: number, col: number) {
		super(`Invalid escape sequence: \`${span}\` at line ${line + 1} col ${col + 1}.`, LexError03.CODE, line, col)
	}
}
export class LexError04 extends LexError {
	static readonly CODE = 4
	constructor (char: Char) {
		super(`Numeric separator not allowed: at line ${char.line_index + 1} col ${char.col_index + 1}.`, LexError04.CODE, char.line_index, char.col_index)
	}
}
