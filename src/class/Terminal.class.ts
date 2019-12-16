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
	TokenStringLiteral,
	TokenStringTemplate,
	TokenStringTemplateFull,
	TokenStringTemplateHead,
	TokenStringTemplateMiddle,
	TokenStringTemplateTail,
	TokenNumber,
	TokenWord,
	TokenPunctuator,
} from './Token.class'

import {
	LexError02,
	LexError03,
	LexError04,
} from '../error/LexError.class'


type TokenCommentType =
	typeof TokenCommentLine |
	typeof TokenCommentMulti |
	typeof TokenCommentMultiNest |
	typeof TokenCommentDoc

enum TemplatePosition {
	FULL,
	HEAD,
	MIDDLE,
	TAIL,
}


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
	lex(lexer: Lexer, comment_type: TokenCommentType = TokenCommentLine): TokenComment {
		return (new Map<TokenCommentType, () => TokenComment>([
			[TokenCommentLine, (): TokenCommentLine => {
				const token: TokenCommentLine = new TokenCommentLine(lexer.c0)
				lexer.advance(TokenCommentLine.DELIM.length)
				while (!lexer.isDone && !Char.eq('\n', lexer.c0)) {
					if (Char.eq(ETX, lexer.c0)) throw new LexError02(token)
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
					if (Char.eq(ETX, lexer.c0)) throw new LexError02(token)
					token.add(lexer.c0)
					lexer.advance()
				}
				// add ending delim to token
				token.add(lexer.c0)
				lexer.advance(TokenCommentMulti.DELIM_END.length)
				return token
			}],
			[TokenCommentMultiNest, (): TokenCommentMultiNest => {
				let comment_multiline_level: number /* bigint */ = 0
				const token: TokenCommentMultiNest = new TokenCommentMultiNest(lexer.c0, lexer.c1 !)
				lexer.advance(TokenCommentMultiNest.DELIM_START.length)
				comment_multiline_level++;
				while (comment_multiline_level !== 0) {
					while (!lexer.isDone && !Char.eq(TokenCommentMultiNest.DELIM_END, lexer.c0, lexer.c1)) {
						if (Char.eq(ETX, lexer.c0)) throw new LexError02(token)
						if (Char.eq(TokenCommentMultiNest.DELIM_START, lexer.c0, lexer.c1)) {
							token.add(lexer.c0, lexer.c1 !)
							lexer.advance(TokenCommentMultiNest.DELIM_START.length)
							comment_multiline_level++;
						} else {
							token.add(lexer.c0)
							lexer.advance()
						}
					}
					// add ending delim to token
					token.add(lexer.c0, lexer.c1 !)
					lexer.advance(TokenCommentMultiNest.DELIM_END.length)
					comment_multiline_level--;
				}
				return token
			}],
			[TokenCommentDoc, (): TokenCommentDoc => {
				const token: TokenCommentDoc = new TokenCommentDoc(lexer.c0, lexer.c1 !, lexer.c2 !, lexer.c3 !)
				lexer.advance((TokenCommentDoc.DELIM_START + '\n').length)
				while (!lexer.isDone) {
					if (Char.eq(ETX, lexer.c0)) throw new LexError02(token)
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
export class TerminalStringLiteral extends Terminal {
	static readonly instance: TerminalStringLiteral = new TerminalStringLiteral()
	readonly TAGNAME: string = 'STRING-LITERAL'
	lex(lexer: Lexer): TokenStringLiteral {
				const token: TokenStringLiteral = new TokenStringLiteral(lexer.c0)
				lexer.advance()
				while (!lexer.isDone && !Char.eq(TokenStringLiteral.DELIM, lexer.c0)) {
					if (Char.eq(ETX, lexer.c0)) throw new LexError02(token)
					if (Char.eq('\\', lexer.c0)) { // possible escape or line continuation
						if (Char.inc(TokenStringLiteral.ESCAPES, lexer.c1)) { // an escaped character literal
							token.add(lexer.c0, lexer.c1 !)
							lexer.advance(2)
						} else if (Char.eq('u{', lexer.c1, lexer.c2)) { // an escape sequence
							let cargo: string = lexer.c0.source + lexer.c1 !.source + lexer.c2 !.source
							token.add(lexer.c0, lexer.c1 !, lexer.c2 !)
							lexer.advance(3)
							while(!Char.eq('}', lexer.c0)) {
								cargo += lexer.c0.source
								if (!Char.inc(TokenNumber.DIGITS.get(16) !, lexer.c0)) {
									throw new LexError03(cargo, lexer.c0.line_index, lexer.c0.col_index)
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
	}
	random(): string {
		const chars = (): string => (Util.randomBool() ?
			Util.randomChar('\' \\ \u0003'.split(' ')) /* `/[^'\#x03]/` */ :
			'\\' + escape()) + maybeChars()
		const maybeChars = (): string => Util.randomBool() ? '' : chars()
		const escape     = (): string => Util.arrayRandom([escapeChar, escapeCode, lineCont, nonEscapeChar])()
		const escapeChar = (): string => Util.arrayRandom(TokenStringLiteral.ESCAPES)
		const escapeCode = (): string => {
			let code: string = ''
			while (Util.randomBool()) {
				code += Util.arrayRandom(TokenNumber.DIGITS.get(16) !)
			}
			return `u{${code}}`
		}
		const lineCont = (): string => (Util.randomBool() ? '': '\u000d') + '\u000a'
		const nonEscapeChar = (): string => Util.randomBool() ?
			Util.randomChar('\' \\ s t n r u \u000D \u000A \u0003'.split(' ')) /* `/[^'\stnru#x0D#x0A#x03]/` */ :
			'u' + Util.randomChar(['{']) /* `/[^{]/` */
		return `${TokenStringLiteral.DELIM}${maybeChars()}${TokenStringLiteral.DELIM}`
	}
}
export abstract class TerminalStringTemplate extends Terminal {
	readonly TAGNAME: string = 'STRING-TEMPLATE'
	lex(lexer: Lexer, full_or_head: boolean = true): TokenStringTemplate {
		const positions: Set<TemplatePosition> = new Set<TemplatePosition>()
		const buffer: Char[] = []
		if (full_or_head) {
			buffer.push(lexer.c0)
			positions.add(TemplatePosition.FULL).add(TemplatePosition.HEAD)
			lexer.advance()
		} else {
			buffer.push(lexer.c0, lexer.c1 !)
			positions.add(TemplatePosition.MIDDLE).add(TemplatePosition.TAIL)
			lexer.advance(2)
		}
				while (!lexer.isDone) {
					if (Char.eq(ETX, lexer.c0)) throw new LexError02(new TokenStringTemplateFull(buffer[0], ...buffer.slice(1)))
					if (Char.eq('\\' + TokenStringTemplate.DELIM, lexer.c0, lexer.c1)) { // an escaped template delimiter
						buffer.push(lexer.c0, lexer.c1 !)
						lexer.advance(2)
					} else if (Char.eq(TokenStringTemplate.DELIM, lexer.c0)) { // end string template full/tail
						// add ending delim to token
						buffer.push(lexer.c0)
						lexer.advance(TokenStringTemplate.DELIM.length)
						positions.delete(TemplatePosition.HEAD)
						positions.delete(TemplatePosition.MIDDLE)
						break;
					} else if (Char.eq(TokenStringTemplate.DELIM_INTERP_START, lexer.c0, lexer.c1)) { // end string template head/middle
						// add start interpolation delim to token
						buffer.push(lexer.c0, lexer.c1 !)
						lexer.advance(TokenStringTemplate.DELIM_INTERP_START.length)
						positions.delete(TemplatePosition.FULL)
						positions.delete(TemplatePosition.TAIL)
						break;
					} else {
						buffer.push(lexer.c0)
						lexer.advance()
					}
				}
				return (new Map<TemplatePosition, (start_char: Char, ...more_chars: Char[]) => TokenStringTemplate>([
					[TemplatePosition.FULL  , (start_char: Char, ...more_chars: Char[]) => new TokenStringTemplateFull  (start_char, ...more_chars)],
					[TemplatePosition.HEAD  , (start_char: Char, ...more_chars: Char[]) => new TokenStringTemplateHead  (start_char, ...more_chars)],
					[TemplatePosition.MIDDLE, (start_char: Char, ...more_chars: Char[]) => new TokenStringTemplateMiddle(start_char, ...more_chars)],
					[TemplatePosition.TAIL  , (start_char: Char, ...more_chars: Char[]) => new TokenStringTemplateTail  (start_char, ...more_chars)],
				]).get([...positions][0]) !)(buffer[0], ...buffer.slice(1))
	}
	random(start: string = TokenStringTemplate.DELIM, end: string = TokenStringTemplate.DELIM): string {
		const chars = (): string => {
			const random: number = Math.random()
			return random < 0.333 ? Util.randomChar('` { \\ \u0003'.split(' ')) + maybeChars() :
			       random < 0.667 ? '{'  + (Util.randomBool() ? '' : Util.randomChar('` { \u0003'.split(' ')) + maybeChars()) :
			                        '\\' + (Util.randomBool() ? '`' : Util.randomChar('` \u0003'.split(' '))) + maybeChars()
		}
		const maybeChars = (): string => Util.randomBool() ? '' : chars()
		return `${start}${maybeChars()}${end}`
	}
}
export class TerminalStringTemplateFull extends TerminalStringTemplate {
	static readonly instance: TerminalStringTemplateFull = new TerminalStringTemplateFull()
	readonly TAGNAME: string = 'STRING-TEMPLATE-FULL'
	random(): string {
		return super.random(TokenStringTemplate.DELIM, TokenStringTemplate.DELIM)
	}
}
export class TerminalStringTemplateHead extends TerminalStringTemplate {
	static readonly instance: TerminalStringTemplateHead = new TerminalStringTemplateHead()
	readonly TAGNAME: string = 'STRING-TEMPLATE-HEAD'
	random(): string {
		return super.random(TokenStringTemplate.DELIM, TokenStringTemplate.DELIM_INTERP_START)
	}
}
export class TerminalStringTemplateMiddle extends TerminalStringTemplate {
	static readonly instance: TerminalStringTemplateMiddle = new TerminalStringTemplateMiddle()
	readonly TAGNAME: string = 'STRING-TEMPLATE-MIDDLE'
	random(): string {
		return super.random(TokenStringTemplate.DELIM_INTERP_END, TokenStringTemplate.DELIM_INTERP_START)
	}
}
export class TerminalStringTemplateTail extends TerminalStringTemplate {
	static readonly instance: TerminalStringTemplateTail = new TerminalStringTemplateTail()
	readonly TAGNAME: string = 'STRING-TEMPLATE-TAIL'
	random(): string {
		return super.random(TokenStringTemplate.DELIM_INTERP_END, TokenStringTemplate.DELIM)
	}
}
export class TerminalNumber extends Terminal {
	static readonly instance: TerminalNumber = new TerminalNumber()
	readonly TAGNAME: string = 'NUMBER'
	lex(lexer: Lexer, radix?: number): TokenNumber {
		const r: number = radix || TokenNumber.RADIX_DEFAULT // do not use default parameter because of the if-else below
		const digits: readonly string[] = TokenNumber.DIGITS.get(r) !
		let cargo: string = lexer.c0.source
		let token: TokenNumber;
		if (typeof radix === 'number') { // an explicit base
			cargo += lexer.c1 !.source
			if (!Char.inc(digits, lexer.c2)) {
				throw new LexError03(cargo, lexer.c0.line_index, lexer.c0.col_index)
			}
			token = new TokenNumber(r, lexer.c0, lexer.c1 !, lexer.c2 !)
			lexer.advance(3)
		} else { // implicit default base
			token = new TokenNumber(r, lexer.c0)
			lexer.advance()
		}
		while (Char.inc([...digits, TokenNumber.SEPARATOR], lexer.c0)) {
			if (Char.inc(digits, lexer.c0)) {
				token.add(lexer.c0)
				lexer.advance()
			} else if (Char.eq(TokenNumber.SEPARATOR, lexer.c0)) {
				if (Char.inc(digits, lexer.c1)) {
					token.add(lexer.c0, lexer.c1 !)
					lexer.advance(2)
				} else {
					throw new LexError04(Char.eq(TokenNumber.SEPARATOR, lexer.c1) ? lexer.c1 ! : lexer.c0)
				}
			}
		}
		return token
	}
	random(): string {
		const base: [string, number] = [...TokenNumber.BASES.entries()][Util.randomInt(6)]
		const digitSequence = (radix: number): string =>
			(Util.randomBool() ? '' : digitSequence(radix) + (Util.randomBool() ? '' : '_')) + Util.arrayRandom(TokenNumber.DIGITS.get(radix) !)
		return Util.randomBool() ? digitSequence(TokenNumber.RADIX_DEFAULT) : '\\' + base[0] + digitSequence(base[1])
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
