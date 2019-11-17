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
	 */
	constructor(
		private readonly tagname: string,
		start_char: Char,
	) {
		this._cargo     = start_char.cargo
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
	 * @param cargo the string to append
	 */
	add(cargo: string): void {
		this._cargo += cargo
	}

	/**
	 * @implements Serializable
	 */
	serialize(...attrs: string[]): string {
		const tagname: string = this.tagname
		const attributes: string = (this.cargo !== STX && this.cargo !== ETX) ? ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
			...attrs
		].join(' ').trim() : ''
		const contents: string = new Map<string, string>([
			[STX, '\u2402' /* SYMBOL FOR START OF TEXT */],
			[ETX, '\u2403' /* SYMBOL FOR END OF TEXT   */],
		]).get(this.cargo) || this.cargo
		return `<${tagname}${attributes}>${contents}</${tagname}>`
	}
}
export class TokenFilebound extends Token {
	static readonly TAGNAME: string = 'FILEBOUND'
	static readonly CHARS: readonly string[] = [STX, ETX]
	constructor(start_char: Char) {
		super(TokenFilebound.TAGNAME, start_char)
	}
}
export class TokenWhitespace extends Token {
	static readonly TAGNAME: string = 'WHITESPACE'
	static readonly CHARS: readonly string[] = [' ', '\t', '\n', '\r']
	constructor(start_char: Char) {
		super(TokenWhitespace.TAGNAME, start_char)
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
	) {
		super(TokenComment.TAGNAME, start_char)
	}
	serialize(): string {
		return super.serialize(this.kind ? `kind="${this.kind}"` : '')
	}
}
class TokenCommentLine      extends TokenComment { constructor(start_char: Char) { super('LINE'       , start_char) } }
class TokenCommentMulti     extends TokenComment { constructor(start_char: Char) { super('MULTI'      , start_char) } }
class TokenCommentMultiNest extends TokenComment { constructor(start_char: Char) { super('MULTI_NEST' , start_char) } }
class TokenCommentDoc       extends TokenComment { constructor(start_char: Char) { super('DOC'        , start_char) } }
export class TokenString extends Token {
	static readonly TAGNAME: string = 'STRING'
	static readonly CHARS_LITERAL_DELIM        : '\'' = `'`
	static readonly CHARS_TEMPLATE_DELIM       : '`'  = '`'
	static readonly CHARS_TEMPLATE_INTERP_START: '{{' = '{{'
	static readonly CHARS_TEMPLATE_INTERP_END  : '}}' = '}}'
	constructor(start_char: Char) {
		super(TokenString.TAGNAME, start_char)
	}
}
export class TokenNumber extends Token {
	static readonly TAGNAME: string = 'NUMBER'
	static readonly CHARS: readonly string[] = '0 1 2 3 4 5 6 7 8 9'.split(' ')
	constructor(start_char: Char) {
		super(TokenNumber.TAGNAME, start_char)
	}
}
export class TokenWord extends Token {
	static readonly TAGNAME: string = 'WORD'
	static readonly CHARS_START: readonly string[] = ''.split(' ')
	static readonly CHARS_REST : readonly string[] = ''.split(' ')
	constructor(start_char: Char) {
		super(TokenWord.TAGNAME, start_char)
	}
}
export class TokenPunctuator extends Token {
	static readonly TAGNAME: string = 'PUNCTUATOR'
	static readonly CHARS_1: readonly string[] = '+ - * / ^ ( )'.split(' ')
	static readonly CHARS_2: readonly string[] = ''.split(' ')
	static readonly CHARS_3: readonly string[] = ''.split(' ')
	constructor(start_char: Char) {
		super(TokenPunctuator.TAGNAME, start_char)
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
	/** How many levels of nested string templates are we in? */
	private template_level: number /* bigint */ = 0

	/** The current character’s cargo. */
	private c0: string;
	/** The lookahead(1) character’s cargo. */
	private c1: string|null;
	/** The lookahead(2) character’s cargo. */
	private c2: string|null;

	/**
	 * Construct a new Lexer object.
	 * @param   source_text - the entire source text
	 */
	constructor(
		private readonly source_text: string,
	) {
		this.scanner = new Scanner(this.source_text).generate()
		this.iterator_result_char = this.scanner.next()

		this.c0 = this.iterator_result_char.value.cargo
		const l1: Char|null = this.iterator_result_char.value.lookahead()
		const l2: Char|null = this.iterator_result_char.value.lookahead(2)
		this.c1 = l1 && l1.cargo
		this.c2 = l2 && l2.cargo
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
				this.c0 = this.iterator_result_char.value.cargo
				const l1 = this.iterator_result_char.value.lookahead()
				const l2 = this.iterator_result_char.value.lookahead(2)
				this.c1 = l1 && l1.cargo
				this.c2 = l2 && l2.cargo
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
			if (TokenWhitespace.CHARS.includes(this.c0)) {
				const wstoken: TokenWhitespace = new TokenWhitespace(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenWhitespace.CHARS.includes(this.c0)) {
					wstoken.add(this.c0)
					this.advance()
				}
				this.state_newline = [...wstoken.cargo].includes('\n')
				// yield wstoken // only if we want the lexer to return whitespace
				continue;
			}

			let token: Token;
			if (TokenFilebound.CHARS.includes(this.c0)) {
				token = new TokenFilebound(this.iterator_result_char.value)
				this.advance()
			} else if (this.c0 + this.c1 + this.c2 === TokenComment.CHARS_LINE) { // we found a line comment
				token = new TokenCommentLine(this.iterator_result_char.value)
				token.add(this.c1 ! + this.c2 !)
				this.advance(TokenComment.CHARS_LINE.length)
				while (!this.iterator_result_char.done && this.c0 !== '\n') {
					if (this.c0 === ETX) throw new Error('Found end of file before end of comment')
					token.add(this.c0)
					this.advance()
				}
				// do not add '\n' to token
			} else if ((this.c0 as string) === '"') { // we found the start of a doc comment or multiline comment
				if (this.state_newline && this.c0 + this.c1 + this.c2 === TokenComment.CHARS_DOC_START) { // we might have found a doc comment
					let l3: Char|null   = this.iterator_result_char.value.lookahead(3)
					let c3: string|null = l3 && l3.cargo
					if (c3 === '\n') { // it is definitely a doc comment
						token = new TokenCommentDoc(this.iterator_result_char.value)
						token.add(this.c1 ! + this.c2 ! + c3)
						this.advance((TokenComment.CHARS_DOC_START + '\n').length)
						while (!this.iterator_result_char.done) {
							if (this.c0 === ETX) throw new Error('Found end of file before end of comment')
							if (this.c0 + this.c1 + this.c2 === TokenComment.CHARS_DOC_END) {
								l3 = this.iterator_result_char.value.lookahead(3)
								c3 = l3 && l3.cargo
								const only_indented: boolean = token.cargo.slice(token.cargo.lastIndexOf('\n') + 1).trim() === ''
								if (c3 === '\n' && only_indented) {
									break;
								}
							}
							token.add(this.c0)
							this.advance()
						}
						// add ending delim to token
						token.add(TokenComment.CHARS_DOC_END)
						this.advance(TokenComment.CHARS_DOC_END.length)
					} else { // it was two multiline comments juxtaposed
						token = new TokenCommentMulti(this.iterator_result_char.value)
						token.add(this.c1 !)
						this.advance(2)
					}
				} else if (this.c0 + this.c1 === TokenComment.CHARS_MULTI_NEST_START) { // we found a nestable multiline comment
					token = new TokenCommentMultiNest(this.iterator_result_char.value)
					token.add(this.c1 !)
					this.advance(TokenComment.CHARS_MULTI_NEST_START.length)
					this.comment_multiline_level++;
					while (this.comment_multiline_level !== 0) {
						while (!this.iterator_result_char.done && this.c0 + this.c1 !== TokenComment.CHARS_MULTI_NEST_END) {
							if (this.c0 === ETX) throw new Error('Found end of file before end of comment')
							if (this.c0 + this.c1 === TokenComment.CHARS_MULTI_NEST_START) {
								token.add(TokenComment.CHARS_MULTI_NEST_START)
								this.advance(TokenComment.CHARS_MULTI_NEST_START.length)
								this.comment_multiline_level++
							} else {
								token.add(this.c0)
								this.advance()
							}
						}
						// add ending delim to token
						token.add(TokenComment.CHARS_MULTI_NEST_END)
						this.advance(TokenComment.CHARS_MULTI_NEST_END.length)
						this.comment_multiline_level--;
					}
				} else { // we found a non-nestable multiline comment
					token = new TokenCommentMulti(this.iterator_result_char.value)
					this.advance()
					while (!this.iterator_result_char.done && this.c0 !== TokenComment.CHARS_MULTI_END) {
						if (this.c0 === ETX) throw new Error('Found end of file before end of comment')
						token.add(this.c0)
						this.advance()
					}
					// add ending delim to token
					token.add(TokenComment.CHARS_MULTI_END)
					this.advance(TokenComment.CHARS_MULTI_END.length)
				}
			} else if ((this.c0 as string) === TokenString.CHARS_LITERAL_DELIM) {
				token = new TokenString(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && this.c0 !== TokenString.CHARS_LITERAL_DELIM) {
					if (this.c0 === ETX) throw new Error('Found end of file before end of string')
					if (this.c0 + this.c1 === '\\' + TokenString.CHARS_LITERAL_DELIM) { // we found an escaped string delimiter
						token.add(this.c0 + this.c1)
						this.advance(2)
						continue;
					}
					token.add(this.c0)
					this.advance()
				}
				// add ending delim to token
				token.add(TokenString.CHARS_LITERAL_DELIM)
				this.advance(TokenString.CHARS_LITERAL_DELIM.length)
			} else if (this.c0 === TokenString.CHARS_TEMPLATE_DELIM || this.c0 + this.c1 === TokenString.CHARS_TEMPLATE_INTERP_END && this.template_level) {
				token = new TokenString(this.iterator_result_char.value)
				this.advance()
				this.template_level++;
				while (!this.iterator_result_char.done) {
					if (this.c0 === ETX) throw new Error('Found end of file before end of string')
					if (this.c0 + this.c1 === '\\' + TokenString.CHARS_TEMPLATE_DELIM) { // we found an escaped string delimiter
						token.add(this.c0 + this.c1)
						this.advance(2)
						continue;
					}
					if (this.c0 + this.c1 === TokenString.CHARS_TEMPLATE_INTERP_START) {
						// add interpolation delim to token, end the token
						token.add(TokenString.CHARS_TEMPLATE_INTERP_START)
						this.advance(TokenString.CHARS_TEMPLATE_INTERP_START.length)
						break;
					}
					if (this.c0 === TokenString.CHARS_TEMPLATE_DELIM) {
						// add ending delim to token
						token.add(TokenString.CHARS_TEMPLATE_DELIM)
						this.advance(TokenString.CHARS_TEMPLATE_DELIM.length)
						this.template_level--;
						break;
					}
					token.add(this.c0)
					this.advance()
				}
			} else if (TokenNumber.CHARS.includes(this.c0)) {
				token = new TokenNumber(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenNumber.CHARS.includes(this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (TokenWord.CHARS_START.includes(this.c0)) {
				token = new TokenWord(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenWord.CHARS_REST.includes(this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (TokenPunctuator.CHARS_1.includes(this.c0)) {
				token = new TokenPunctuator(this.iterator_result_char.value)
				let first_char: string = this.c0
				this.advance() // read past the first character
				// TODO clean this up when we get to multi-char punctuators
				if (TokenPunctuator.CHARS_2.includes(first_char + this.c0)) {
					token.add(this.c0)
					let second_char: string = this.c0
					this.advance() // read past the second character
					if (TokenPunctuator.CHARS_3.includes(first_char + second_char + this.c0)) {
						token.add(this.c0)
						this.advance() // read past the third character
					}
				}
			} else {
				throw new Error(`I found a character or symbol that I do not recognize:
${this.c0} on ${this.iterator_result_char.value.line_index + 1}:${this.iterator_result_char.value.col_index + 1}.`)
			}
			this.state_newline = false
			yield token
		}
	}
}
