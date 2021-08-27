import {
	Filebound,
	Char,
	Lexer,
	LexError02,
} from '@chharvey/parser';
import {TokenIdentifier} from './TokenIdentifier.js';



export class TokenIdentifierUnicode extends TokenIdentifier {
	static readonly DELIM: '`' = '`'
	constructor (lexer: Lexer) {
		super(lexer, ...lexer.advance())
		while (!this.lexer.isDone && !Char.eq(TokenIdentifierUnicode.DELIM, this.lexer.c0)) {
			if (Char.eq(Filebound.EOT, this.lexer.c0)) {
				throw new LexError02(this)
			}
			this.advance()
		}
		// add ending delim to token
		this.advance()
	}
}
