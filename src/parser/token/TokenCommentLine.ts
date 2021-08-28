import {
	Char,
	TokenComment,
	Lexer,
} from '@chharvey/parser';



export class TokenCommentLine extends TokenComment {
	static readonly DELIM_START: '%'  = '%'
	static readonly DELIM_END:   '\n' = '\n'
	constructor (lexer: Lexer) {
		super(lexer, TokenCommentLine.DELIM_START, TokenCommentLine.DELIM_END)
	}
	protected stopAdvancing() {
		return Char.eq(TokenCommentLine.DELIM_END, this.lexer.c0)
	}
}
