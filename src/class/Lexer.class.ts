import Scanner, {Char} from './Scanner.class'
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
import {
	TerminalFilebound,
	TerminalWhitespace,
	TerminalComment,
	TerminalStringLiteral,
	TerminalStringTemplateFull,
	TerminalNumber,
	TerminalWord,
	TerminalPunctuator,
} from './Terminal.class'

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
	advance(n: number /* bigint */ = 1): void {
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

	/**
	 * Construct and return the next token in the source text.
	 * @returns the next token
	 * @throws  {LexError01} if an unrecognized character was reached
	 */
	* generate(): Iterator<Token> {
		while (!this.iterator_result_char.done) {
			let token: Token;
			if (Char.inc(TokenFilebound.CHARS, this._c0)) {
				token = TerminalFilebound.instance.lex(this)
			} else if (Char.inc(TokenWhitespace.CHARS, this._c0)) {
				token = TerminalWhitespace.instance.lex(this)
			} else if (Char.eq('\\', this._c0)) { // we found a line comment or an integer literal with a radix
				if (Char.inc([...TokenNumber.BASES.keys()], this._c1)) {
					token = TerminalNumber.instance.lex(this, TokenNumber.BASES.get(this._c1 !.source) !)
				} else {
					token = TerminalComment.instance.lex(this, TokenCommentLine)
				}
			} else if (Char.eq('"', this._c0)) { // we found the start of a doc comment or multiline comment
				if (this.state_newline && Char.eq(TokenCommentDoc.DELIM_START + '\n', this._c0, this._c1, this._c2, this._c3)) {
					token = TerminalComment.instance.lex(this, TokenCommentDoc)
				} else if (Char.eq(TokenCommentMultiNest.DELIM_START, this._c0, this._c1)) {
					token = TerminalComment.instance.lex(this, TokenCommentMultiNest)
				} else {
					token = TerminalComment.instance.lex(this, TokenCommentMulti)
				}
			} else if (Char.eq(TokenStringLiteral.DELIM, this._c0)) {
				token = TerminalStringLiteral.instance.lex(this)
			} else if (Char.eq(TokenStringTemplate.DELIM, this._c0)) {
				// we found a template full or template head
				token = TerminalStringTemplateFull.instance.lex(this, true)

			} else if (Char.eq(TokenStringTemplate.DELIM_INTERP_END, this._c0, this._c1)) {
				// we found a template middle or template tail
				token = TerminalStringTemplateFull.instance.lex(this, false)

			} else if (Char.inc(TokenNumber.DIGITS.get(TokenNumber.RADIX_DEFAULT) !, this._c0)) {
				token = TerminalNumber.instance.lex(this)
			} else if (Char.inc(TokenWord.CHARS_START, this._c0)) {
				token = TerminalWord.instance.lex(this)
			} else if (Char.inc(TokenPunctuator.CHARS_3, this._c0, this._c1, this._c2)) {
				token = TerminalPunctuator.instance.lex(this, 3)
			} else if (Char.inc(TokenPunctuator.CHARS_2, this._c0, this._c1)) {
				token = TerminalPunctuator.instance.lex(this, 2)
			} else if (Char.inc(TokenPunctuator.CHARS_1, this._c0)) {
				token = TerminalPunctuator.instance.lex(this)
			} else {
				throw new LexError01(this._c0.toString(), this._c0.line_index, this._c0.col_index)
			}
			this.state_newline = token instanceof TokenWhitespace && [...token.source].includes('\n')
			yield token
		}
	}
}
