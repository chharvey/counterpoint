import Scanner, {Char} from './Scanner.class'
import Token, {
	TokenWhitespace,
	TokenFilebound,
	TokenNumber,
	TokenWord,
	TokenPunctuator,
} from './Token.class'

import {LexError01} from '../error/LexError.class'


/**
 * A lexer (aka: Tokenizer, Lexical Analyzer)
 * @see http://parsingintro.sourceforge.net/#contents_item_6.5
 */
export default class Lexer {
	/** The scanner returning characters for each iteration. */
	private readonly scanner: Iterator<Char>;
	/** The result of the scanner iterator. */
	private iterator_result_char: IteratorResult<Char>;

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
	private advance(n: number = 1): void {
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
	 * @throws  {LexError01} if an unrecognized character was reached
	 */
	* generate(): Iterator<Token> {
		while (!this.iterator_result_char.done) {
			if (TokenWhitespace.CHARACTERS.includes(this.c0)) {
				const wstoken: TokenWhitespace = new TokenWhitespace(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenWhitespace.CHARACTERS.includes(this.c0)) {
					wstoken.add(this.c0)
					this.advance()
				}
				// yield wstoken // only if we want the lexer to return whitespace
				continue;
			}

			let token: Token;
			if (TokenFilebound.CHARACTERS.includes(this.c0)) {
				token = new TokenFilebound(this.iterator_result_char.value)
				this.advance()
			} else if (TokenNumber.CHARACTERS.includes(this.c0)) {
				token = new TokenNumber(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenNumber.CHARACTERS.includes(this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (TokenWord.CHARACTERS_START.includes(this.c0)) {
				token = new TokenWord(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenWord.CHARACTERS_REST.includes(this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (TokenPunctuator.CHARACTERS_1.includes(this.c0)) {
				token = new TokenPunctuator(this.iterator_result_char.value)
				let first_char: string = this.c0
				this.advance() // read past the first character
				// TODO clean this up when we get to multi-char punctuators
				if (TokenPunctuator.CHARACTERS_2.includes(first_char + this.c0)) {
					token.add(this.c0)
					let second_char: string = this.c0
					this.advance() // read past the second character
					if (TokenPunctuator.CHARACTERS_3.includes(first_char + second_char + this.c0)) {
						token.add(this.c0)
						this.advance() // read past the third character
					}
				}
			} else {
				throw new LexError01(this.c0, this.iterator_result_char.value.line_index, this.iterator_result_char.value.col_index)
			}
			yield token
		}
	}
}
