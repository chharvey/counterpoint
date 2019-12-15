import Scanner, {Char, ETX} from './Scanner.class'
import Token, {
	TokenFilebound,
	TokenWhitespace,
	TokenCommentLine,
	TokenCommentMulti,
	TokenCommentMultiNest,
	TokenCommentDoc,
	TokenStringLiteral,
	TokenStringTemplate,
	TokenNumber,
	TokenWord,
	TokenPunctuator,
} from './Token.class'

import {LexError01} from '../error/LexError.class'


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
	private _c0: Char;
	/** The lookahead(1) character. */
	private _c1: Char|null;
	/** The lookahead(2) character. */
	private _c2: Char|null;
	/** The lookahead(3) character. */
	private _c3: Char|null;

	/**
	 * Construct a new Lexer object.
	 * @param   source_text - the entire source text
	 */
	constructor(source_text: string) {
		this.scanner = new Scanner(source_text).generate()
		this.iterator_result_char = this.scanner.next()

		this._c0 = this.iterator_result_char.value
		this._c1 = this._c0.lookahead()
		this._c2 = this._c0.lookahead(2)
		this._c3 = this._c0.lookahead(3)
	}

	get c0(): Char      { return this._c0 }
	get c1(): Char|null { return this._c1 }
	get c2(): Char|null { return this._c2 }
	get c3(): Char|null { return this._c3 }
	get isDone(): boolean { return !!this.iterator_result_char.done }

	/**
	 * Advance this Lexer, scanning the next character and reassigning variables.
	 * @param   n - the number of times to advance
	 * @throws  {RangeError} if the argument is not a positive integer
	 */
	private advance(n: number /* bigint */ = 1): void {
		if (n % 1 !== 0 || n <= 0) throw new RangeError('Argument must be a positive integer.')
		if (n === 1) {
			this.iterator_result_char = this.scanner.next()
			if (!this.iterator_result_char.done) {
				this._c0 = this.iterator_result_char.value
				this._c1 = this._c0.lookahead()
				this._c2 = this._c0.lookahead(2)
				this._c3 = this._c0.lookahead(3)
			}
		} else {
			this.advance(n - 1)
			this.advance()
		}
	}
	private lexFilebound(): TokenFilebound {
		const token: TokenFilebound = new TokenFilebound(this._c0)
		this.advance()
		return token
	}
	private lexWhitespace(): TokenWhitespace {
		const token: TokenWhitespace = new TokenWhitespace(this._c0)
		this.advance()
		while (!this.iterator_result_char.done && Char.inc(TokenWhitespace.CHARS, this._c0)) {
			token.add(this._c0)
			this.advance()
		}
		return token
	}
	private lexCommentLine(): TokenCommentLine {
		const token: TokenCommentLine = new TokenCommentLine(this._c0)
		this.advance(TokenCommentLine.DELIM.length)
		while (!this.iterator_result_char.done && !Char.eq('\n', this._c0)) {
			if (Char.eq(ETX, this._c0)) throw new Error('Found end of file before end of comment')
			token.add(this._c0)
			this.advance()
		}
		// do not add '\n' to token
		return token
	}
	private lexCommentMulti(): TokenCommentMulti {
		const token: TokenCommentMulti = new TokenCommentMulti(this._c0)
		this.advance()
		while (!this.iterator_result_char.done && !Char.eq(TokenCommentMulti.DELIM_END, this._c0)) {
			if (Char.eq(ETX, this._c0)) throw new Error('Found end of file before end of comment')
			token.add(this._c0)
			this.advance()
		}
		// add ending delim to token
		token.add(this._c0)
		this.advance(TokenCommentMulti.DELIM_END.length)
		return token
	}
	private lexCommentMultiNest(): TokenCommentMultiNest {
		const token: TokenCommentMultiNest = new TokenCommentMultiNest(this._c0, this._c1 !)
		this.advance(TokenCommentMultiNest.DELIM_START.length)
		this.comment_multiline_level++;
		while (this.comment_multiline_level !== 0) {
			while (!this.iterator_result_char.done && !Char.eq(TokenCommentMultiNest.DELIM_END, this._c0, this._c1)) {
				if (Char.eq(ETX, this._c0)) throw new Error('Found end of file before end of comment')
				if (Char.eq(TokenCommentMultiNest.DELIM_START, this._c0, this._c1)) {
					token.add(this._c0, this._c1 !)
					this.advance(TokenCommentMultiNest.DELIM_START.length)
					this.comment_multiline_level++;
				} else {
					token.add(this._c0)
					this.advance()
				}
			}
			// add ending delim to token
			token.add(this._c0, this._c1 !)
			this.advance(TokenCommentMultiNest.DELIM_END.length)
			this.comment_multiline_level--;
		}
		return token
	}
	private lexCommentDoc(): TokenCommentDoc {
		const token: TokenCommentDoc = new TokenCommentDoc(this._c0, this._c1 !, this._c2 !, this._c3 !)
		this.advance((TokenCommentDoc.DELIM_START + '\n').length)
		while (!this.iterator_result_char.done) {
			if (Char.eq(ETX, this._c0)) throw new Error('Found end of file before end of comment')
			if (
				!Char.eq(TokenCommentDoc.DELIM_END + '\n', this._c0, this._c1, this._c2, this._c3) ||
				token.source.slice(token.source.lastIndexOf('\n') + 1).trim() !== '' // the tail end of the token does not match `/\n(\s)*/` (a newline followed by whitespace)
			) {
				token.add(this._c0)
				this.advance()
			} else {
				break;
			}
		}
		// add ending delim to token
		token.add(this._c0, this._c1 !, this._c2 !)
		this.advance(TokenCommentDoc.DELIM_END.length)
		return token
	}
	private lexStringLiteral(): TokenStringLiteral {
		const token: TokenStringLiteral = new TokenStringLiteral(this._c0)
		this.advance()
		while (!this.iterator_result_char.done && !Char.eq(TokenStringLiteral.DELIM, this._c0)) {
			if (Char.eq(ETX, this._c0)) throw new Error('Found end of file before end of string')
			if (Char.eq('\\', this._c0)) { // possible escape or line continuation
				if (Char.inc([TokenStringLiteral.DELIM, '\\', 's','t','n','r'], this._c1)) { // an escaped character literal
					token.add(this._c0, this._c1 !)
					this.advance(2)
				} else if (Char.eq('u{', this._c1, this._c2)) { // an escape sequence
					const line : number = this._c0.line_index + 1
					const col  : number = this._c0.col_index  + 1
					let cargo  : string = this._c0.source + this._c1 !.source + this._c2 !.source
					token.add(this._c0, this._c1 !, this._c2 !)
					this.advance(3)
					while(!Char.eq('}', this._c0)) {
						cargo += this._c0.source
						if (!Char.inc(TokenNumber.DIGITS.get(16) !, this._c0)) {
							throw new Error(`Invalid escape sequence: \`${cargo}\` at line ${line} col ${col}.`)
						}
						token.add(this._c0)
						this.advance()
					}
					token.add(this._c0)
					this.advance()
				} else if (Char.eq('\n', this._c1)) { // a line continuation (LF)
					token.add(this._c0, this._c1 !)
					this.advance(2)
				} else if (Char.eq('\r\n', this._c1, this._c2)) { // a line continuation (CRLF)
					token.add(this._c0, this._c1 !, this._c2 !)
					this.advance(3)
				} else { // a backslash escapes the following character
					token.add(this._c0)
					this.advance()
				}
			} else {
				token.add(this._c0)
				this.advance()
			}
		}
		// add ending delim to token
		token.add(this._c0)
		this.advance(TokenStringLiteral.DELIM.length)
		return token
	}
	private lexStringTemplate(): TokenStringTemplate {
		const token: TokenStringTemplate = new TokenStringTemplate(this._c0)
		this.advance()
		while (!this.iterator_result_char.done) {
			if (Char.eq(ETX, this._c0)) throw new Error('Found end of file before end of string')
			if (Char.eq('\\' + TokenStringTemplate.DELIM, this._c0, this._c1)) { // an escaped template delimiter
				token.add(this._c0, this._c1 !)
				this.advance(2)
			} else if (Char.eq(TokenStringTemplate.DELIM_INTERP_START, this._c0, this._c1)) { // end string template head/middle
				// add start interpolation delim to token
				token.add(this._c0, this._c1 !)
				this.advance(TokenStringTemplate.DELIM_INTERP_START.length)
				break;
			} else if (Char.eq(TokenStringTemplate.DELIM, this._c0)) { // end string template full/tail
				// add ending delim to token
				token.add(this._c0)
				this.advance(TokenStringTemplate.DELIM.length)
				break;
			} else {
				token.add(this._c0)
				this.advance()
			}
		}
		return token
	}
	private lexNumber(radix?: number /* TODO bigint */): TokenNumber {
		const r: number = radix || TokenNumber.RADIX_DEFAULT // do not use default parameter because of the if-else below
		const digits: readonly string[] = TokenNumber.DIGITS.get(r) !
		const line  : number = this._c0.line_index + 1
		const col   : number = this._c0.col_index  + 1
		let cargo   : string = this._c0.source
		let token: TokenNumber;
		if (typeof radix === 'number') {
			cargo += this._c1 !.source
			if (!Char.inc(digits, this._c2)) {
				throw new Error(`Invalid escape sequence: \`${cargo}\` at line ${line} col ${col}.`)
			}
			cargo += this._c2 !.source
			token = new TokenNumber(r, this._c0, this._c1 !, this._c2 !)
			this.advance(3)
		} else {
			token = new TokenNumber(r, this._c0)
			this.advance()
		}
		while (Char.inc([...digits, TokenNumber.SEPARATOR], this._c0)) {
			if (Char.inc(digits, this._c0)) {
				cargo += this._c0.source
				token.add(this._c0)
				this.advance()
			} else if (Char.eq(TokenNumber.SEPARATOR, this._c0)) {
				if (Char.inc(digits, this._c1)) {
					cargo += this._c0.source + this._c1 !.source
					token.add(this._c0, this._c1 !)
					this.advance(2)
				} else if (Char.eq(TokenNumber.SEPARATOR, this._c1)) {
					throw new Error(`Adjacent numeric separators not allowed at line ${this._c1 !.line_index+1} col ${this._c1 !.col_index+1}.`)
				} else {
					throw new Error(`Numeric separator not allowed at end of numeric literal \`${cargo}\` at line ${line} col ${col}.`)
				}
			}
		}
		return token
	}
	private lexWord(): TokenWord {
		const token: TokenWord = new TokenWord(this._c0)
		this.advance()
		while (!this.iterator_result_char.done && Char.inc(TokenWord.CHARS_REST, this._c0)) {
			token.add(this._c0)
			this.advance()
		}
		return token
	}

	/**
	 * Construct and return the next token in the source text.
	 * @returns the next token
	 * @throws  {LexError01} if an unrecognized character was reached
	 */
	* generate(): Iterator<Token> {
		while (!this.iterator_result_char.done) {
			let token: Token;
			if (Char.inc(TokenFilebound.CHARS, this._c0)) {
				token = this.lexFilebound()
			} else if (Char.inc(TokenWhitespace.CHARS, this._c0)) {
				token = this.lexWhitespace()
			} else if (Char.eq('\\', this._c0)) { // we found a line comment or an integer literal with a radix
				if (Char.inc([...TokenNumber.BASES.keys()], this._c1)) {
					token = this.lexNumber(TokenNumber.BASES.get(this._c1 !.source) !)
				} else {
					token = this.lexCommentLine()
				}
			} else if (Char.eq('"', this._c0)) { // we found the start of a doc comment or multiline comment
				if (this.state_newline && Char.eq(TokenCommentDoc.DELIM_START + '\n', this._c0, this._c1, this._c2, this._c3)) {
					token = this.lexCommentDoc()
				} else if (Char.eq(TokenCommentMultiNest.DELIM_START, this._c0, this._c1)) {
					token = this.lexCommentMultiNest()
				} else {
					token = this.lexCommentMulti()
				}
			} else if (Char.eq(TokenStringLiteral.DELIM, this._c0)) {
				token = this.lexStringLiteral()
			} else if (Char.eq(TokenStringTemplate.DELIM, this._c0) || Char.eq(TokenStringTemplate.DELIM_INTERP_END, this._c0, this._c1)) {
				token = this.lexStringTemplate()
			} else if (Char.inc(TokenNumber.DIGITS.get(TokenNumber.RADIX_DEFAULT) !, this._c0)) {
				token = this.lexNumber()
			} else if (Char.inc(TokenWord.CHARS_START, this._c0)) {
				token = this.lexWord()
			} else if (Char.inc(TokenPunctuator.CHARS_3, this._c0, this._c1, this._c2)) {
				token = new TokenPunctuator(this._c0, this._c1 !, this._c2 !)
				this.advance(3)
			} else if (Char.inc(TokenPunctuator.CHARS_2, this._c0, this._c1)) {
				token = new TokenPunctuator(this._c0, this._c1 !)
				this.advance(2)
			} else if (Char.inc(TokenPunctuator.CHARS_1, this._c0)) {
				token = new TokenPunctuator(this._c0)
				this.advance()
			} else {
				throw new LexError01(this._c0.toString(), this._c0.line_index, this._c0.col_index)
			}
			this.state_newline = token instanceof TokenWhitespace && [...token.source].includes('\n')
			yield token
		}
	}
}
