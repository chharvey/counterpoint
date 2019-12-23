import Serializable from '../iface/Serializable.iface'
import {Char, STX, ETX} from './Scanner.class'
import Lexer from './Lexer.class'
import {
	TerminalFilebound,
	TerminalWhitespace,
	TerminalComment,
	TerminalStringLiteral,
	TerminalStringTemplateFull,
	TerminalStringTemplateHead,
	TerminalStringTemplateMiddle,
	TerminalStringTemplateTail,
	TerminalNumber,
	TerminalWord,
	TerminalPunctuator,
} from './Terminal.class'
import Translator from './Translator.class'

import {
	LexError02,
	LexError03,
	LexError04,
} from '../error/LexError.class'


enum TemplatePosition {
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
	// /**
	//  * Generate a new Token from a lexer’s input stream using this Token’s lexing rules.
	//  *
	//  * NOTE: This method is commented out because it’s impossible to have a static abstract method.
	//  * It is only left here as a reminder that each subclass should have a corresponding
	//  * static submethod that implements this.
	//  *
	//  * @param   lexer      - the lexer whose input stream to use
	//  * @returns              a Token satisfying this Token’s lexing rules.
	//  * @throws  {LexError} - if the input stream fails lexing
	//  */
	// static lex(lexer: Lexer): Token;


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
	constructor(
		readonly tagname: string,
		start_char: Char,
		...more_chars: Char[]
	) {
		this._cargo     = start_char.source + more_chars.map((char) => char.source).join('')
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
	static readonly CHARS: readonly string[] = [STX, ETX]
	static lex(lexer: Lexer): TokenFilebound {
		const token: TokenFilebound = new TokenFilebound(lexer.c0)
		lexer.advance()
		return token
	}
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalFilebound.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): boolean {
		return this.source === STX /* || !this.source === ETX */
	}
	serialize(): string {
		const formatted: string = new Map<string, string>([
			[STX, '\u2402' /* SYMBOL FOR START OF TEXT */],
			[ETX, '\u2403' /* SYMBOL FOR END OF TEXT   */],
		]).get(this.source) !
		return `<${TerminalFilebound.instance.TAGNAME}>${formatted}</${TerminalFilebound.instance.TAGNAME}>`
	}
}
export class TokenWhitespace extends Token {
	static readonly CHARS: readonly string[] = [' ', '\t', '\n', '\r']
	static lex(lexer: Lexer): TokenWhitespace {
		const token: TokenWhitespace = new TokenWhitespace(lexer.c0)
		lexer.advance()
		while (!lexer.isDone && Char.inc(TokenWhitespace.CHARS, lexer.c0)) {
			token.add(lexer.c0)
			lexer.advance()
		}
		return token
	}
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalWhitespace.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): null {
		return null // we do not want to send whitespace to the parser
	}
}
export abstract class TokenComment extends Token {
	constructor(kind: string, start_char: Char, ...more_chars: Char[]) {
		super(`${TerminalComment.instance.TAGNAME}-${kind}`, start_char, ...more_chars)
	}
	/** @final */ get cooked(): null {
		return null // we do not want to send comments to the parser
	}
}
export class TokenCommentLine extends TokenComment {
	static readonly DELIM: '\\' = '\\'
	static lex(lexer: Lexer): TokenCommentLine {
		const token: TokenCommentLine = new TokenCommentLine(lexer.c0)
		lexer.advance(TokenCommentLine.DELIM.length)
		while (!lexer.isDone && !Char.eq('\n', lexer.c0)) {
			if (Char.eq(ETX, lexer.c0)) throw new LexError02(token)
			token.add(lexer.c0)
			lexer.advance()
		}
		// do not add '\n' to token
		return token
	}
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('LINE', start_char, ...more_chars)
	}
}
export class TokenCommentMulti extends TokenComment {
	static readonly DELIM_START : '"' = '"'
	static readonly DELIM_END   : '"' = '"'
	static lex(lexer: Lexer): TokenCommentMulti {
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
	}
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('MULTI', start_char, ...more_chars)
	}
}
export class TokenCommentMultiNest extends TokenComment {
	static readonly DELIM_START : '"{' = '"{'
	static readonly DELIM_END   : '}"' = '}"'
	static lex(lexer: Lexer): TokenCommentMultiNest {
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
	}
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('MULTI_NEST', start_char, ...more_chars)
	}
}
export class TokenCommentDoc extends TokenComment {
	static readonly DELIM_START : '"""' = '"""'
	static readonly DELIM_END   : '"""' = '"""'
	static lex(lexer: Lexer): TokenCommentDoc {
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
	}
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('DOC', start_char, ...more_chars)
	}
}
export class TokenStringLiteral extends Token {
	static readonly DELIM: '\'' = '\''
	static readonly ESCAPES: readonly string[] = [TokenStringLiteral.DELIM, '\\', 's','t','n','r']
	static lex(lexer: Lexer): TokenStringLiteral {
		const token: TokenStringLiteral = new TokenStringLiteral(lexer.c0)
		lexer.advance()
		while (!lexer.isDone && !Char.eq(TokenStringLiteral.DELIM, lexer.c0)) {
			if (Char.eq(ETX, lexer.c0)) throw new LexError02(token)
			if (Char.eq('\\', lexer.c0)) { // possible escape or line continuation
				if (Char.inc(TokenStringLiteral.ESCAPES, lexer.c1)) {
					/* an escaped character literal */
					token.add(lexer.c0, lexer.c1 !)
					lexer.advance(2)

				} else if (Char.eq('u{', lexer.c1, lexer.c2)) {
					/* an escape sequence */
					const digits: readonly string[] = TokenNumber.DIGITS.get(16) !
					let cargo: string = lexer.c0.source + lexer.c1 !.source + lexer.c2 !.source
					token.add(lexer.c0, lexer.c1 !, lexer.c2 !)
					lexer.advance(3)
					if (Char.inc(digits, lexer.c0)) {
						cargo += lexer.c0.source
						token.add(lexer.c0)
						lexer.advance()
						while(!lexer.isDone && Char.inc([...digits, TokenNumber.SEPARATOR], lexer.c0)) {
							if (Char.inc(digits, lexer.c0)) {
								cargo += lexer.c0.source
								token.add(lexer.c0)
								lexer.advance()
							} else if (Char.eq(TokenNumber.SEPARATOR, lexer.c0)) {
								if (Char.inc(digits, lexer.c1)) {
									cargo += lexer.c0.source + lexer.c1 !.source
									token.add(lexer.c0, lexer.c1 !)
									lexer.advance(2)
								} else {
									throw new LexError04(Char.eq(TokenNumber.SEPARATOR, lexer.c1) ? lexer.c1 ! : lexer.c0)
								}
							}
						}
					}
					// add ending escape delim
					if (Char.eq('}', lexer.c0)) {
						token.add(lexer.c0)
						lexer.advance()
					} else {
						throw new LexError03(cargo, lexer.c0.line_index, lexer.c0.col_index)
					}

				} else if (Char.eq('\n', lexer.c1)) {
					/* a line continuation (LF) */
					token.add(lexer.c0, lexer.c1 !)
					lexer.advance(2)

				} else if (Char.eq('\r\n', lexer.c1, lexer.c2)) {
					/* a line continuation (CRLF) */
					token.add(lexer.c0, lexer.c1 !, lexer.c2 !)
					lexer.advance(3)

				} else {
					/* a backslash escapes the following character */
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
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalStringLiteral.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): string {
		return String.fromCodePoint(...Translator.svl(
			this.source.slice(1, -1) // cut off the string delimiters
		))
	}
}
export abstract class TokenStringTemplate extends Token {
	static readonly DELIM              : '`'  = '`'
	static readonly DELIM_INTERP_START : '{{' = '{{'
	static readonly DELIM_INTERP_END   : '}}' = '}}'
	static lex(lexer: Lexer, full_or_head: boolean = true): TokenStringTemplate {
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

			} else if (Char.eq(TokenStringTemplate.DELIM, lexer.c0)) {
				/* end string template full/tail */
				// add ending delim to token
				buffer.push(lexer.c0)
				lexer.advance(TokenStringTemplate.DELIM.length)
				positions.delete(TemplatePosition.HEAD)
				positions.delete(TemplatePosition.MIDDLE)
				break;

			} else if (Char.eq(TokenStringTemplate.DELIM_INTERP_START, lexer.c0, lexer.c1)) {
				/* end string template head/middle */
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
	cook(start: number = 0, end: number = Infinity): string {
		return String.fromCodePoint(...Translator.svt(
			this.source.slice(start, end) // cut off the string delimiters
		))
	}
}
export class TokenStringTemplateFull extends TokenStringTemplate {
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalStringTemplateFull.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): string {
		return super.cook(TokenStringTemplate.DELIM.length, -TokenStringTemplate.DELIM.length)
	}
}
export class TokenStringTemplateHead extends TokenStringTemplate {
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalStringTemplateHead.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): string {
		return super.cook(TokenStringTemplate.DELIM.length, -TokenStringTemplate.DELIM_INTERP_START.length)
	}
}
export class TokenStringTemplateMiddle extends TokenStringTemplate {
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalStringTemplateMiddle.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): string {
		return super.cook(TokenStringTemplate.DELIM_INTERP_END.length, -TokenStringTemplate.DELIM_INTERP_START.length)
	}
}
export class TokenStringTemplateTail extends TokenStringTemplate {
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalStringTemplateTail.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): string {
		return super.cook(TokenStringTemplate.DELIM_INTERP_END.length, -TokenStringTemplate.DELIM.length)
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
	static lex(lexer: Lexer, radix?: number): TokenNumber {
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
		while (!lexer.isDone && Char.inc([...digits, TokenNumber.SEPARATOR], lexer.c0)) {
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
	constructor(
		private readonly radix: number,
		start_char: Char,
		...more_chars: Char[]
	) {
		super(TerminalNumber.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): number {
		return Translator.mv(this.source[0] === '\\' ? this.source.slice(2) : this.source, this.radix)
	}
}
export class TokenWord extends Token {
	static readonly CHARS_START: readonly string[] = ''.split(' ')
	static readonly CHARS_REST : readonly string[] = ''.split(' ')
	static lex(lexer: Lexer): TokenWord {
		const token: TokenWord = new TokenWord(lexer.c0)
		lexer.advance()
		while (!lexer.isDone && Char.inc(TokenWord.CHARS_REST, lexer.c0)) {
			token.add(lexer.c0)
			lexer.advance()
		}
		return token
	}
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalWord.instance.TAGNAME, start_char, ...more_chars)
	}
	/**
	 * @param   id the running identifier count
	 */
	cook(id?: number /* bigint */): number {
		return id || -1 // TODO
	}
	get cooked(): number {
		return -1 // TODO
	}
}
export class TokenPunctuator extends Token {
	static readonly CHARS_1: readonly string[] = '+ - * / ^ ( )'.split(' ')
	static readonly CHARS_2: readonly string[] = ''.split(' ')
	static readonly CHARS_3: readonly string[] = ''.split(' ')
	static lex(lexer: Lexer, count: number = 1): TokenPunctuator {
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
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TerminalPunctuator.instance.TAGNAME, start_char, ...more_chars)
	}
	get cooked(): string {
		return this.source
	}
}
