import {
	Scanner,
	Lexer,
	Screener,
	Char,
	Token,
	TokenFilebound,
	TokenWhitespace,
	TokenComment,
} from '../lexer/'
import {
	LexError01,
	LexError02,
} from '../error/LexError.class'



export class LexerEBNF extends Lexer {
	constructor (source: string) {
		super(new Scanner(source).generate())
	}
	* generate(): Generator<Token> {
		while (!this.isDone) {
			let token: Token;
			if (Char.inc(TokenFilebound.CHARS, this.c0)) {
				token = new TokenFilebound(this)

			} else if (Char.inc(TokenWhitespace.CHARS, this.c0)) {
				token = new TokenWhitespace(this)

			} else if (Char.inc(TokenPunctuator.PUNCTUATORS_4, this.c0, this.c1, this.c2, this.c3)) {
				token = new TokenPunctuator(this, 4n)
			} else if (Char.inc(TokenPunctuator.PUNCTUATORS_3, this.c0, this.c1, this.c2)) {
				token = new TokenPunctuator(this, 3n)
			} else if (Char.inc(TokenPunctuator.PUNCTUATORS_2, this.c0, this.c1)) {
				token = new TokenPunctuator(this, 2n)
			} else if (Char.inc(TokenPunctuator.PUNCTUATORS_1, this.c0)) {
				if (Char.eq(TokenCharCode.START, this.c0, this.c1)) {
					/* we found a char code */
					token = new TokenCharCode(this)
				} else {
					/* we found a Kleene hash or another punctuator */
					token = new TokenPunctuator(this)
				}

			} else if (TokenIdentifier.START.test(this.c0.source)) {
				token = new TokenIdentifier(this)

			} else if (Char.eq(TokenString.DELIM, this.c0)) {
				token = new TokenString(this)

			} else if (Char.eq(TokenCharClass.DELIM_START, this.c0)) {
				token = new TokenCharClass(this)

			} else if (Char.eq(TokenCommentEBNF.DELIM_START, this.c0, this.c1)) {
				token = new TokenCommentEBNF(this)

			} else {
				throw new LexError01(this.c0)
			}
			yield token
		}
	}
}



export class ScreenerEBNF extends Screener {
	constructor (source: string) {
		super(new LexerEBNF(source).generate())
	}
	* generate(): Generator<Token> {
		while (!this.isDone) {
			if (!(this.t0 instanceof TokenWhitespace) && !(this.t0 instanceof TokenComment)) {
				yield this.t0
			}
			this.advance()
		}
	}
}



class TokenPunctuator extends Token {
	static readonly PUNCTUATORS_4: readonly string[] = `:::=`.split(' ')
	static readonly PUNCTUATORS_3: readonly string[] = `::=`.split(' ')
	static readonly PUNCTUATORS_2: readonly string[] = ``.split(' ')
	static readonly PUNCTUATORS_1: readonly string[] = `; ( ) < > | & + * # , ? -`.split(' ')
	private static cooked: bigint = 0n;
	constructor (lexer: Lexer, count: 1n | 2n | 3n | 4n = 1n) {
		super('PUNCTUATOR', lexer, ...lexer.advance())
		if (count >= 4n) {
			this.advance(3n)
		} else if (count >= 3n) {
			this.advance(2n)
		} else if (count >= 2n) {
			this.advance()
		}
	}
	cook(): bigint { return TokenPunctuator.cooked++; }
}
class TokenIdentifier extends Token {
	static readonly START: RegExp = /^[A-Z]$/
	static readonly REST:  RegExp = /^[A-Za-z0-9_]+$/
	private static cooked: bigint = 0x100n
	constructor (lexer: Lexer) {
		super('IDENTIFIER', lexer, ...lexer.advance())
		while (!this.lexer.isDone && TokenIdentifier.REST.test(this.lexer.c0.source)) {
			this.advance()
		}
	}
	cook(): bigint { return TokenIdentifier.cooked++; }
}
class TokenCharCode extends Token {
	static readonly START: '#x' = '#x'
	static readonly REST:  RegExp = /^[0-9a-f]+$/
	constructor (lexer: Lexer) {
		super('CHARCODE', lexer, ...lexer.advance(2n))
		while (!this.lexer.isDone && TokenCharCode.REST.test(this.lexer.c0.source)) {
			this.advance()
		}
	}
	cook(): string { return this.source }
}
class TokenString extends Token {
	static readonly DELIM: '"' = '"'
	constructor (lexer: Lexer) {
		super('STRING', lexer, ...lexer.advance())
		while (!this.lexer.isDone && !Char.eq(TokenString.DELIM, this.lexer.c0)) {
			if (Char.inc(TokenFilebound.CHARS, this.lexer.c0)) {
				throw new LexError02(this)
			}
			this.advance()
		}
		// add ending delim to token
		this.advance()
	}
	cook(): string { return this.source.slice(1, -1) }
}
class TokenCharClass extends Token {
	static readonly DELIM_START: '[' = '['
	static readonly DELIM_END:   ']' = ']'
	constructor (lexer: Lexer) {
		super('CHARCLASS', lexer, ...lexer.advance())
		while (!this.lexer.isDone && !Char.eq(TokenCharClass.DELIM_END, this.lexer.c0)) {
			if (Char.inc(TokenFilebound.CHARS, this.lexer.c0)) {
				throw new LexError02(this)
			}
			this.advance()
		}
		// add ending delim to token
		this.advance()
	}
	cook(): string { return this.source.slice(1, -1) }

}
class TokenCommentEBNF extends TokenComment {
	static readonly DELIM_START: '//' = '//'
	static readonly DELIM_END:   '\n' = '\n'
	constructor (lexer: Lexer) {
		super(lexer, TokenCommentEBNF.DELIM_START, TokenCommentEBNF.DELIM_END)
	}
	protected stopAdvancing() {
		return Char.eq(TokenCommentEBNF.DELIM_END, this.lexer.c0)
	}
}
