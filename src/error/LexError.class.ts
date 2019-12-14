import SolidError from './SolidError.class'
import Token from '../class/Token.class'


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
	constructor (char: string, line: number, col: number) { // TODO use `Char` class
		super(`Unrecognized character: \`${char}\` at line ${line+1} col ${col+1}.`, LexError01.CODE, line, col);
	}
}
export class LexError02 extends LexError {
	static readonly CODE = 2
	constructor (token: Token) {
		super(`Found end of file before end of ${token.tagname}.`, LexError02.CODE, token.line_index, token.col_index);
	}
}
export class LexError03 extends LexError {
	static readonly CODE = 3
	constructor (span: string, line: number, col: number) {
		super(`Invalid escape sequence: \`${span}\` at line ${line+1} col ${col+1}.`, LexError03.CODE, line, col);
	}
}
