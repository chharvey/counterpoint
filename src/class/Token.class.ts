import Serializable from '../iface/Serializable.iface'
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
	 * @returns the computed value of this token, or `null`
	 */
	abstract get cooked(): string|number|boolean|null;

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const cooked: string|number|boolean|null = this.cooked; // getter is called only once
		const attributes: string = ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
			(cooked !== null) ? `value="${(typeof cooked === 'string') ? cooked
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
	get cooked(): boolean {
		return this.source === STX /* || !this.source === ETX */
	}
	serialize(): string {
		const formatted: string = new Map<string, string>([
			[STX, '\u2402' /* SYMBOL FOR START OF TEXT */],
			[ETX, '\u2403' /* SYMBOL FOR END OF TEXT   */],
		]).get(this.source) !
		return `<${this.tagname}>${formatted}</${this.tagname}>`
	}
}
export class TokenWhitespace extends Token {
	static readonly TAGNAME: string = 'WHITESPACE'
	static readonly CHARS: readonly string[] = [' ', '\t', '\n', '\r']
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		while (!lexer.isDone && Char.inc(TokenWhitespace.CHARS, lexer.c0)) {
			buffer.push(lexer.c0)
			lexer.advance()
		}
		super(TokenWhitespace.TAGNAME, buffer[0], ...buffer.slice(1))
	}
	get cooked(): null {
		return null // we do not want to send whitespace to the parser
	}
}
export abstract class TokenComment extends Token {
	static readonly TAGNAME: string = 'COMMENT'
	constructor (kind: string, start_char: Char, ...more_chars: Char[]) {
		super(`${TokenComment.TAGNAME}-${kind}`, start_char, ...more_chars)
	}
	/** @final */ get cooked(): null {
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

				} else if (Char.eq('\r\n', lexer.c1, lexer.c2)) {
					/* a line continuation (CRLF) */
					buffer.push(lexer.c0, lexer.c1 !, lexer.c2 !)
					lexer.advance(3)

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
	get cooked(): string {
		return String.fromCodePoint(...Translator.svl(
			this.source.slice(1, -1) // cut off the string delimiters
		))
	}
}
export class TokenStringTemplate extends Token {
	static readonly TAGNAME: string = 'STRING-TEMPLATE'
	static readonly DELIM              : '`'  = '`'
	static readonly DELIM_INTERP_START : '{{' = '{{'
	static readonly DELIM_INTERP_END   : '}}' = '}}'
	private readonly delim_end  : number;
	private readonly delim_start: number;
	constructor (lexer: Lexer, delim_start: number) {
		let delim_end: number;
		const positions: Set<TemplatePosition> = new Set<TemplatePosition>()
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		if (delim_start === TokenStringTemplate.DELIM.length) {
			positions.add(TemplatePosition.FULL).add(TemplatePosition.HEAD)
		} else if (delim_start === TokenStringTemplate.DELIM_INTERP_START.length) {
			positions.add(TemplatePosition.MIDDLE).add(TemplatePosition.TAIL)
			buffer.push(lexer.c1 !)
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
	get cooked(): string {
		return String.fromCodePoint(...Translator.svt(
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
	get cooked(): number {
		return Translator.mv(this.source[0] === '\\' ? this.source.slice(2) : this.source, this.radix)
	}
}
export class TokenWord extends Token {
	static readonly TAGNAME: string = 'WORD'
	static readonly CHAR_START: RegExp = /^[A-Za-z_]$/
	static readonly CHAR_REST : RegExp = /^[A-Za-z0-9_]$/
	private readonly id: number /* bigint */
	constructor (lexer: Lexer, id: number /* bigint */) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		while (!lexer.isDone && TokenWord.CHAR_REST.test(lexer.c0.source)) {
			buffer.push(lexer.c0)
			lexer.advance()
		}
		super(TokenWord.TAGNAME, buffer[0], ...buffer.slice(1))
		this.id = id
	}
	get cooked(): number /* bigint */ {
		return this.id
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
	get cooked(): string {
		return this.source
	}
}
