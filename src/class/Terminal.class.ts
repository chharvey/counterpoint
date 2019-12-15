import Util from './Util.class'
import {Char} from './Scanner.class'
import Lexer from './Lexer.class'
import Token, {
	TokenFilebound,
	TokenWhitespace,
	TokenNumber,
	TokenWord,
	TokenPunctuator,
} from './Token.class'


/**
 * A Terminal is a symbol in a production (a formal context-free grammar) that cannot be reduced any further.
 * It serves as a distinction betwen different types of actual tokens.
 */
export default abstract class Terminal {
	abstract readonly TAGNAME: string;
	/**
	 * Generate a Token from a lexer’s input stream using this Terminal’s lexing rules.
	 * @param   lexer - the lexer whose input stream to use
	 * @returns         a Token satisfying this Terminal
	 */
	abstract lex(lexer: Lexer): Token;
	/**
	 * Generate a random instance of this Terminal.
	 * @returns a well-formed string satisfying this Terminal
	 */
	abstract random(): string;
	/**
	 * Does the given token satisfy this Terminal?
	 * @param   candidate - a Token to test
	 * @returns             does the given Token satisfy this Terminal?
	 */
	match(candidate: Token): boolean {
		return candidate.tagname === this.TAGNAME
	}
}


export class TerminalFilebound extends Terminal {
	static readonly instance: TerminalFilebound = new TerminalFilebound()
	readonly TAGNAME: string = 'FILEBOUND'
	lex(lexer: Lexer): TokenFilebound {
		const token: TokenFilebound = new TokenFilebound(lexer.c0)
		lexer.advance()
		return token
	}
	random(): string {
		return Util.arrayRandom(TokenFilebound.CHARS)
	}
}
export class TerminalWhitespace extends Terminal {
	static readonly instance: TerminalWhitespace = new TerminalWhitespace()
	readonly TAGNAME: string = 'WHITESPACE'
	lex(lexer: Lexer): TokenWhitespace {
		const token: TokenWhitespace = new TokenWhitespace(lexer.c0)
		lexer.advance()
		while (!lexer.isDone && Char.inc(TokenWhitespace.CHARS, lexer.c0)) {
			token.add(lexer.c0)
			lexer.advance()
		}
		return token
	}
	random(): string {
		return (Util.randomBool() ? '' : this.random()) + Util.arrayRandom(TokenWhitespace.CHARS)
	}
}
export class TerminalComment extends Terminal {
	static readonly instance: TerminalComment = new TerminalComment()
	readonly TAGNAME: string = 'COMMENT'
	lex(lexer: Lexer): Token {
		throw new Error('not yet supported' || lexer) //  TODO
	}
	random(): string {
		throw new Error('not yet supported')
	}
	match(candidate: Token): boolean {
		return candidate.tagname.split('-')[0] === this.TAGNAME
	}
}
export class TerminalString extends Terminal {
	static readonly instance: TerminalString = new TerminalString()
	readonly TAGNAME: string = 'STRING'
	lex(lexer: Lexer): Token {
		throw new Error('not yet supported' || lexer) //  TODO
	}
	random(): string {
		throw new Error('not yet supported')
	}
	match(candidate: Token): boolean {
		return candidate.tagname.split('-')[0] === this.TAGNAME
	}
}
export class TerminalNumber extends Terminal {
	static readonly instance: TerminalNumber = new TerminalNumber()
	readonly TAGNAME: string = 'NUMBER'
	lex(lexer: Lexer, radix?: number): TokenNumber {
		const r: number = radix || TokenNumber.RADIX_DEFAULT // do not use default parameter because of the if-else below
		const digits: readonly string[] = TokenNumber.DIGITS.get(r) !
		const line  : number = lexer.c0.line_index + 1
		const col   : number = lexer.c0.col_index  + 1
		let cargo   : string = lexer.c0.source
		let token: TokenNumber;
		if (typeof radix === 'number') {
			cargo += lexer.c1 !.source
			if (!Char.inc(digits, lexer.c2)) {
				throw new Error(`Invalid escape sequence: \`${cargo}\` at line ${line} col ${col}.`)
			}
			cargo += lexer.c2 !.source
			token = new TokenNumber(r, lexer.c0, lexer.c1 !, lexer.c2 !)
			lexer.advance(3)
		} else {
			token = new TokenNumber(r, lexer.c0)
			lexer.advance()
		}
		while (Char.inc([...digits, TokenNumber.SEPARATOR], lexer.c0)) {
			if (Char.inc(digits, lexer.c0)) {
				cargo += lexer.c0.source
				token.add(lexer.c0)
				lexer.advance()
			} else if (Char.eq(TokenNumber.SEPARATOR, lexer.c0)) {
				if (Char.inc(digits, lexer.c1)) {
					cargo += lexer.c0.source + lexer.c1 !.source
					token.add(lexer.c0, lexer.c1 !)
					lexer.advance(2)
				} else if (Char.eq(TokenNumber.SEPARATOR, lexer.c1)) {
					throw new Error(`Adjacent numeric separators not allowed at line ${lexer.c1 !.line_index+1} col ${lexer.c1 !.col_index+1}.`)
				} else {
					throw new Error(`Numeric separator not allowed at end of numeric literal \`${cargo}\` at line ${line} col ${col}.`)
				}
			}
		}
		return token
	}
	random(): string {
		const digitSequenceDec = (): string =>
			(Util.randomBool() ? '' : digitSequenceDec()) + Util.arrayRandom(TokenNumber.DIGITS.get(10) !)
		return digitSequenceDec()
	}
}
export class TerminalWord extends Terminal {
	static readonly instance: TerminalWord = new TerminalWord()
	readonly TAGNAME: string = 'WORD'
	lex(lexer: Lexer): TokenWord {
		const token: TokenWord = new TokenWord(lexer.c0)
		lexer.advance()
		while (!lexer.isDone && Char.inc(TokenWord.CHARS_REST, lexer.c0)) {
			token.add(lexer.c0)
			lexer.advance()
		}
		return token
	}
	random(): string {
		throw new Error('not yet supported')
	}
}
export class TerminalPunctuator extends Terminal {
	static readonly instance: TerminalPunctuator = new TerminalPunctuator()
	readonly TAGNAME: string = 'PUNCTUATOR'
	lex(lexer: Lexer, count: number = 1): TokenPunctuator {
		if (count < 0 || 3 < count) throw new Error('Expected an integer between 1 and 3.')
		let token: TokenPunctuator;
		if (count >= 3) {
			token = new TokenPunctuator(lexer.c0, lexer.c1 !, lexer.c2 !)
		} else if (count >= 2) {
			token = new TokenPunctuator(lexer.c0, lexer.c1 !)
		} else {
			token = new TokenPunctuator(lexer.c0)
		}
		lexer.advance(count)
		return token
	}
	random(): string {
		return Util.arrayRandom([
			...TokenPunctuator.CHARS_1,
		])
	}
}
