import {
	Lexer,
	Char,
	Token,
	TokenFilebound,
	TokenComment,
} from '../lexer/'
import {
	LexError02,
} from '../error/LexError.class'



export class TokenPunctuator extends Token {
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



export class TokenIdentifier extends Token {
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



export class TokenCharCode extends Token {
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



export class TokenString extends Token {
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



export class TokenCharClass extends Token {
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



export class TokenCommentEBNF extends TokenComment {
	static readonly DELIM_START: '//' = '//'
	static readonly DELIM_END:   '\n' = '\n'
	constructor (lexer: Lexer) {
		super(lexer, TokenCommentEBNF.DELIM_START, TokenCommentEBNF.DELIM_END)
	}
	protected stopAdvancing() {
		return Char.eq(TokenCommentEBNF.DELIM_END, this.lexer.c0)
	}
}
