import Util from './Util.class'
import {Char, ETX} from './Scanner.class'
import Lexer from './Lexer.class'
import Token, {
	TokenFilebound,
	TokenWhitespace,
	TokenComment,
	TokenCommentLine,
	TokenCommentMulti,
	TokenCommentMultiNest,
	TokenCommentDoc,
	TokenString,
	TokenStringLiteral,
	TokenStringTemplate,
	TokenNumber,
	TokenWord,
	TokenPunctuator,
} from './Token.class'


type TokenCommentType =
	typeof TokenCommentLine |
	typeof TokenCommentMulti |
	typeof TokenCommentMultiNest |
	typeof TokenCommentDoc

type TokenStringType =
	typeof TokenStringLiteral |
	typeof TokenStringTemplate

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
	/** How many levels of nested multiline comments are we in? */
	private comment_multiline_level: number /* bigint */ = 0
	lex(lexer: Lexer, comment_type: TokenCommentType = TokenCommentLine): TokenComment {
		return (new Map<TokenCommentType, () => TokenComment>([
			[TokenCommentLine, (): TokenCommentLine => {
				const token: TokenCommentLine = new TokenCommentLine(lexer.c0)
				lexer.advance(TokenCommentLine.DELIM.length)
				while (!lexer.isDone && !Char.eq('\n', lexer.c0)) {
					if (Char.eq(ETX, lexer.c0)) throw new Error('Found end of file before end of comment')
					token.add(lexer.c0)
					lexer.advance()
				}
				// do not add '\n' to token
				return token
			}],
			[TokenCommentMulti, (): TokenCommentMulti => {
				const token: TokenCommentMulti = new TokenCommentMulti(lexer.c0)
				lexer.advance()
				while (!lexer.isDone && !Char.eq(TokenCommentMulti.DELIM_END, lexer.c0)) {
					if (Char.eq(ETX, lexer.c0)) throw new Error('Found end of file before end of comment')
					token.add(lexer.c0)
					lexer.advance()
				}
				// add ending delim to token
				token.add(lexer.c0)
				lexer.advance(TokenCommentMulti.DELIM_END.length)
				return token
			}],
			[TokenCommentMultiNest, (): TokenCommentMultiNest => {
				const token: TokenCommentMultiNest = new TokenCommentMultiNest(lexer.c0, lexer.c1 !)
				lexer.advance(TokenCommentMultiNest.DELIM_START.length)
				this.comment_multiline_level++;
				while (this.comment_multiline_level !== 0) {
					while (!lexer.isDone && !Char.eq(TokenCommentMultiNest.DELIM_END, lexer.c0, lexer.c1)) {
						if (Char.eq(ETX, lexer.c0)) throw new Error('Found end of file before end of comment')
						if (Char.eq(TokenCommentMultiNest.DELIM_START, lexer.c0, lexer.c1)) {
							token.add(lexer.c0, lexer.c1 !)
							lexer.advance(TokenCommentMultiNest.DELIM_START.length)
							this.comment_multiline_level++;
						} else {
							token.add(lexer.c0)
							lexer.advance()
						}
					}
					// add ending delim to token
					token.add(lexer.c0, lexer.c1 !)
					lexer.advance(TokenCommentMultiNest.DELIM_END.length)
					this.comment_multiline_level--;
				}
				return token
			}],
			[TokenCommentDoc, (): TokenCommentDoc => {
				const token: TokenCommentDoc = new TokenCommentDoc(lexer.c0, lexer.c1 !, lexer.c2 !, lexer.c3 !)
				lexer.advance((TokenCommentDoc.DELIM_START + '\n').length)
				while (!lexer.isDone) {
					if (Char.eq(ETX, lexer.c0)) throw new Error('Found end of file before end of comment')
					if (
						!Char.eq(TokenCommentDoc.DELIM_END + '\n', lexer.c0, lexer.c1, lexer.c2, lexer.c3) ||
						token.source.slice(token.source.lastIndexOf('\n') + 1).trim() !== '' // the tail end of the token does not match `/\n(\s)*/` (a newline followed by whitespace)
					) {
						token.add(lexer.c0)
						lexer.advance()
					} else {
						break;
					}
				}
				// add ending delim to token
				token.add(lexer.c0, lexer.c1 !, lexer.c2 !)
				lexer.advance(TokenCommentDoc.DELIM_END.length)
				return token
			}],
		]).get(comment_type) !)()
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
	lex(lexer: Lexer, string_type: TokenStringType = TokenStringLiteral): TokenString {
		return (new Map<TokenStringType, () => TokenString>([
			[TokenStringLiteral, (): TokenStringLiteral => {
				const token: TokenStringLiteral = new TokenStringLiteral(lexer.c0)
				lexer.advance()
				while (!lexer.isDone && !Char.eq(TokenStringLiteral.DELIM, lexer.c0)) {
					if (Char.eq(ETX, lexer.c0)) throw new Error('Found end of file before end of string')
					if (Char.eq('\\', lexer.c0)) { // possible escape or line continuation
						if (Char.inc([TokenStringLiteral.DELIM, '\\', 's','t','n','r'], lexer.c1)) { // an escaped character literal
							token.add(lexer.c0, lexer.c1 !)
							lexer.advance(2)
						} else if (Char.eq('u{', lexer.c1, lexer.c2)) { // an escape sequence
							const line : number = lexer.c0.line_index + 1
							const col  : number = lexer.c0.col_index  + 1
							let cargo  : string = lexer.c0.source + lexer.c1 !.source + lexer.c2 !.source
							token.add(lexer.c0, lexer.c1 !, lexer.c2 !)
							lexer.advance(3)
							while(!Char.eq('}', lexer.c0)) {
								cargo += lexer.c0.source
								if (!Char.inc(TokenNumber.DIGITS.get(16) !, lexer.c0)) {
									throw new Error(`Invalid escape sequence: \`${cargo}\` at line ${line} col ${col}.`)
								}
								token.add(lexer.c0)
								lexer.advance()
							}
							token.add(lexer.c0)
							lexer.advance()
						} else if (Char.eq('\n', lexer.c1)) { // a line continuation (LF)
							token.add(lexer.c0, lexer.c1 !)
							lexer.advance(2)
						} else if (Char.eq('\r\n', lexer.c1, lexer.c2)) { // a line continuation (CRLF)
							token.add(lexer.c0, lexer.c1 !, lexer.c2 !)
							lexer.advance(3)
						} else { // a backslash escapes the following character
							token.add(lexer.c0)
							lexer.advance()
						}
					} else {
						token.add(lexer.c0)
						lexer.advance()
					}
				}
				// add ending delim to token
				token.add(lexer.c0)
				lexer.advance(TokenStringLiteral.DELIM.length)
				return token
			}],
			[TokenStringTemplate, (): TokenStringTemplate => {
				const token: TokenStringTemplate = new TokenStringTemplate(lexer.c0)
				lexer.advance()
				while (!lexer.isDone) {
					if (Char.eq(ETX, lexer.c0)) throw new Error('Found end of file before end of string')
					if (Char.eq('\\' + TokenStringTemplate.DELIM, lexer.c0, lexer.c1)) { // an escaped template delimiter
						token.add(lexer.c0, lexer.c1 !)
						lexer.advance(2)
					} else if (Char.eq(TokenStringTemplate.DELIM_INTERP_START, lexer.c0, lexer.c1)) { // end string template head/middle
						// add start interpolation delim to token
						token.add(lexer.c0, lexer.c1 !)
						lexer.advance(TokenStringTemplate.DELIM_INTERP_START.length)
						break;
					} else if (Char.eq(TokenStringTemplate.DELIM, lexer.c0)) { // end string template full/tail
						// add ending delim to token
						token.add(lexer.c0)
						lexer.advance(TokenStringTemplate.DELIM.length)
						break;
					} else {
						token.add(lexer.c0)
						lexer.advance()
					}
				}
				return token
			}],
		]).get(string_type) !)()
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
		const base: [string, number] = [...TokenNumber.BASES.entries()][Util.randomInt(6)]
		const digitSequence = (radix: number): string =>
			(Util.randomBool() ? '' : digitSequence(radix) + (Util.randomBool() ? '' : '_')) + Util.arrayRandom(TokenNumber.DIGITS.get(radix) !)
		return (Util.randomBool() ? '' : '\\' + base[0]) + digitSequence(base[1])
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
