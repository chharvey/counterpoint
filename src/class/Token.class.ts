import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import Char, {STX, ETX} from './Char.class'
import type Lexer from './Lexer.class'
import type Screener from './Screener.class'

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
	/** The index of the first character in source text. */
	readonly source_index: number;
	/** Zero-based line number of the first character (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first character (first col is col 0). */
	readonly col_index: number;

	/**
	 * Construct a new Token object.
	 * @param tagname    - The name of the type of this Token.
	 * @param start_char - the starting character of this Token
	 * @param more_chars - additional characters to add upon construction
	 */
	constructor(readonly tagname: string, start_char: Char, ...more_chars: Char[]) {
		this._cargo       = [start_char, ...more_chars].map((char) => char.source).join('')
		this.source_index = start_char.source_index
		this.line_index   = start_char.line_index
		this.col_index    = start_char.col_index
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
	 * @returns              the computed value of this token, or `null`
	 */
	abstract cook(): string|number|boolean|null;

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const cooked: string|number|boolean|null = this.cook()
		const attributes: Map<string, string|number|boolean|null> = new Map<string, string|number|boolean|null>()
		if (!(this instanceof TokenFilebound)) {
			attributes.set('line', this.line_index + 1)
			attributes.set('col' , this.col_index  + 1)
		}
		if (cooked !== null) {
			attributes.set('value', (typeof cooked === 'string') ? cooked
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
			: cooked.toString())
		}
		const contents: string = this.source
			.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
			.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
		return `<${this.tagname} ${Util.stringifyAttributes(attributes)}>${contents}</${this.tagname}>`
	}
}



export class TokenFilebound extends Token {
	static readonly CHARS: readonly string[] = [STX, ETX]
	constructor (lexer: Lexer) {
		super('FILEBOUND', lexer.c0)
		lexer.advance()
	}
	cook(): boolean {
		return this.source === STX /* || !this.source === ETX */
	}
}
export class TokenWhitespace extends Token {
	static readonly CHARS: readonly string[] = [' ', '\t', '\n']
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		while (!lexer.isDone && Char.inc(TokenWhitespace.CHARS, lexer.c0)) {
			buffer.push(lexer.c0)
			lexer.advance()
		}
		super('WHITESPACE', buffer[0], ...buffer.slice(1))
	}
	cook(): null {
		return null // we do not want to send whitespace to the parser
	}
}
export abstract class TokenComment extends Token {
	constructor (start_char: Char, ...more_chars: Char[]) {
		super('COMMENT', start_char, ...more_chars)
	}
	/** @final */ cook(): null {
		return null // we do not want to send comments to the parser
	}
}
export class TokenCommentLine extends TokenComment {
	static readonly DELIM: '%' = '%'
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance(TokenCommentLine.DELIM.length)
		while (!lexer.isDone && !Char.eq('\n', lexer.c0)) {
			if (Char.eq(ETX, lexer.c0)) {
				super(buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			buffer.push(lexer.c0)
			lexer.advance()
		}
		// add '\n' to token
		buffer.push(lexer.c0)
		lexer.advance()
		super(buffer[0], ...buffer.slice(1))
	}
}
export class TokenCommentMulti extends TokenComment {
	static readonly DELIM_START : '{%' = '{%'
	static readonly DELIM_END   : '%}' = '%}'
	constructor (lexer: Lexer) {
		let comment_multiline_level: number /* bigint */ = 0
		const buffer: Char[] = [lexer.c0, lexer.c1 !]
		lexer.advance(TokenCommentMulti.DELIM_START.length)
		comment_multiline_level++;
		while (comment_multiline_level !== 0) {
			while (!lexer.isDone && !Char.eq(TokenCommentMulti.DELIM_END, lexer.c0, lexer.c1)) {
				if (Char.eq(ETX, lexer.c0)) {
					super(buffer[0], ...buffer.slice(1))
					throw new LexError02(this)
				}
				if (Char.eq(TokenCommentMulti.DELIM_START, lexer.c0, lexer.c1)) {
					buffer.push(lexer.c0, lexer.c1 !)
					lexer.advance(TokenCommentMulti.DELIM_START.length)
					comment_multiline_level++;
				} else {
					buffer.push(lexer.c0)
					lexer.advance()
				}
			}
			// add ending delim to token
			buffer.push(lexer.c0, lexer.c1 !)
			lexer.advance(TokenCommentMulti.DELIM_END.length)
			comment_multiline_level--;
		}
		super(buffer[0], ...buffer.slice(1))
	}
}
export class TokenCommentBlock extends TokenComment {
	static readonly DELIM_START : '%%%' = '%%%'
	static readonly DELIM_END   : '%%%' = '%%%'
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0, lexer.c1 !, lexer.c2 !, lexer.c3 !]
		lexer.advance((`${TokenCommentBlock.DELIM_START}\n`).length)
		let source: string = buffer.map((char) => char.source).join('')
		while (!lexer.isDone) {
			if (Char.eq(ETX, lexer.c0)) {
				super(buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			if (
				!Char.eq(`${TokenCommentBlock.DELIM_END}\n`, lexer.c0, lexer.c1, lexer.c2, lexer.c3) ||
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
		lexer.advance(TokenCommentBlock.DELIM_END.length)
		super(buffer[0], ...buffer.slice(1))
	}
}
export class TokenString extends Token {
	static readonly DELIM: '\'' = '\''
	static readonly ESCAPES: readonly string[] = [TokenString.DELIM, '\\', 's','t','n','r']
	/**
	 * Compute the string value of a `TokenString` token
	 * or any segment of such token.
	 * @param   text - the string to compute
	 * @returns        the string value of the argument, a sequence of Unicode code points
	 */
	private static sv(text: string): number[] {
		if (text.length === 0) return []
		if ('\\' === text[0]) { // possible escape or line continuation
			if (TokenString.ESCAPES.includes(text[1])) {
				/* an escaped character literal */
				return [
					new Map<string, number>([
						[TokenString.DELIM, TokenString.DELIM.codePointAt(0) !],
						['\\' , 0x5c],
						['s'  , 0x20],
						['t'  , 0x09],
						['n'  , 0x0a],
						['r'  , 0x0d],
					]).get(text[1]) !,
					...TokenString.sv(text.slice(2)),
				]

			} else if ('u{' === `${text[1]}${text[2]}`) {
				/* an escape sequence */
				const sequence: RegExpMatchArray = text.match(/\\u{[0-9a-f_]*}/) !
				return [
					...Util.utf16Encoding(TokenNumber.mv(sequence[0].slice(3, -1) || '0', 16)),
					...TokenString.sv(text.slice(sequence[0].length)),
				]

			} else if ('\n' === text[1]) {
				/* a line continuation (LF) */
				return [0x20, ...TokenString.sv(text.slice(2))]

			} else {
				/* a backslash escapes the following character */
				return [
					...Util.utf16Encoding(text.codePointAt(1) !),
					...TokenString.sv(text.slice(2)),
				]
			}
		} else return [
			...Util.utf16Encoding(text.codePointAt(0) !),
			...TokenString.sv(text.slice(1)),
		]
	}
	constructor (lexer: Lexer) {
		const buffer: Char[] = [lexer.c0]
		lexer.advance()
		while (!lexer.isDone && !Char.eq(TokenString.DELIM, lexer.c0)) {
			if (Char.eq(ETX, lexer.c0)) {
				super('STRING', buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			if (Char.eq('\\', lexer.c0)) { // possible escape or line continuation
				if (Char.inc(TokenString.ESCAPES, lexer.c1)) {
					/* an escaped character literal */
					buffer.push(lexer.c0, lexer.c1 !)
					lexer.advance(2)

				} else if (Char.eq('u{', lexer.c1, lexer.c2)) {
					/* an escape sequence */
					const digits: readonly string[] = TokenNumber.DIGITS.get(16) !
					let cargo: string = `${lexer.c0.source}${lexer.c1 !.source}${lexer.c2 !.source}`
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
									cargo += `${lexer.c0.source}${lexer.c1 !.source}`
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
		lexer.advance(TokenString.DELIM.length)
		super('STRING', buffer[0], ...buffer.slice(1))
	}
	cook(): string {
		return String.fromCodePoint(...TokenString.sv(
			this.source.slice(1, -1) // cut off the string delimiters
		))
	}
}
export class TokenTemplate extends Token {
	static readonly DELIM              : '\'\'\'' = '\'\'\''
	static readonly DELIM_INTERP_START : '{{' = '{{'
	static readonly DELIM_INTERP_END   : '}}' = '}}'
	/**
	 * Compute the template value of a `TokenTemplate` token
	 * or any segment of such token.
	 * @param   text - the string to compute
	 * @returns        the template value of the argument, a sequence of Unicode code points
	 */
	private static tv(text: string): number[] {
		if (text.length === 0) return []
		return [
			...Util.utf16Encoding(text.codePointAt(0) !),
			...TokenTemplate.tv(text.slice(1)),
		]
	}
	private readonly delim_start: typeof TokenTemplate.DELIM | typeof TokenTemplate.DELIM_INTERP_END  ;
	private readonly delim_end  : typeof TokenTemplate.DELIM | typeof TokenTemplate.DELIM_INTERP_START;
	readonly position: TemplatePosition;
	constructor (lexer: Lexer, delim_start: typeof TokenTemplate.DELIM | typeof TokenTemplate.DELIM_INTERP_END) {
		let delim_end: typeof TokenTemplate.DELIM | typeof TokenTemplate.DELIM_INTERP_START;
		const positions: Set<TemplatePosition> = new Set<TemplatePosition>()
		const buffer: Char[] = []
		if (delim_start === TokenTemplate.DELIM) {
			positions.add(TemplatePosition.FULL).add(TemplatePosition.HEAD)
			buffer.push(lexer.c0, lexer.c1 !, lexer.c2 !)
			lexer.advance(TokenTemplate.DELIM.length)
		} else { // delim_start === TokenTemplate.DELIM_INTERP_END
			positions.add(TemplatePosition.MIDDLE).add(TemplatePosition.TAIL)
			buffer.push(lexer.c0, lexer.c1 !)
			lexer.advance(TokenTemplate.DELIM_INTERP_END.length)
		}
		while (!lexer.isDone) {
			if (Char.eq(ETX, lexer.c0)) {
				super('TEMPLATE', buffer[0], ...buffer.slice(1))
				throw new LexError02(this)
			}
			if (Char.eq(TokenTemplate.DELIM, lexer.c0, lexer.c1, lexer.c2)) {
				/* end string template full/tail */
				delim_end = TokenTemplate.DELIM
				positions.delete(TemplatePosition.HEAD)
				positions.delete(TemplatePosition.MIDDLE)
				// add ending delim to token
				buffer.push(lexer.c0, lexer.c1 !, lexer.c2 !)
				lexer.advance(TokenTemplate.DELIM.length)
				break;

			} else if (Char.eq(TokenTemplate.DELIM_INTERP_START, lexer.c0, lexer.c1)) {
				/* end string template head/middle */
				delim_end = TokenTemplate.DELIM_INTERP_START
				positions.delete(TemplatePosition.FULL)
				positions.delete(TemplatePosition.TAIL)
				// add start interpolation delim to token
				buffer.push(lexer.c0, lexer.c1 !)
				lexer.advance(TokenTemplate.DELIM_INTERP_START.length)
				break;

			} else {
				buffer.push(lexer.c0)
				lexer.advance()
			}
		}
		super('TEMPLATE', buffer[0], ...buffer.slice(1))
		this.delim_start = delim_start
		this.delim_end   = delim_end !
		this.position = [...positions][0]
	}
	cook(): string {
		return String.fromCodePoint(...TokenTemplate.tv(
			this.source.slice(this.delim_start.length, -this.delim_end.length) // cut off the template delimiters
		))
	}
}
export class TokenNumber extends Token {
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
	static readonly PREFIXES: readonly string[] = '+ -'.split(' ')
	/**
	 * Compute the mathematical value of a `TokenNumber` token.
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
			if (Number.isNaN(digitvalue)) throw new Error(`Invalid number format: \`${text}\``)
			return digitvalue
		}
		return radix * TokenNumber.mv(text.slice(0, -1), radix) + TokenNumber.mv(text[text.length-1], radix)
	}
	private readonly radix: number;
	constructor (lexer: Lexer, has_prefix: boolean, radix: number|null = null) {
		const r: number = radix || TokenNumber.RADIX_DEFAULT // do not use RADIX_DEFAULT as the default parameter because of the if-else below
		const digits: readonly string[] = TokenNumber.DIGITS.get(r) !
		const buffer: Char[] = []
		if (has_prefix) { // prefixed with leading "+" or "-"
			buffer.push(lexer.c0)
			lexer.advance()
		}
		if (typeof radix === 'number') { // an explicit base
			if (!Char.inc(digits, lexer.c2)) {
				throw new LexError03(`${lexer.c0.source}${lexer.c1 !.source}`, lexer.c0.line_index, lexer.c0.col_index)
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
		super('NUMBER', buffer[0], ...buffer.slice(1))
		this.radix = r
	}
	cook(): number {
		let text = this.source
		const multiplier = new Map<string, number>([
			['+',  1],
			['-', -1],
		]).get(text[0]) || null
		if (multiplier !== null) text = text.slice(1) // cut off prefix, if any
		if (text[0]    === '\\') text = text.slice(2) // cut off radix , if any
		return (multiplier || 1) * TokenNumber.mv(text, this.radix)
	}
}
export class TokenWord extends Token {
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
	/** Is this Token an identifier? */
	readonly is_identifier: boolean;
	/**
	 * The cooked value of this Token.
	 * If the token is a keyword, the cooked value is its contents.
	 * If the token is an identifier, the cooked value is set by a {@link Screener},
	 * which indexes unique identifier tokens.
	 */
	private _cooked: number/* bigint */|string;
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
		super('WORD', buffer[0], ...buffer.slice(1))
		this.is_identifier = kind === TokenWord.IDENTIFIER_TAG
		this._cooked = this.source
	}
	/**
	 * Use a Screener to set the value of this Token.
	 * If this token is an identifier, get the index of this token’s contents
	 * in the given screener’s list of unique identifier tokens.
	 * Else if this token is a keyword, do nothing.
	 * @param   screener the Screener whose indexed identifiers to search
	 */
	setValue(screener: Screener) {
		if (this.is_identifier) {
			this._cooked = screener.identifiers.indexOf(this.source)
		}
	}
	cook(): number/* bigint */|string {
		return this._cooked
	}
}
export class TokenPunctuator extends Token {
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
		super('PUNCTUATOR', buffer[0], ...buffer.slice(1))
	}
	cook(): string {
		return this.source
	}
}
