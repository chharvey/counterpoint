import Serializable from '../iface/Serializable.iface'

import Scanner, {Char, STX, ETX} from './Scanner.class'


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
		private readonly tagname: string,
		start_char: Char,
		...more_chars: Char[]
	) {
		this._cargo     = start_char.cargo + more_chars.map((char) => char.cargo).join('')
		this.line_index = start_char.line_index
		this.col_index  = start_char.col_index
	}

	/**
	 * Get this Token’s cargo.
	 * @returns All the characters in this Token.
	 */
	get cargo(): string {
		return this._cargo
	}

	/**
	 * Add to this Token’s cargo.
	 * @param chars - the characters to append
	 */
	add(...chars: Char[]): void {
		this._cargo += chars.map((char) => char.cargo).join('')
	}

	/**
	 * @implements Serializable
	 */
	serialize(...attrs: string[]): string {
		const attributes: string = ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
			...attrs
		].join(' ').trim()
		return `<${this.tagname}${attributes}>${this.cargo}</${this.tagname}>`
	}
}
export class TokenFilebound extends Token {
	static readonly TAGNAME: string = 'FILEBOUND'
	static readonly CHARS: readonly string[] = [STX, ETX]
	value: boolean|null = null
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenFilebound.TAGNAME, start_char, ...more_chars)
	}
	serialize(): string {
		const attributes: string = ' ' + [
			this.value !== null ? `value="${this.value}"` : ''
		].join(' ').trim()
		const contents: string = new Map<string, string>([
			[STX, '\u2402' /* SYMBOL FOR START OF TEXT */],
			[ETX, '\u2403' /* SYMBOL FOR END OF TEXT   */],
		]).get(this.cargo) !
		return `<${TokenFilebound.TAGNAME}${attributes}>${contents}</${TokenFilebound.TAGNAME}>`
	}
}
export class TokenWhitespace extends Token {
	static readonly TAGNAME: string = 'WHITESPACE'
	static readonly CHARS: readonly string[] = [' ', '\t', '\n', '\r']
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenWhitespace.TAGNAME, start_char, ...more_chars)
	}
}
export abstract class TokenComment extends Token {
	static readonly TAGNAME: string = 'COMMENT'
	static readonly CHARS_LINE            : '---' = '---'
	static readonly CHARS_MULTI_START     : '"'   = '"'
	static readonly CHARS_MULTI_END       : '"'   = '"'
	static readonly CHARS_MULTI_NEST_START: '"{'  = '"{'
	static readonly CHARS_MULTI_NEST_END  : '}"'  = '}"'
	static readonly CHARS_DOC_START       : '"""' = '"""'
	static readonly CHARS_DOC_END         : '"""' = '"""'
	constructor(
		private readonly kind: string,
		start_char: Char,
		...more_chars: Char[]
	) {
		super(TokenComment.TAGNAME, start_char, ...more_chars)
	}
	serialize(): string {
		return super.serialize(this.kind ? `kind="${this.kind}"` : '')
	}
}
class TokenCommentLine      extends TokenComment { constructor(start_char: Char, ...more_chars: Char[]) { super('LINE'       , start_char, ...more_chars) } }
class TokenCommentMulti     extends TokenComment { constructor(start_char: Char, ...more_chars: Char[]) { super('MULTI'      , start_char, ...more_chars) } }
class TokenCommentMultiNest extends TokenComment { constructor(start_char: Char, ...more_chars: Char[]) { super('MULTI_NEST' , start_char, ...more_chars) } }
class TokenCommentDoc       extends TokenComment { constructor(start_char: Char, ...more_chars: Char[]) { super('DOC'        , start_char, ...more_chars) } }
export class TokenString extends Token {
	static readonly TAGNAME: string = 'STRING'
	static readonly CHARS_LITERAL_DELIM        : '\'' = `'`
	static readonly CHARS_TEMPLATE_DELIM       : '`'  = '`'
	static readonly CHARS_TEMPLATE_INTERP_START: '{{' = '{{'
	static readonly CHARS_TEMPLATE_INTERP_END  : '}}' = '}}'
	value: string|null = null
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenString.TAGNAME, start_char, ...more_chars)
	}
	serialize(): string {
		return super.serialize(this.value !== null ? `value="${this.value}"` : '')
	}
}
export class TokenNumber extends Token {
	static readonly TAGNAME: string = 'NUMBER'
	static readonly CHARS: readonly string[] = '0 1 2 3 4 5 6 7 8 9'.split(' ')
	static readonly DIGITS_HEX: readonly string[] = '0 1 2 3 4 5 6 7 8 9 a b c d e f'.split('')
	value: number|null = null
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenNumber.TAGNAME, start_char, ...more_chars)
	}
	serialize(): string {
		return super.serialize(this.value !== null ? `value="${this.value}"` : '')
	}
}
export class TokenWord extends Token {
	static readonly TAGNAME: string = 'WORD'
	static readonly CHARS_START: readonly string[] = ''.split(' ')
	static readonly CHARS_REST : readonly string[] = ''.split(' ')
	id: number|null = null
	constructor(start_char: Char, ...more_chars: Char[]) {
		super(TokenWord.TAGNAME, start_char, ...more_chars)
	}
	serialize(): string {
		return super.serialize(this.id !== null ? `id="${this.id}"` : '')
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
	constructor(
		private readonly source_text: string,
	) {
		this.scanner = new Scanner(this.source_text).generate()
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
	 * @returns the next token, if it does not contain whitespace
	 */
	* generate(): Iterator<Token> {
		while (!this.iterator_result_char.done) {
			if (Char.inc(TokenWhitespace.CHARS, this.c0)) {
				const wstoken: TokenWhitespace = new TokenWhitespace(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && Char.inc(TokenWhitespace.CHARS, this.c0)) {
					wstoken.add(this.c0)
					this.advance()
				}
				this.state_newline = [...wstoken.cargo].includes('\n')
				// yield wstoken // only if we want the lexer to return whitespace
				continue;
			}

			let token: Token;
			if (Char.inc(TokenFilebound.CHARS, this.c0)) {
				token = new TokenFilebound(this.iterator_result_char.value)
				this.advance()
			} else if (Char.eq(TokenComment.CHARS_LINE, this.c0, this.c1, this.c2)) { // we found a line comment
				token = new TokenCommentLine(this.iterator_result_char.value, this.c1 !, this.c2 !)
				this.advance(TokenComment.CHARS_LINE.length)
				while (!this.iterator_result_char.done && !Char.eq('\n', this.c0)) {
					if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of comment')
					token.add(this.c0)
					this.advance()
				}
				// do not add '\n' to token
			} else if (Char.eq('"', this.c0)) { // we found the start of a doc comment or multiline comment
				if (this.state_newline && Char.eq(TokenComment.CHARS_DOC_START + '\n', this.c0, this.c1, this.c2, this.c3)) { // we found a doc comment
					token = new TokenCommentDoc(this.iterator_result_char.value, this.c1 !, this.c2 !, this.c3 !)
					this.advance((TokenComment.CHARS_DOC_START + '\n').length)
					while (!this.iterator_result_char.done) {
						if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of comment')
						if (
							!Char.eq(TokenComment.CHARS_DOC_END + '\n', this.c0, this.c1, this.c2, this.c3) ||
							token.cargo.slice(token.cargo.lastIndexOf('\n') + 1).trim() !== '' // the tail end of the token does not match `/\n(\s)*/` (a newline followed by whitespace)
						) {
							token.add(this.c0)
							this.advance()
						} else {
							break;
						}
					}
					// add ending delim to token
					token.add(this.c0, this.c1 !, this.c2 !)
					this.advance(TokenComment.CHARS_DOC_END.length)
				} else if (Char.eq(TokenComment.CHARS_MULTI_NEST_START, this.c0, this.c1)) { // we found a nestable multiline comment
					token = new TokenCommentMultiNest(this.iterator_result_char.value, this.c1 !)
					this.advance(TokenComment.CHARS_MULTI_NEST_START.length)
					this.comment_multiline_level++;
					while (this.comment_multiline_level !== 0) {
						while (!this.iterator_result_char.done && !Char.eq(TokenComment.CHARS_MULTI_NEST_END, this.c0, this.c1)) {
							if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of comment')
							if (Char.eq(TokenComment.CHARS_MULTI_NEST_START, this.c0, this.c1)) {
								token.add(this.c0, this.c1 !)
								this.advance(TokenComment.CHARS_MULTI_NEST_START.length)
								this.comment_multiline_level++;
							} else {
								token.add(this.c0)
								this.advance()
							}
						}
						// add ending delim to token
						token.add(this.c0, this.c1 !)
						this.advance(TokenComment.CHARS_MULTI_NEST_END.length)
						this.comment_multiline_level--;
					}
				} else { // we found a non-nestable multiline comment
					token = new TokenCommentMulti(this.iterator_result_char.value)
					this.advance()
					while (!this.iterator_result_char.done && !Char.eq(TokenComment.CHARS_MULTI_END, this.c0)) {
						if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of comment')
						token.add(this.c0)
						this.advance()
					}
					// add ending delim to token
					token.add(this.c0)
					this.advance(TokenComment.CHARS_MULTI_END.length)
				}
			} else if (Char.eq(TokenString.CHARS_LITERAL_DELIM, this.c0)) {
				token = new TokenString(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && !Char.eq(TokenString.CHARS_LITERAL_DELIM, this.c0)) {
					if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of string')
					if (Char.eq('\\', this.c0)) { // possible escape or line continuation
						if (Char.inc([TokenString.CHARS_LITERAL_DELIM, '\\', 's','t','n','r'], this.c1)) { // an escaped character literal
							token.add(this.c0, this.c1 !)
							this.advance(2)
						} else if (Char.eq('u{', this.c1, this.c2)) { // an escape sequence
							const sequence: {
								readonly line: number,
								readonly col : number,
								cargo: string,
							} = {
								line: this.c0.line_index + 1,
								col : this.c0.col_index + 1,
								cargo: this.c0.cargo + this.c1 !.cargo + this.c2 !.cargo,
							}
							token.add(this.c0, this.c1 !, this.c2 !)
							this.advance(3)
							while(!Char.eq('}', this.c0)) {
								sequence.cargo += this.c0.cargo
								if (Char.inc(TokenNumber.DIGITS_HEX, this.c0)) {
									token.add(this.c0)
									this.advance()
								} else {
									throw new Error(`Invalid escape sequence: \`${sequence.cargo}\` at line ${sequence.line} col ${sequence.col}.`)
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
						} else { // a backslash is used, but it has no function
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
				this.advance(TokenString.CHARS_LITERAL_DELIM.length)
			} else if (Char.eq(TokenString.CHARS_TEMPLATE_DELIM, this.c0) || Char.eq(TokenString.CHARS_TEMPLATE_INTERP_END, this.c0, this.c1)) {
				token = new TokenString(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done) {
					if (Char.eq(ETX, this.c0)) throw new Error('Found end of file before end of string')
					if (Char.eq('\\' + TokenString.CHARS_TEMPLATE_DELIM, this.c0, this.c1)) { // we found an escaped string delimiter
						token.add(this.c0, this.c1 !)
						this.advance(2)
						continue;
					}
					if (Char.eq(TokenString.CHARS_TEMPLATE_INTERP_START, this.c0, this.c1)) {
						// add interpolation delim to token, end the token
						token.add(this.c0, this.c1 !)
						this.advance(TokenString.CHARS_TEMPLATE_INTERP_START.length)
						break;
					}
					if (Char.eq(TokenString.CHARS_TEMPLATE_DELIM, this.c0)) {
						// add ending delim to token
						token.add(this.c0)
						this.advance(TokenString.CHARS_TEMPLATE_DELIM.length)
						break;
					}
					token.add(this.c0)
					this.advance()
				}
			} else if (Char.inc(TokenNumber.CHARS, this.c0)) {
				token = new TokenNumber(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && Char.inc(TokenNumber.CHARS, this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (Char.inc(TokenWord.CHARS_START, this.c0)) {
				token = new TokenWord(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && Char.inc(TokenWord.CHARS_REST, this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (Char.inc(TokenPunctuator.CHARS_3, this.c0, this.c1, this.c2)) {
				token = new TokenPunctuator(this.iterator_result_char.value, this.c1 !, this.c2 !)
				this.advance(3)
			} else if (Char.inc(TokenPunctuator.CHARS_2, this.c0, this.c1)) {
				token = new TokenPunctuator(this.iterator_result_char.value, this.c1 !)
				this.advance(2)
			} else if (Char.inc(TokenPunctuator.CHARS_1, this.c0)) {
				token = new TokenPunctuator(this.iterator_result_char.value)
				this.advance()
			} else {
				throw new Error(`I found a character or symbol that I do not recognize:
${this.c0} on ${this.iterator_result_char.value.line_index + 1}:${this.iterator_result_char.value.col_index + 1}.`)
			}
			this.state_newline = false
			yield token
		}
	}
}
