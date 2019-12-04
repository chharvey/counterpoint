import Serializable from '../iface/Serializable.iface'
import Scanner, {Char, STX, ETX} from './Scanner.class'
import Translator, {ParseLeaf} from './Translator.class'


/**
 * A Token object is the kind of thing that the Lexer returns.
 * It holds:
 * - the text of the token (self.cargo)
 * - the line number and column index where the token starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_6.4
 */
export abstract class Token implements Serializable {
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
	 * @returns All the source characters in this Token.
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
	 * Produce a parse leaf with this token’s cooked value.
	 * If this token is not to be sent to the parser, then return `null`.
	 * @returns a new ParseLeaf object containing a computed value of this token, or `null`
	 */
	abstract cook(): ParseLeaf|null;

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const attributes: string = ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
		].join(' ').trim()
		return `<${this.tagname}${attributes}>${this.source}</${this.tagname}>`
	}
}
export class TokenFilebound extends Token {
	static readonly TAGNAME: string = 'FILEBOUND'
	static readonly CHARS: readonly string[] = [STX, ETX]
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenFilebound.TAGNAME, start_char, ...more_chars)
	}
	cook(): ParseLeaf {
		return new ParseLeaf(this, this.source === STX /* || !this.source === ETX */)
	}
	serialize(): string {
		const formatted: string = new Map<string, string>([
			[STX, '\u2402' /* SYMBOL FOR START OF TEXT */],
			[ETX, '\u2403' /* SYMBOL FOR END OF TEXT   */],
		]).get(this.source) !
		return `<${TokenFilebound.TAGNAME}>${formatted}</${TokenFilebound.TAGNAME}>`
	}
}
export class TokenWhitespace extends Token {
	static readonly TAGNAME: string = 'WHITESPACE'
	static readonly CHARS: readonly string[] = [' ', '\t', '\n', '\r']
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenWhitespace.TAGNAME, start_char, ...more_chars)
	}
	cook(): null {
		return null // we do not want to send whitespace to the parser
	}
}
export abstract class TokenComment extends Token {
	static readonly TAGNAME: string = 'COMMENT'
	constructor(kind: string, start_char: Char, ...more_chars: Char[]) {
		super(`${TokenComment.TAGNAME}-${kind}`, start_char, ...more_chars)
	}
	/* final */ cook(): null {
		return null // we do not want to send comments to the parser
	}
}
class TokenCommentLine extends TokenComment {
	static readonly CHARS_LINE: '---' = '---'
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('LINE', start_char, ...more_chars)
	}
}
class TokenCommentMulti extends TokenComment {
	static readonly CHARS_MULTI_START : '"'   = '"'
	static readonly CHARS_MULTI_END   : '"'   = '"'
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('MULTI', start_char, ...more_chars)
	}
}
class TokenCommentMultiNest extends TokenComment {
	static readonly CHARS_MULTI_NEST_START : '"{'  = '"{'
	static readonly CHARS_MULTI_NEST_END   : '}"'  = '}"'
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('MULTI_NEST', start_char, ...more_chars)
	}
}
class TokenCommentDoc extends TokenComment {
	static readonly CHARS_DOC_START : '"""' = '"""'
	static readonly CHARS_DOC_END   : '"""' = '"""'
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('DOC', start_char, ...more_chars)
	}
}
export abstract class TokenString extends Token {
	static readonly TAGNAME: string = 'STRING'
	constructor(kind: string, start_char: Char, ...more_chars: Char[]) {
		super(`${TokenString.TAGNAME}-${kind}`, start_char, ...more_chars)
	}
}
export class TokenStringLiteral extends TokenString {
	static readonly CHARS_LITERAL_DELIM: '\'' = '\''
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('LITERAL', start_char, ...more_chars)
	}
	cook(): ParseLeaf {
		return new ParseLeaf(this, String.fromCodePoint(...Translator.svl(
			this.source.slice(1, -1) // cut off the string delimiters
		)))
	}
}
export class TokenStringTemplate extends TokenString {
	static readonly CHARS_TEMPLATE_DELIM       : '`'  = '`'
	static readonly CHARS_TEMPLATE_INTERP_START: '{{' = '{{'
	static readonly CHARS_TEMPLATE_INTERP_END  : '}}' = '}}'
	constructor(start_char: Char, ...more_chars: Char[]) {
		super('TEMPLATE', start_char, ...more_chars)
	}
	cook(): ParseLeaf {
		const c0: string = this.source
		return new ParseLeaf(this, String.fromCodePoint(...Translator.svt(
			c0.slice( // cut off the string delimiters
				(c0[0          ] === TokenStringTemplate.CHARS_TEMPLATE_DELIM) ?  1 : /* if (c0[0          ] + c0[1          ] === TokenStringTemplate.CHARS_TEMPLATE_INTERP_END  ) */  2,
				(c0[c0.length-1] === TokenStringTemplate.CHARS_TEMPLATE_DELIM) ? -1 : /* if (c0[c0.length-2] + c0[c0.length-1] === TokenStringTemplate.CHARS_TEMPLATE_INTERP_START) */ -2,
			)
		)))
	}
}
export class TokenNumber extends Token {
	static readonly TAGNAME: string = 'NUMBER'
	static readonly RADIX_DEFAULT: number = 10
	static readonly bases: ReadonlyMap<string, number> = new Map<string, number>([
		['b',  2],
		['q',  4],
		['o',  8],
		['d', 10],
		['x', 16],
		['z', 36],
	])
	static readonly digits: ReadonlyMap<number, readonly string[]> = new Map<number, readonly string[]>([
		[ 2, '0 1'                                                                     .split(' ')],
		[ 4, '0 1 2 3'                                                                 .split(' ')],
		[ 8, '0 1 2 3 4 5 6 7'                                                         .split(' ')],
		[10, '0 1 2 3 4 5 6 7 8 9'                                                     .split(' ')],
		[16, '0 1 2 3 4 5 6 7 8 9 a b c d e f'                                         .split(' ')],
		[36, '0 1 2 3 4 5 6 7 8 9 a b c d e f g h i j k l m n o p q r s t u v w x y z' .split(' ')],
	])
	constructor(
		private readonly radix: number,
		start_char: Char,
		...more_chars: Char[]
	) {
		super(TokenNumber.TAGNAME, start_char, ...more_chars)
	}
	cook(): ParseLeaf {
		return new ParseLeaf(this, Translator.mv(this.source[0] === '\\' ? this.source.slice(2) : this.source, this.radix))
	}
}
export class TokenWord extends Token {
	static readonly TAGNAME: string = 'WORD'
	static readonly CHARS_START: readonly string[] = ''.split(' ')
	static readonly CHARS_REST : readonly string[] = ''.split(' ')
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenWord.TAGNAME, start_char, ...more_chars)
	}
	/**
	 * @param   id the running identifier count
	 */
	cook(id?: number /* bigint */): ParseLeaf {
		return new ParseLeaf(this, id || -1)
	}
}
export class TokenPunctuator extends Token {
	static readonly TAGNAME: string = 'PUNCTUATOR'
	static readonly CHARS_1: readonly string[] = '+ - * / ^ ( )'.split(' ')
	static readonly CHARS_2: readonly string[] = ''.split(' ')
	static readonly CHARS_3: readonly string[] = ''.split(' ')
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenPunctuator.TAGNAME, start_char, ...more_chars)
	}
	cook(): ParseLeaf {
		return new ParseLeaf(this, this.source)
	}
}


/**
 * A Lexer (aka: Tokenizer, Lexical Analyzer).
 * @see http://parsingintro.sourceforge.net/#contents_item_6.5
 */
export default class Lexer {
	/** The scanner returning characters for each iteration. */
	private readonly scanner: Iterator<Char>;
	/** The result of the scanner iterator. */
	private iterator_result_char: IteratorResult<Char>;

	/** Did this Lexer just pass a token that contains `\n`? */
	private state_newline: boolean = false
	/** How many levels of nested multiline comments are we in? */
	private comment_multiline_level: number /* bigint */ = 0

	/** The current character. */
	private c0: Char;
	/** The lookahead(1) character. */
	private c1: Char|null;
	/** The lookahead(2) character. */
	private c2: Char|null;
	/** The lookahead(3) character. */
	private c3: Char|null;

	/**
	 * Construct a new Lexer object.
	 * @param   source_text - the entire source text
	 */
	constructor(source_text: string) {
		this.scanner = new Scanner(source_text).generate()
		this.iterator_result_char = this.scanner.next()

		this.c0 = this.iterator_result_char.value
		this.c1 = this.c0.lookahead()
		this.c2 = this.c0.lookahead(2)
		this.c3 = this.c0.lookahead(3)
	}

	/**
	 * Advance this Lexer, scanning the next character and reassigning variables.
	 * @param   n the number of times to advance
	 * @throws  {RangeError} if the argument is not a positive integer
	 */
	private advance(n: number /* bigint */ = 1): void {
		if (n % 1 !== 0 || n <= 0) throw new RangeError('Argument must be a positive integer.')
		if (n === 1) {
			this.iterator_result_char = this.scanner.next()
			if (!this.iterator_result_char.done) {
				this.c0 = this.iterator_result_char.value
				this.c1 = this.c0.lookahead()
				this.c2 = this.c0.lookahead(2)
				this.c3 = this.c0.lookahead(3)
			}
		} else {
			this.advance(n - 1)
			this.advance()
		}
	}

	/**
	 * Construct and return the next token in the source text.
	 * @returns the next token
	 */
	* generate(): Iterator<Token> {
		while (!this.iterator_result_char.done) {
			if (Char.inc(TokenWhitespace.CHARS, this.c0)) {
				const wstoken: TokenWhitespace = new TokenWhitespace(this.c0)
				this.advance()
				while (!this.iterator_result_char.done && Char.inc(TokenWhitespace.CHARS, this.c0)) {
					wstoken.add(this.c0)
					this.advance()
				}
				this.state_newline = [...wstoken.source].includes('\n')
				yield wstoken
				continue;
			}

			let token: Token;
			if (Char.inc(TokenFilebound.CHARS, this.c0)) {
				token = new TokenFilebound(this.c0)
				this.advance()
			} else if (Char.eq(TokenCommentLine.CHARS_LINE, this.c0, this.c1, this.c2)) { // we found a line comment
				token = new TokenCommentLine(this.c0, this.c1 !, this.c2 !)
				this.advance(TokenCommentLine.CHARS_LINE.length)
				while (!this.iterator_result_char.done && !Char.eq('\n', this.c0)) {
					if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of comment')
					token.add(this.c0)
					this.advance()
				}
				// do not add '\n' to token
			} else if (Char.eq('"', this.c0)) { // we found the start of a doc comment or multiline comment
				if (this.state_newline && Char.eq(TokenCommentDoc.CHARS_DOC_START + '\n', this.c0, this.c1, this.c2, this.c3)) { // we found a doc comment
					token = new TokenCommentDoc(this.c0, this.c1 !, this.c2 !, this.c3 !)
					this.advance((TokenCommentDoc.CHARS_DOC_START + '\n').length)
					while (!this.iterator_result_char.done) {
						if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of comment')
						if (
							!Char.eq(TokenCommentDoc.CHARS_DOC_END + '\n', this.c0, this.c1, this.c2, this.c3) ||
							token.source.slice(token.source.lastIndexOf('\n') + 1).trim() !== '' // the tail end of the token does not match `/\n(\s)*/` (a newline followed by whitespace)
						) {
							token.add(this.c0)
							this.advance()
						} else {
							break;
						}
					}
					// add ending delim to token
					token.add(this.c0, this.c1 !, this.c2 !)
					this.advance(TokenCommentDoc.CHARS_DOC_END.length)
				} else if (Char.eq(TokenCommentMultiNest.CHARS_MULTI_NEST_START, this.c0, this.c1)) { // we found a nestable multiline comment
					token = new TokenCommentMultiNest(this.c0, this.c1 !)
					this.advance(TokenCommentMultiNest.CHARS_MULTI_NEST_START.length)
					this.comment_multiline_level++;
					while (this.comment_multiline_level !== 0) {
						while (!this.iterator_result_char.done && !Char.eq(TokenCommentMultiNest.CHARS_MULTI_NEST_END, this.c0, this.c1)) {
							if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of comment')
							if (Char.eq(TokenCommentMultiNest.CHARS_MULTI_NEST_START, this.c0, this.c1)) {
								token.add(this.c0, this.c1 !)
								this.advance(TokenCommentMultiNest.CHARS_MULTI_NEST_START.length)
								this.comment_multiline_level++;
							} else {
								token.add(this.c0)
								this.advance()
							}
						}
						// add ending delim to token
						token.add(this.c0, this.c1 !)
						this.advance(TokenCommentMultiNest.CHARS_MULTI_NEST_END.length)
						this.comment_multiline_level--;
					}
				} else { // we found a non-nestable multiline comment
					token = new TokenCommentMulti(this.c0)
					this.advance()
					while (!this.iterator_result_char.done && !Char.eq(TokenCommentMulti.CHARS_MULTI_END, this.c0)) {
						if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of comment')
						token.add(this.c0)
						this.advance()
					}
					// add ending delim to token
					token.add(this.c0)
					this.advance(TokenCommentMulti.CHARS_MULTI_END.length)
				}
			} else if (Char.eq(TokenStringLiteral.CHARS_LITERAL_DELIM, this.c0)) {
				token = new TokenStringLiteral(this.c0)
				this.advance()
				while (!this.iterator_result_char.done && !Char.eq(TokenStringLiteral.CHARS_LITERAL_DELIM, this.c0)) {
					if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of string')
					if (Char.eq('\\', this.c0)) { // possible escape or line continuation
						if (Char.inc([TokenStringLiteral.CHARS_LITERAL_DELIM, '\\', 's','t','n','r'], this.c1)) { // an escaped character literal
							token.add(this.c0, this.c1 !)
							this.advance(2)
						} else if (Char.eq('u{', this.c1, this.c2)) { // an escape sequence
							const line : number = this.c0.line_index + 1
							const col  : number = this.c0.col_index  + 1
							let cargo  : string = this.c0.source + this.c1 !.source + this.c2 !.source
							token.add(this.c0, this.c1 !, this.c2 !)
							this.advance(3)
							while(!Char.eq('}', this.c0)) {
								cargo += this.c0.source
								if (Char.inc(TokenNumber.digits.get(16) !, this.c0)) {
									token.add(this.c0)
									this.advance()
								} else {
									throw new Error(`Invalid escape sequence: \`${cargo}\` at line ${line} col ${col}.`)
								}
							}
							token.add(this.c0)
							this.advance()
						} else if (Char.eq('\n', this.c1)) { // a line continuation (LF)
							token.add(this.c0, this.c1 !)
							this.advance(2)
						} else if (Char.eq('\r\n', this.c1, this.c2)) { // a line continuation (CRLF)
							token.add(this.c0, this.c1 !, this.c2 !)
							this.advance(3)
						} else { // a backslash escapes the following character
							token.add(this.c0)
							this.advance()
						}
					} else {
						token.add(this.c0)
						this.advance()
					}
				}
				// add ending delim to token
				token.add(this.c0)
				this.advance(TokenStringLiteral.CHARS_LITERAL_DELIM.length)
			} else if (Char.eq(TokenStringTemplate.CHARS_TEMPLATE_DELIM, this.c0) || Char.eq(TokenStringTemplate.CHARS_TEMPLATE_INTERP_END, this.c0, this.c1)) {
				token = new TokenStringTemplate(this.c0)
				this.advance()
				while (!this.iterator_result_char.done) {
					if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of string')
					if (Char.eq('\\' + TokenStringTemplate.CHARS_TEMPLATE_DELIM, this.c0, this.c1)) { // an escaped template delimiter
						token.add(this.c0, this.c1 !)
						this.advance(2)
					} else if (Char.eq(TokenStringTemplate.CHARS_TEMPLATE_INTERP_START, this.c0, this.c1)) { // end string template head/middle
						// add start interpolation delim to token
						token.add(this.c0, this.c1 !)
						this.advance(TokenStringTemplate.CHARS_TEMPLATE_INTERP_START.length)
						break;
					} else if (Char.eq(TokenStringTemplate.CHARS_TEMPLATE_DELIM, this.c0)) { // end string template full/tail
						// add ending delim to token
						token.add(this.c0)
						this.advance(TokenStringTemplate.CHARS_TEMPLATE_DELIM.length)
						break;
					} else {
						token.add(this.c0)
						this.advance()
					}
				}
			} else if (Char.eq('\\', this.c0)) {
				/**** A possible integer literal was found. ****/
				const line  : number = this.c0.line_index + 1
				const col   : number = this.c0.col_index  + 1
				const cargo : string = this.c0.source + (this.c1 ? this.c1.source : '')
				if (!Char.inc([...TokenNumber.bases.keys()], this.c1)) {
					throw new Error(`Invalid escape sequence: \`${cargo}\` at line ${line} col ${col}.`)
				}
				const radix: number = TokenNumber.bases.get(this.c1 !.source) !
				token = new TokenNumber(radix, this.c0, this.c1 !)
				this.advance(2)
				while (Char.inc(TokenNumber.digits.get(radix) !, this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (Char.inc(TokenNumber.digits.get(TokenNumber.RADIX_DEFAULT) !, this.c0)) {
				/**** An integer literal in the default base was found. ****/
				token = new TokenNumber(TokenNumber.RADIX_DEFAULT, this.c0)
				this.advance()
				while (Char.inc(TokenNumber.digits.get(TokenNumber.RADIX_DEFAULT) !, this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (Char.inc(TokenWord.CHARS_START, this.c0)) {
				token = new TokenWord(this.c0)
				this.advance()
				while (!this.iterator_result_char.done && Char.inc(TokenWord.CHARS_REST, this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (Char.inc(TokenPunctuator.CHARS_3, this.c0, this.c1, this.c2)) {
				token = new TokenPunctuator(this.c0, this.c1 !, this.c2 !)
				this.advance(3)
			} else if (Char.inc(TokenPunctuator.CHARS_2, this.c0, this.c1)) {
				token = new TokenPunctuator(this.c0, this.c1 !)
				this.advance(2)
			} else if (Char.inc(TokenPunctuator.CHARS_1, this.c0)) {
				token = new TokenPunctuator(this.c0)
				this.advance()
			} else {
				throw new Error(`I found a character or symbol that I do not recognize:
${this.c0} on ${this.c0.line_index + 1}:${this.c0.col_index + 1}.`)
			}
			this.state_newline = false
			yield token
		}
	}
}
