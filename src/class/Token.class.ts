import Serializable from '../iface/Serializable.iface'
import Util from './Util.class'
import {Char, STX, ETX} from './Scanner.class'
import Lexer from './Lexer.class'
import Translator from './Translator.class'

import {
	LexError02,
	LexError03,
	LexError04,
} from '../error/LexError.class'


export enum TemplatePosition {
	FULL,
	HEAD,
	MIDDLE,
	TAIL,
}

enum KeywordKind {
	STORAGE,
	MODIFIER,
}


/**
 * A Token object is the kind of thing that the Lexer returns.
 * It holds:
 * - the text of the token (self.cargo)
 * - the line number and column index where the token starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_6.4
 */
export default abstract class Token implements Serializable {
	/** All the characters in this Token. */
	private _cargo: string;
	/** Zero-based line number of the first character (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first character (first col is col 0). */
	readonly col_index: number;

	/**
	 * Construct a new Token object.
	 *
	 * @param tagname    - the name of the type of this Token
	 * @param start_char - the starting character of this Token
	 * @param more_chars - additional characters to add upon construction
	 */
	constructor (
		readonly tagname: string,
		start_char: Char,
		...more_chars: Char[]
	) {
		this._cargo     = [start_char, ...more_chars].map((char) => char.source).join('')
		this.line_index = start_char.line_index
		this.col_index  = start_char.col_index
	}

	/**
	 * Get the sum of this Token’s cargo.
	 * @returns all the source characters in this Token
	 */
	get source(): string {
		return this._cargo
	}

	/**
	 * Add to this Token’s cargo.
	 * @param chars - the characters to append
	 */
	add(...chars: Char[]): void {
		this._cargo += chars.map((char) => char.source).join('')
	}

	/**
	 * Return this Token’s cooked value.
	 * The cooked value is the computed or evaluated contents of this Token,
	 * to be sent to the parser and compiler.
	 * If this Token is not to be sent to the parser, then return `null`.
	 * @param   translator - the translator to cook this Token
	 * @returns              the computed value of this token, or `null`
	 */
	abstract cook(translator: Translator): string|number|boolean|null;

	/**
	 * @implements Serializable
	 */
	serialize(trans: Translator|null = null): string {
		const cooked: string|number|boolean|null = trans ? this.cook(trans) : null
		const attributes: string = ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
			(trans && cooked !== null) ? `value="${(typeof cooked === 'string') ? cooked
				.replace(/\&/g, '&amp;' )
				.replace(/\</g, '&lt;'  )
				.replace(/\>/g, '&gt;'  )
				.replace(/\'/g, '&apos;')
				.replace(/\"/g, '&quot;')
				.replace(/\\/g, '&#x5c;')
				.replace(/\t/g, '&#x09;')
				.replace(/\n/g, '&#x0a;')
				.replace(/\r/g, '&#x0d;')
				.replace(/\u0000/g, '&#x00;')
			: cooked.toString()}"` : '',
		].join(' ').trim()
		const formatted: string = this.source
			.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
			.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
		return `<${this.tagname}${attributes}>${formatted}</${this.tagname}>`
	}
}


export class TokenFilebound extends Token {
	static readonly TAGNAME: string = 'FILEBOUND'
	static readonly CHARS: readonly string[] = [STX, ETX]
	constructor (lexer: Lexer) {
		super(TokenFilebound.TAGNAME, lexer.c0)
		lexer.advance()
	}
	cook(_trans: Translator): boolean {
		return this.source === STX /* || !this.source === ETX */
	}
}
export class TokenWhitespace extends Token {
	static readonly TAGNAME: string = 'WHITESPACE'
	static readonly CHARS: readonly string[] = [' ', '\t', '\n']
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		while (!lexer.isDone && Char.inc(TokenWhitespace.CHARS, lexer.c0)) {
			buffer.push(lexer.c0)
			lexer.advance()
		}
		super(TokenWhitespace.TAGNAME, buffer[0], ...buffer.slice(1))
	}
	cook(_trans: Translator): null {
		return null // we do not want to send whitespace to the parser
	}
}
export abstract class TokenComment extends Token {
	static readonly TAGNAME: string = 'COMMENT'
	constructor (kind: string, start_char: Char, ...more_chars: Char[]) {
		super(`${TokenComment.TAGNAME}-${kind}`, start_char, ...more_chars)
	}
	/** @final */ cook(_trans: Translator): null {
		return null // we do not want to send comments to the parser
	}
}
export class TokenCommentLine extends TokenComment {
	static readonly TAGNAME: string = 'LINE'
	static readonly DELIM: '\\' = '\\'
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance(TokenCommentLine.DELIM.length)
		while (!lexer.isDone && !Char.eq('\n', lexer.c0)) {
			if (Char.eq(ETX, lexer.c0)) {
				super(TokenCommentLine.TAGNAME, buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			buffer.push(lexer.c0)
			lexer.advance()
		}
		// do not add '\n' to token
		super(TokenCommentLine.TAGNAME, buffer[0], ...buffer.slice(1))
	}
}
export class TokenCommentMulti extends TokenComment {
	static readonly TAGNAME: string = 'MULTI'
	static readonly DELIM_START : '"' = '"'
	static readonly DELIM_END   : '"' = '"'
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		while (!lexer.isDone && !Char.eq(TokenCommentMulti.DELIM_END, lexer.c0)) {
			if (Char.eq(ETX, lexer.c0)) {
				super(TokenCommentMulti.TAGNAME, buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			buffer.push(lexer.c0)
			lexer.advance()
		}
		// add ending delim to token
		buffer.push(lexer.c0)
		lexer.advance(TokenCommentMulti.DELIM_END.length)
		super(TokenCommentMulti.TAGNAME, buffer[0], ...buffer.slice(1))
	}
}
export class TokenCommentMultiNest extends TokenComment {
	static readonly TAGNAME: string = 'MULTI-NEST'
	static readonly DELIM_START : '"{' = '"{'
	static readonly DELIM_END   : '}"' = '}"'
	constructor (lexer: Lexer) {
		let comment_multiline_level: number /* bigint */ = 0
		const buffer: Char[] = [lexer.c0, lexer.c1 !]
		lexer.advance(TokenCommentMultiNest.DELIM_START.length)
		comment_multiline_level++;
		while (comment_multiline_level !== 0) {
			while (!lexer.isDone && !Char.eq(TokenCommentMultiNest.DELIM_END, lexer.c0, lexer.c1)) {
				if (Char.eq(ETX, lexer.c0)) {
					super(TokenCommentMultiNest.TAGNAME, buffer[0], ...buffer.slice(1))
					throw new LexError02(this)
				}
				if (Char.eq(TokenCommentMultiNest.DELIM_START, lexer.c0, lexer.c1)) {
					buffer.push(lexer.c0, lexer.c1 !)
					lexer.advance(TokenCommentMultiNest.DELIM_START.length)
					comment_multiline_level++;
				} else {
					buffer.push(lexer.c0)
					lexer.advance()
				}
			}
			// add ending delim to token
			buffer.push(lexer.c0, lexer.c1 !)
			lexer.advance(TokenCommentMultiNest.DELIM_END.length)
			comment_multiline_level--;
		}
		super(TokenCommentMultiNest.TAGNAME, buffer[0], ...buffer.slice(1))
	}
}
export class TokenCommentDoc extends TokenComment {
	static readonly TAGNAME: string = 'DOC'
	static readonly DELIM_START : '"""' = '"""'
	static readonly DELIM_END   : '"""' = '"""'
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0, lexer.c1 !, lexer.c2 !, lexer.c3 !]
		lexer.advance((TokenCommentDoc.DELIM_START + '\n').length)
		let source: string = buffer.map((char) => char.source).join('')
		while (!lexer.isDone) {
			if (Char.eq(ETX, lexer.c0)) {
				super(TokenCommentDoc.TAGNAME, buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			if (
				!Char.eq(TokenCommentDoc.DELIM_END + '\n', lexer.c0, lexer.c1, lexer.c2, lexer.c3) ||
				source.slice(source.lastIndexOf('\n') + 1).trim() !== '' // the tail end of the token does not match `/\n(\s)*/` (a newline followed by whitespace)
			) {
				buffer.push(lexer.c0)
				source += lexer.c0.source
				lexer.advance()
			} else {
				break;
			}
		}
		// add ending delim to token
		buffer.push(lexer.c0, lexer.c1 !, lexer.c2 !)
		lexer.advance(TokenCommentDoc.DELIM_END.length)
		super(TokenCommentDoc.TAGNAME, buffer[0], ...buffer.slice(1))
	}
}
export class TokenStringLiteral extends Token {
	static readonly TAGNAME: string = 'STRING-LITERAL'
	static readonly DELIM: '\'' = '\''
	static readonly ESCAPES: readonly string[] = [TokenStringLiteral.DELIM, '\\', 's','t','n','r']
	/**
	 * Compute the string literal value of a `TokenStringLiteral` token
	 * or any segment of such token.
	 * The string literal value is a sequence of Unicode code points.
	 * ```
	 * SVL(StringLiteral ::= "'" "'")
	 * 	is the empty array
	 * SVL(StringLiteral ::= "'" StringLiteralChars "'")
	 * 	is SVL(StringLiteralChars)
	 * SVL(StringLiteralChars ::= [^'\#x03])
	 * 	is {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVL(StringLiteralChars ::= [^'\#x03] StringLiteralChars)
	 * 	is {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVL(StringLiteralChars)
	 * SVL(StringLiteralChars ::= "\" StringLiteralEscape)
	 * 	is SVL(StringLiteralEscape)
	 * SVL(StringLiteralChars ::= "\" StringLiteralEscape StringLiteralChars)
	 * 	is SVL(StringLiteralEscape) followed by SVL(StringLiteralChars)
	 * SVL(StringLiteralChars ::= "\u")
	 * 	is 0x75
	 * SVL(StringLiteralChars ::= "\u" [^'{#x03'])
	 * 	is 0x75 followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVL(StringLiteralChars ::= "\u" [^'{#x03'] StringLiteralChars)
	 * 	is 0x75 followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVL(StringLiteralChars)
	 * SVL(StringLiteralChars ::= "\" #x0D)
	 * 	is 0x0D
	 * SVL(StringLiteralChars ::= "\" #x0D [^'#x0A#x03])
	 * 	is 0x0D followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVL(StringLiteralChars ::= "\" #x0D [^'#x0A#x03] StringLiteralChars)
	 * 	is 0x0D followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVL(StringLiteralChars)
	 * SVL(StringLiteralEscape ::= EscapeChar)
	 * 	is SVL(EscapeChar)
	 * SVL(StringLiteralEscape ::= EscapeCode)
	 * 	is SVL(EscapeCode)
	 * SVL(StringLiteralEscape ::= LineContinuation)
	 * 	is SVL(LineContinuation)
	 * SVL(StringLiteralEscape ::= NonEscapeChar)
	 * 	is SVL(NonEscapeChar)
	 * SVL(EscapeChar ::= "'" | "\" | "s" | "t" | "n" | "r")
	 * 	is given by the following map: {
	 * 		"'" : 0x27, // APOSTROPHE           U+0027
	 * 		"\" : 0x5c, // REVERSE SOLIDUS      U+005C
	 * 		"s" : 0x20, // SPACE                U+0020
	 * 		"t" : 0x09, // CHARACTER TABULATION U+0009
	 * 		"n" : 0x0a, // LINE FEED (LF)       U+000A
	 * 		"r" : 0x0d, // CARRIAGE RETURN (CR) U+000D
	 * 	}
	 * SVL(EscapeCode ::= "u{" "}")
	 * 	is 0x0
	 * SVL(EscapeCode ::= "u{" DigitSequenceHex "}")
	 * 	is {@link Util.utf16Encoding|UTF16Encoding}({@link TokenNumber.mv|MV}(DigitSequenceHex))
	 * SVL(LineContinuation ::= #x0A)
	 * 	is 0x20
	 * SVL(LineContinuation ::= #x0D #x0A)
	 * 	is 0x20
	 * SVL(NonEscapeChar ::= [^'\stnru#x0D#x0A#x03])
	 * 	is {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * ```
	 * @param   text - the string to compute
	 * @returns        the string literal value, a sequence of code points
	 */
	private static svl(text: string): number[] {
		if (text.length === 0) return []
		if ('\\' === text[0]) { // possible escape or line continuation
			if (TokenStringLiteral.ESCAPES.includes(text[1])) { // an escaped character literal
				return [
					new Map<string, number>([
						[TokenStringLiteral.DELIM, TokenStringLiteral.DELIM.codePointAt(0) !],
						['\\' , 0x5c],
						['s'  , 0x20],
						['t'  , 0x09],
						['n'  , 0x0a],
						['r'  , 0x0d],
					]).get(text[1]) !,
					...TokenStringLiteral.svl(text.slice(2)),
				]
			} else if ('u{' === text[1] + text[2]) { // an escape sequence
				const sequence: RegExpMatchArray = text.match(/\\u{[0-9a-f_]*}/) !
				return [
					...Util.utf16Encoding(TokenNumber.mv(sequence[0].slice(3, -1) || '0', 16)),
					...TokenStringLiteral.svl(text.slice(sequence[0].length)),
				]
			} else if ('\n' === text[1]) { // a line continuation (LF)
				return [0x20, ...TokenStringLiteral.svl(text.slice(2))]
			} else if ('\r\n' === text[1] + text[2]) { // a line continuation (CRLF)
				return [0x20, ...TokenStringLiteral.svl(text.slice(2))]
			} else { // a backslash escapes the following character
				return [
					...Util.utf16Encoding(text.codePointAt(1) !),
					...TokenStringLiteral.svl(text.slice(2)),
				]
			}
		} else return [
			...Util.utf16Encoding(text.codePointAt(0) !),
			...TokenStringLiteral.svl(text.slice(1)),
		]
	}
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		while (!lexer.isDone && !Char.eq(TokenStringLiteral.DELIM, lexer.c0)) {
			if (Char.eq(ETX, lexer.c0)) {
				super(TokenStringLiteral.TAGNAME, buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			if (Char.eq('\\', lexer.c0)) { // possible escape or line continuation
				if (Char.inc(TokenStringLiteral.ESCAPES, lexer.c1)) {
					/* an escaped character literal */
					buffer.push(lexer.c0, lexer.c1 !)
					lexer.advance(2)

				} else if (Char.eq('u{', lexer.c1, lexer.c2)) {
					/* an escape sequence */
					const digits: readonly string[] = TokenNumber.DIGITS.get(16) !
					let cargo: string = lexer.c0.source + lexer.c1 !.source + lexer.c2 !.source
					buffer.push(lexer.c0, lexer.c1 !, lexer.c2 !)
					lexer.advance(3)
					if (Char.inc(digits, lexer.c0)) {
						cargo += lexer.c0.source
						buffer.push(lexer.c0)
						lexer.advance()
						while(!lexer.isDone && Char.inc([...digits, TokenNumber.SEPARATOR], lexer.c0)) {
							if (Char.inc(digits, lexer.c0)) {
								cargo += lexer.c0.source
								buffer.push(lexer.c0)
								lexer.advance()
							} else if (Char.eq(TokenNumber.SEPARATOR, lexer.c0)) {
								if (Char.inc(digits, lexer.c1)) {
									cargo += lexer.c0.source + lexer.c1 !.source
									buffer.push(lexer.c0, lexer.c1 !)
									lexer.advance(2)
								} else {
									throw new LexError04(Char.eq(TokenNumber.SEPARATOR, lexer.c1) ? lexer.c1 ! : lexer.c0)
								}
							}
						}
					}
					// add ending escape delim
					if (Char.eq('}', lexer.c0)) {
						buffer.push(lexer.c0)
						lexer.advance()
					} else {
						throw new LexError03(cargo, lexer.c0.line_index, lexer.c0.col_index)
					}

				} else if (Char.eq('\n', lexer.c1)) {
					/* a line continuation (LF) */
					buffer.push(lexer.c0, lexer.c1 !)
					lexer.advance(2)

				} else {
					/* a backslash escapes the following character */
					buffer.push(lexer.c0)
					lexer.advance()
				}
			} else {
				buffer.push(lexer.c0)
				lexer.advance()
			}
		}
		// add ending delim to token
		buffer.push(lexer.c0)
		lexer.advance(TokenStringLiteral.DELIM.length)
		super(TokenStringLiteral.TAGNAME, buffer[0], ...buffer.slice(1))
	}
	cook(_trans: Translator): string {
		return String.fromCodePoint(...TokenStringLiteral.svl(
			this.source.slice(1, -1) // cut off the string delimiters
		))
	}
}
export class TokenStringTemplate extends Token {
	static readonly TAGNAME: string = 'STRING-TEMPLATE'
	static readonly DELIM              : '`'  = '`'
	static readonly DELIM_INTERP_START : '{{' = '{{'
	static readonly DELIM_INTERP_END   : '}}' = '}}'
	/**
	 * Compute the string template value of a `TokenStringTemplate` token
	 * or any segment of such token.
	 * The string template value is a sequence of Unicode code points.
	 * ```
	 * SVT(StringTemplateFull ::= "`" "`")
	 * 	is the empty array
	 * SVT(StringTemplateFull ::= "`" StringTemplateCharsEndDelim "`")
	 * 	is SVT(StringTemplateCharsEndDelim)
	 * SVT(StringTemplateHead ::= "`" "{{")
	 * 	is the empty array
	 * SVT(StringTemplateHead ::= "`" StringTemplateCharsEndInterp "{{")
	 * 	is SVT(StringTemplateCharsEndInterp)
	 * SVT(StringTempalteMiddle ::= "}}" "{{")
	 * 	is the empty array
	 * SVT(StringTempalteMiddle ::= "}}" StringTemplateCharsEndInterp "{{")
	 * 	is SVT(StringTemplateCharsEndInterp)
	 * SVT(StringTempalteTail ::= "}}" "`")
	 * 	is the empty array
	 * SVT(StringTempalteTail ::= "}}" StringTemplateCharsEndDelim "`")
	 * 	is SVT(StringTemplateCharsEndDelim)
	 * SVT(StringTemplateCharsEndDelim ::= [^`{\#x03])
	 * 	is {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVT(StringTemplateCharsEndDelim ::= [^`{\#x03] StringTemplateCharsEndDelim)
	 * 	is {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVT(StringTemplateCharsEndDelim)
	 * SVT(StringTemplateCharsEndDelim ::= "{"
	 * 	is 0x7b
	 * SVT(StringTemplateCharsEndDelim ::= "{" [^`{\#x03])
	 * 	is 0x7b followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVT(StringTemplateCharsEndDelim ::= "{" [^`{\#x03] StringTemplateCharsEndDelim)
	 * 	is 0x7b followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVT(StringTemplateCharsEndDelim)
	 * SVT(StringTemplateCharsEndDelim ::= "{" "\" [^`#x03])
	 * 	is 0x7b followed by 0x5c followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVT(StringTemplateCharsEndDelim ::= "{" "\" [^`#x03] StringTemplateCharsEndDelim)
	 * 	is 0x7b followed by 0x5c followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVT(StringTemplateCharsEndDelim)
	 * SVT(StringTemplateCharsEndDelim ::= "{" "\" "`")
	 * 	is 0x7b followed by 0x60
	 * SVT(StringTemplateCharsEndDelim ::= "{" "\" "`" StringTemplateCharsEndDelim)
	 * 	is 0x7b followed by 0x60 followed by SVT(StringTemplateCharsEndDelim)
	 * SVT(StringTemplateCharsEndDelim ::= "\" [^`#x03])
	 * 	is 0x5c followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVT(StringTemplateCharsEndDelim ::= "\" [^`#x03] StringTemplateCharsEndDelim)
	 * 	is 0x5c followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVT(StringTemplateCharsEndDelim)
	 * SVT(StringTemplateCharsEndDelim ::= "\" "`")
	 * 	is 0x60
	 * SVT(StringTemplateCharsEndDelim ::= "\" "`" StringTemplateCharsEndDelim)
	 * 	is 0x60 followed by SVT(StringTemplateCharsEndDelim)
	 * SVT(StringTemplateCharsEndInterp ::= [^`{\#x03])
	 * 	is {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVT(StringTemplateCharsEndInterp ::= [^`{\#x03] StringTemplateCharsEndInterp)
	 * 	is {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVT(StringTemplateCharsEndInterp)
	 * SVT(StringTemplateCharsEndInterp ::= "{" [^`{\#x03])
	 * 	is 0x7b followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVT(StringTemplateCharsEndInterp ::= "{" [^`{\#x03] StringTemplateCharsEndInterp)
	 * 	is 0x7b followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVT(StringTemplateCharsEndInterp)
	 * SVT(StringTemplateCharsEndInterp ::= "{" "\" [^`#x03])
	 * 	is 0x7b followed by 0x5c followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVT(StringTemplateCharsEndInterp ::= "{" "\" [^`#x03] StringTemplateCharsEndInterp)
	 * 	is 0x7b followed by 0x5c followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVT(StringTemplateCharsEndInterp)
	 * SVT(StringTemplateCharsEndInterp ::= "{" "\" "`")
	 * 	is 0x7b followed by 0x60
	 * SVT(StringTemplateCharsEndInterp ::= "{" "\" "`" StringTemplateCharsEndInterp)
	 * 	is 0x7b followed by 0x60 followed by SVT(StringTemplateCharsEndInterp)
	 * SVT(StringTemplateCharsEndInterp ::= "\")
	 * 	is 0x5c
	 * SVT(StringTemplateCharsEndInterp ::= "\" [^`#x03])
	 * 	is 0x5c followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character)
	 * SVT(StringTemplateCharsEndInterp ::= "\" [^`#x03] StringTemplateCharsEndInterp)
	 * 	is 0x5c followed by {@link Util.utf16Encoding|UTF16Encoding}(code point of that character) followed by SVT(StringTemplateCharsEndInterp)
	 * SVT(StringTemplateCharsEndInterp ::= "\" "`")
	 * 	is 0x60
	 * SVT(StringTemplateCharsEndInterp ::= "\" "`" StringTemplateCharsEndInterp)
	 * 	is 0x60 followed by SVT(StringTemplateCharsEndInterp)
	 * ```
	 * @param   text - the string to compute
	 * @returns        the string template value of the string, a sequence of code points
	 */
	private static svt(text: string): number[] {
		if (text.length === 0) return []
		if ('\\' + TokenStringTemplate.DELIM === text[0] + text[1]) { // an escaped template delimiter
			return [
				TokenStringTemplate.DELIM.codePointAt(0) !,
				...TokenStringTemplate.svt(text.slice(2)),
			]
		} else return [
			...Util.utf16Encoding(text.codePointAt(0) !),
			...TokenStringTemplate.svt(text.slice(1)),
		]
	}
	private readonly delim_end  : number;
	private readonly delim_start: number;
	constructor (lexer: Lexer, delim_start: number) {
		let delim_end: number;
		const positions: Set<TemplatePosition> = new Set<TemplatePosition>()
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		if (delim_start === TokenStringTemplate.DELIM.length) {
			positions.add(TemplatePosition.FULL).add(TemplatePosition.HEAD)
		} else if (delim_start === TokenStringTemplate.DELIM_INTERP_END.length) {
			positions.add(TemplatePosition.MIDDLE).add(TemplatePosition.TAIL)
			buffer.push(lexer.c0 !)
			lexer.advance()
		}
		while (!lexer.isDone) {
			if (Char.eq(ETX, lexer.c0)) {
				super(TokenStringTemplate.TAGNAME, buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			if (Char.eq('\\' + TokenStringTemplate.DELIM, lexer.c0, lexer.c1)) {
				/* an escaped template delimiter */
				buffer.push(lexer.c0, lexer.c1 !)
				lexer.advance(2)

			} else if (Char.eq(TokenStringTemplate.DELIM, lexer.c0)) {
				/* end string template full/tail */
				delim_end = TokenStringTemplate.DELIM.length
				positions.delete(TemplatePosition.HEAD)
				positions.delete(TemplatePosition.MIDDLE)
				// add ending delim to token
				buffer.push(lexer.c0)
				lexer.advance(TokenStringTemplate.DELIM.length)
				break;

			} else if (Char.eq(TokenStringTemplate.DELIM_INTERP_START, lexer.c0, lexer.c1)) {
				/* end string template head/middle */
				delim_end = TokenStringTemplate.DELIM_INTERP_START.length
				positions.delete(TemplatePosition.FULL)
				positions.delete(TemplatePosition.TAIL)
				// add start interpolation delim to token
				buffer.push(lexer.c0, lexer.c1 !)
				lexer.advance(TokenStringTemplate.DELIM_INTERP_START.length)
				break;

			} else {
				buffer.push(lexer.c0)
				lexer.advance()
			}
		}
		super(`${TokenStringTemplate.TAGNAME}-${TemplatePosition[[...positions][0]]}`, buffer[0], ...buffer.slice(1))
		this.delim_start = delim_start
		this.delim_end   = delim_end !
	}
	cook(_trans: Translator): string {
		return String.fromCodePoint(...TokenStringTemplate.svt(
			this.source.slice(this.delim_start, -this.delim_end) // cut off the string delimiters
		))
	}
}
export class TokenNumber extends Token {
	static readonly TAGNAME: string = 'NUMBER'
	static readonly RADIX_DEFAULT: number = 10
	static readonly SEPARATOR: string = '_'
	static readonly BASES: ReadonlyMap<string, number> = new Map<string, number>([
		['b',  2],
		['q',  4],
		['o',  8],
		['d', 10],
		['x', 16],
		['z', 36],
	])
	static readonly DIGITS: ReadonlyMap<number, readonly string[]> = new Map<number, readonly string[]>([
		[ 2, '0 1'                                                                     .split(' ')],
		[ 4, '0 1 2 3'                                                                 .split(' ')],
		[ 8, '0 1 2 3 4 5 6 7'                                                         .split(' ')],
		[10, '0 1 2 3 4 5 6 7 8 9'                                                     .split(' ')],
		[16, '0 1 2 3 4 5 6 7 8 9 a b c d e f'                                         .split(' ')],
		[36, '0 1 2 3 4 5 6 7 8 9 a b c d e f g h i j k l m n o p q r s t u v w x y z' .split(' ')],
	])
	/**
	 * Compute the mathematical value of a `TokenNumber` token.
	 * ```
	 * MV(DigitSequenceBin ::= [0-1])
	 * 	is MV([0-1])
	 * MV(DigitSequenceBin ::= DigitSequenceBin "_"? [0-1])
	 * 	is 2 * MV(DigitSequenceBin) + MV([0-1])
	 *
	 * MV(DigitSequenceQua ::= [0-3])
	 * 	is MV([0-3])
	 * MV(DigitSequenceQua ::= DigitSequenceQua "_"? [0-3])
	 * 	is 4 * MV(DigitSequenceQua) + MV([0-3])
	 *
	 * MV(DigitSequenceOct ::= [0-7])
	 * 	is MV([0-7])
	 * MV(DigitSequenceOct ::= DigitSequenceOct "_"? [0-7])
	 * 	is 8 * MV(DigitSequenceOct) + MV([0-7])
	 *
	 * MV(DigitSequenceDec ::= [0-9])
	 * 	is MV([0-9])
	 * MV(DigitSequenceDec ::= DigitSequenceDec "_"? [0-9])
	 * 	is 10 * MV(DigitSequenceDec) + MV([0-9])
	 *
	 * MV(DigitSequenceHex ::= [0-9a-f])
	 * 	is MV([0-9a-f])
	 * MV(DigitSequenceHex ::= DigitSequenceHex "_"? [0-9a-f])
	 * 	is 16 * MV(DigitSequenceHex) + MV([0-9a-f])
	 *
	 * MV(DigitSequenceHTD ::= [0-9a-z])
	 * 	is MV([0-9a-z])
	 * MV(DigitSequenceHTD ::= DigitSequenceHTD "_"? [0-9a-z])
	 * 	is 36 * MV(DigitSequenceHTD) + MV([0-9a-z])
	 *
	 * MV([0-9a-z] ::= "0") is MV([0-9a-f] ::= "0") is MV([0-9] ::= "0") is MV([0-7] ::= "0") is MV([0-3] ::= "0") is MV([0-1] ::= "0") is 0
	 * MV([0-9a-z] ::= "1") is MV([0-9a-f] ::= "1") is MV([0-9] ::= "1") is MV([0-7] ::= "1") is MV([0-3] ::= "1") is MV([0-1] ::= "1") is 1
	 * MV([0-9a-z] ::= "2") is MV([0-9a-f] ::= "2") is MV([0-9] ::= "2") is MV([0-7] ::= "2") is MV([0-3] ::= "2") is 2
	 * MV([0-9a-z] ::= "3") is MV([0-9a-f] ::= "3") is MV([0-9] ::= "3") is MV([0-7] ::= "3") is MV([0-3] ::= "3") is 3
	 * MV([0-9a-z] ::= "4") is MV([0-9a-f] ::= "4") is MV([0-9] ::= "4") is MV([0-7] ::= "4") is 4
	 * MV([0-9a-z] ::= "5") is MV([0-9a-f] ::= "5") is MV([0-9] ::= "5") is MV([0-7] ::= "5") is 5
	 * MV([0-9a-z] ::= "6") is MV([0-9a-f] ::= "6") is MV([0-9] ::= "6") is MV([0-7] ::= "6") is 6
	 * MV([0-9a-z] ::= "7") is MV([0-9a-f] ::= "7") is MV([0-9] ::= "7") is MV([0-7] ::= "7") is 7
	 * MV([0-9a-z] ::= "8") is MV([0-9a-f] ::= "8") is MV([0-9] ::= "8") is 8
	 * MV([0-9a-z] ::= "9") is MV([0-9a-f] ::= "9") is MV([0-9] ::= "9") is 9
	 * MV([0-9a-z] ::= "a") is MV([0-9a-f] ::= "a") is 10
	 * MV([0-9a-z] ::= "b") is MV([0-9a-f] ::= "b") is 11
	 * MV([0-9a-z] ::= "c") is MV([0-9a-f] ::= "c") is 12
	 * MV([0-9a-z] ::= "d") is MV([0-9a-f] ::= "d") is 13
	 * MV([0-9a-z] ::= "e") is MV([0-9a-f] ::= "e") is 14
	 * MV([0-9a-z] ::= "f") is MV([0-9a-f] ::= "f") is 15
	 * MV([0-9a-z] ::= "g") is 16
	 * MV([0-9a-z] ::= "h") is 17
	 * MV([0-9a-z] ::= "i") is 18
	 * MV([0-9a-z] ::= "j") is 19
	 * MV([0-9a-z] ::= "k") is 20
	 * MV([0-9a-z] ::= "l") is 21
	 * MV([0-9a-z] ::= "m") is 22
	 * MV([0-9a-z] ::= "n") is 23
	 * MV([0-9a-z] ::= "o") is 24
	 * MV([0-9a-z] ::= "p") is 25
	 * MV([0-9a-z] ::= "q") is 26
	 * MV([0-9a-z] ::= "r") is 27
	 * MV([0-9a-z] ::= "s") is 28
	 * MV([0-9a-z] ::= "t") is 29
	 * MV([0-9a-z] ::= "u") is 30
	 * MV([0-9a-z] ::= "v") is 31
	 * MV([0-9a-z] ::= "w") is 32
	 * MV([0-9a-z] ::= "x") is 33
	 * MV([0-9a-z] ::= "y") is 34
	 * MV([0-9a-z] ::= "z") is 35
	 * ```
	 * @param   text  - the string to compute
	 * @param   radix - the base in which to compute
	 * @returns         the mathematical value of the string in the given base
	 */
	static mv(text: string, radix = 10): number {
		if (text[text.length-1] === TokenNumber.SEPARATOR) {
			text = text.slice(0, -1)
		}
		if (text.length === 0) throw new Error('Cannot compute mathematical value of empty string.')
		if (text.length === 1) {
			const digitvalue: number = parseInt(text, radix)
			if (Number.isNaN(digitvalue)) throw new Error('Invalid number format.')
			return digitvalue
		}
		return radix * TokenNumber.mv(text.slice(0, -1), radix) + TokenNumber.mv(text[text.length-1], radix)
	}
	private readonly radix: number;
	constructor (lexer: Lexer, radix: number|null = null) {
		const r: number = radix || TokenNumber.RADIX_DEFAULT // do not use RADIX_DEFAULT as the default parameter because of the if-else below
		const digits: readonly string[] = TokenNumber.DIGITS.get(r) !
		const buffer: Char[] = []
		if (typeof radix === 'number') { // an explicit base
			if (!Char.inc(digits, lexer.c2)) {
				throw new LexError03(lexer.c0.source + lexer.c1 !.source, lexer.c0.line_index, lexer.c0.col_index)
			}
			buffer.push(lexer.c0, lexer.c1 !, lexer.c2 !)
			lexer.advance(3)
		} else { // implicit default base
			buffer.push(lexer.c0)
			lexer.advance()
		}
		while (!lexer.isDone && Char.inc([...digits, TokenNumber.SEPARATOR], lexer.c0)) {
			if (Char.inc(digits, lexer.c0)) {
				buffer.push(lexer.c0)
				lexer.advance()
			} else if (Char.eq(TokenNumber.SEPARATOR, lexer.c0)) {
				if (Char.inc(digits, lexer.c1)) {
					buffer.push(lexer.c0, lexer.c1 !)
					lexer.advance(2)
				} else {
					throw new LexError04(Char.eq(TokenNumber.SEPARATOR, lexer.c1) ? lexer.c1 ! : lexer.c0)
				}
			}
		}
		super(TokenNumber.TAGNAME, buffer[0], ...buffer.slice(1))
		this.radix = r
	}
	cook(_trans: Translator): number {
		return TokenNumber.mv(this.source[0] === '\\' ? this.source.slice(2) : this.source, this.radix)
	}
}
export class TokenWord extends Token {
	static readonly TAGNAME: string = 'WORD'
	private static readonly IDENTIFIER_TAG: string = 'IDENTIFIER'
	static readonly CHAR_START: RegExp = /^[A-Za-z_]$/
	static readonly CHAR_REST : RegExp = /^[A-Za-z0-9_]$/
	static readonly KEYWORDS: ReadonlyMap<KeywordKind, readonly string[]> = new Map<KeywordKind, readonly string[]>(([
		[KeywordKind.STORAGE, [
			'let',
		]],
		[KeywordKind.MODIFIER, [
			'unfixed',
		]],
	]))
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		while (!lexer.isDone && TokenWord.CHAR_REST.test(lexer.c0.source)) {
			buffer.push(lexer.c0)
			lexer.advance()
		}
		const source: string = buffer.map((char) => char.source).join('')
		let kind = TokenWord.IDENTIFIER_TAG
		TokenWord.KEYWORDS.forEach((value, key) => {
			if (kind === TokenWord.IDENTIFIER_TAG && value.includes(source)) {
				kind = KeywordKind[key]
			}
		})
		super(`${TokenWord.TAGNAME}-${kind}`, buffer[0], ...buffer.slice(1))
	}
	get isIdentifier(): boolean {
		return this.tagname === `${TokenWord.TAGNAME}-${TokenWord.IDENTIFIER_TAG}`
	}
	cook(trans: Translator): number /* bigint */ | string {
		return (this.isIdentifier) ? trans.identifiers.indexOf(this.source) : this.source
	}
}
export class TokenPunctuator extends Token {
	static readonly TAGNAME: string = 'PUNCTUATOR'
	static readonly CHARS_1: readonly string[] = '; = + - * / ^ ( )'.split(' ')
	static readonly CHARS_2: readonly string[] = ''.split(' ')
	static readonly CHARS_3: readonly string[] = ''.split(' ')
	constructor (lexer: Lexer, count: 1|2|3 = 1) {
		const buffer: Char[] = [lexer.c0]
		if (count >= 3) {
			buffer.push(lexer.c1 !, lexer.c2 !)
		} else if (count >= 2) {
			buffer.push(lexer.c1 !)
		}
		lexer.advance(count)
		super(TokenPunctuator.TAGNAME, buffer[0], ...buffer.slice(1))
	}
	cook(_trans: Translator): string {
		return this.source
	}
}
