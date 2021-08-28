import {
	Char,
	TokenComment,
	Lexer,
} from '@chharvey/parser';



export class TokenCommentMulti extends TokenComment {
	static readonly DELIM_START: '%%' = '%%'
	static readonly DELIM_END:   '%%' = '%%'
	constructor (lexer: Lexer) {
		super(lexer, TokenCommentMulti.DELIM_START, TokenCommentMulti.DELIM_END)
	}
	protected stopAdvancing() {
		return Char.eq(TokenCommentMulti.DELIM_END, this.lexer.c0, this.lexer.c1)
	}
}
