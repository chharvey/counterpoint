import type SolidConfig from '../SolidConfig.d'

import Scanner from './Scanner.class'
import Char from './Char.class'
import Token, {
	Punctuator,
	TokenFilebound,
	TokenWhitespace,
	TokenPunctuator,
	TokenKeyword,
	TokenIdentifierBasic,
	TokenIdentifierUnicode,
	TokenNumber,
	TokenString,
	TokenTemplate,
	TokenCommentLine,
	TokenCommentMulti,
	TokenCommentBlock,
} from './Token.class'

import {
	LexError01,
	LexError03,
} from '../error/LexError.class'



/**
 * A Lexer (aka: Tokenizer, Lexical Analyzer).
 * @see http://parsingintro.sourceforge.net/#contents_item_6.5
 */
export default class Lexer {
	private static readonly PUNCTUATORS_3: readonly Punctuator[] = TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 3)
	private static readonly PUNCTUATORS_2: readonly Punctuator[] = TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 2)
	private static readonly PUNCTUATORS_1: readonly Punctuator[] = TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 1)
	private static readonly BASES_KEYS: readonly string[] = [...TokenNumber.BASES.keys()]
	private static readonly DIGITS_DEFAULT: readonly string[] = TokenNumber.DIGITS.get(TokenNumber.RADIX_DEFAULT)!


	/** The scanner returning characters for each iteration. */
	private readonly scanner: IterableIterator<Char>;
	/** The result of the scanner iterator. */
	private iterator_result_char: IteratorResult<Char, void>;
	/** Did this Lexer just pass a token that contains `\n`? */
	private state_newline: boolean = false
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
	 * @param source - the entire source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		source: string,
		readonly config: SolidConfig,
	) {
		this.scanner = new Scanner(source).generate()
		this.iterator_result_char = this.scanner.next()

		this._c0 = this.iterator_result_char.value as Char
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
	 * @returns all the characters scanned since the last advance
	 * @throws  {RangeError} if the argument is not a positive integer
	 */
	advance(n?: 1n): [Char];
	advance(n: bigint): [Char, ...Char[]];
	advance(n: bigint = 1n): [Char, ...Char[]] {
		if (n <= 0n) throw new RangeError('Argument must be a positive integer.')
		if (n === 1n) {
			const returned: Char = this._c0
			this.iterator_result_char = this.scanner.next()
			if (!this.iterator_result_char.done) {
				this._c0 = this.iterator_result_char.value
				this._c1 = this._c0.lookahead()
				this._c2 = this._c0.lookahead(2)
				this._c3 = this._c0.lookahead(3)
			}
			return [returned]
		} else {
			return [
				...this.advance(),
				...this.advance(n - 1n),
			] as [Char, ...Char[]]
		}
	}

	/**
	 * Construct and return the next token in the source text.
	 * @returns the next token
	 * @throws  {LexError01} if an unrecognized character was reached
	 */
	* generate(): IterableIterator<Token> {
		while (!this.iterator_result_char.done) {
			let token: Token;
			if (Char.inc(TokenFilebound.CHARS, this._c0)) {
				token = new TokenFilebound(this)

			} else if (Char.inc(TokenWhitespace.CHARS, this._c0)) {
				token = new TokenWhitespace(this)

			} else if (Char.inc(Lexer.PUNCTUATORS_3, this._c0, this._c1, this._c2)) {
				token = new TokenPunctuator(this, 3n)
			} else if (Char.inc(Lexer.PUNCTUATORS_2, this._c0, this._c1)) {
				token = new TokenPunctuator(this, 2n)
			} else if (Char.inc(Lexer.PUNCTUATORS_1, this._c0)) {
				/* we found a punctuator or a number literal prefixed with a unary operator */
				if (Char.inc(TokenNumber.UNARY, this._c0)) {
					if (Char.inc(Lexer.DIGITS_DEFAULT, this._c1)) {
						/* a number literal with a unary operator and without an explicit radix */
						token = new TokenNumber(this, true)
					} else if (Char.eq(TokenNumber.ESCAPER, this._c1)) {
						if (Char.inc(Lexer.BASES_KEYS, this._c2)) {
							/* a number literal with a unary operator and with an explicit radix */
							token = new TokenNumber(this, true, true)
						} else {
							throw new LexError03(`${this._c0.source}${this._c1 && this._c1.source || ''}${this._c2 && this._c2.source || ''}`, this._c0.line_index, this._c0.col_index)
						}
					} else {
						/* a punctuator "+" or "-" */
						token = new TokenPunctuator(this)
					}
				} else {
					/* a different punctuator */
					token = new TokenPunctuator(this)
				}

			} else if (TokenKeyword.CHAR.test(this._c0.source)) {
				/* we found a keyword or a basic identifier */
				const buffer: Char[] = [this.c0]
				this.advance()
				while (!this.isDone && TokenIdentifierBasic.CHAR_REST.test(this._c0.source)) {
					buffer.push(this._c0)
					this.advance()
				}
				const bufferstring: string = buffer.map((char) => char.source).join('')
				token = ((TokenKeyword.KEYWORDS as string[]).includes(bufferstring))
					? new TokenKeyword        (this, buffer[0], ...buffer.slice(1))
					: new TokenIdentifierBasic(this, buffer[0], ...buffer.slice(1))
			} else if (TokenIdentifierBasic.CHAR_START.test(this._c0.source)) {
				/* we found a basic identifier */
				token = new TokenIdentifierBasic(this)
			} else if (Char.eq(TokenIdentifierUnicode.DELIM, this._c0)) {
				/* we found a unicode identifier */
				token = new TokenIdentifierUnicode(this)

			} else if (Char.inc(Lexer.DIGITS_DEFAULT, this._c0)) {
				/* a number literal without a unary operator and without an explicit radix */
				token = new TokenNumber(this, false)
			} else if (Char.eq(TokenNumber.ESCAPER, this._c0)) {
				if (Char.inc(Lexer.BASES_KEYS, this._c1)) {
					/* a number literal without a unary operator and with an explicit radix */
					token = new TokenNumber(this, false, true)
				} else {
					throw new LexError03(`${this._c0.source}${this._c1 && this._c1.source || ''}`, this._c0.line_index, this._c0.col_index)
				}

			} else if (Char.eq(TokenString.DELIM, this._c0)) {
				/* we found a string literal or a template literal full or head */
				if (Char.eq(TokenTemplate.DELIM, this._c0, this._c1, this._c2)) {
					token = new TokenTemplate(this, TokenTemplate.DELIM)
				} else {
					token = new TokenString(this)
				}
			} else if (Char.eq(TokenTemplate.DELIM_INTERP_END, this._c0, this._c1)) {
				/* we found a template literal middle or tail */
				token = new TokenTemplate(this, TokenTemplate.DELIM_INTERP_END)

			} else if (this.config.features.comments && Char.eq(TokenCommentLine.DELIM, this._c0)) {
				/* we found either a line comment or a block comment */
				if (this.state_newline && Char.eq(`${TokenCommentBlock.DELIM_START}\n`, this._c0, this._c1, this._c2, this._c3)) {
					token = new TokenCommentBlock(this)
				} else {
					token = new TokenCommentLine(this)
				}
			} else if (this.config.features.comments && Char.eq(TokenCommentMulti.DELIM_START, this._c0, this._c1)) {
				/* we found a multiline comment */
				token = new TokenCommentMulti(this)

			} else {
				throw new LexError01(this._c0)
			}
			this.state_newline = token instanceof TokenWhitespace && [...token.source].includes('\n')
			yield token
		}
	}
}
