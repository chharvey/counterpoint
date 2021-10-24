import {
	Char,
	LexError01,
	LexError02,
} from '@chharvey/parser';
import type {NonemptyArray} from './package.js';
import {Filebound} from './utils-public.js';
import {
	Token,
	TokenFilebound,
	TokenWhitespace,
} from './token/index.js';
import {Scanner} from './Scanner.js';



/**
 * A Lexer (aka: Tokenizer, Lexical Analyzer).
 * @see http://parsingintro.sourceforge.net/#contents_item_6.5
 */
export class Lexer {
	/** A character generator produced by a Scanner. */
	private char_generator?: Generator<Char>;
	/** The result of the scanner iterator. */
	private iterator_result_char?: IteratorResult<Char, void>;
	/** The current character. */
	private _c0?: Char;
	/** The lookahead(1) character. */
	private _c1: Char | null = null;
	/** The lookahead(2) character. */
	private _c2: Char | null = null;
	/** The lookahead(3) character. */
	private _c3: Char | null = null;

	/**
	 * Construct a new Lexer object.
	 */
	constructor () {
	}

	/** @final */ get c0(): Char        { return this._c0!; }
	/** @final */ get c1(): Char | null { return this._c1; }
	/** @final */ get c2(): Char | null { return this._c2; }
	/** @final */ get c3(): Char | null { return this._c3; }
	/** @final */ get isDone(): boolean { return !!this.iterator_result_char?.done; }

	/**
	 * Advance this Lexer, scanning the next character and reassigning variables.
	 * @param   n the number of times to advance
	 * @returns   all the characters scanned since the last advance
	 * @throws    {RangeError} if the argument is not a positive integer
	 * @final
	 */
	protected advance(n?: 1n): [Char];
	protected advance(n: bigint): NonemptyArray<Char>;
	protected advance(n: bigint = 1n): NonemptyArray<Char> {
		if (n <= 0n) { throw new RangeError('Argument must be a positive integer.'); };
		if (n === 1n) {
			const returned: Char = this._c0!;
			this.iterator_result_char = this.char_generator!.next();
			if (!this.iterator_result_char.done) {
				this._c0 = this.iterator_result_char.value;
				this._c1 = this._c0.lookahead();
				this._c2 = this._c0.lookahead(2n);
				this._c3 = this._c0.lookahead(3n);
			};
			return [returned];
		} else {
			return [
				...this.advance(),
				...this.advance(n - 1n),
			] as [Char, ...Char[]];
		};
	}

	/**
	 * Construct and return the next token in the source text.
	 * @param source the source text
	 * @returns the next token
	 * @throws  {LexError01} if an unrecognized character was reached
	 * @final
	 */
	* generate(source: string): Generator<Token> {
		this.char_generator = Scanner.generate(source);
		this.iterator_result_char = this.char_generator.next();
		this._c0 = this.iterator_result_char.value as Char;
		this._c1 = this._c0.lookahead();
		this._c2 = this._c0.lookahead(2n);
		this._c3 = this._c0.lookahead(3n);
		while (!this.isDone) {
			if (Char.inc(TokenFilebound.CHARS, this.c0)) {
				yield new TokenFilebound(...this.advance());

			} else if (Char.inc(TokenWhitespace.CHARS, this.c0)) {
				const buffer: NonemptyArray<Char> = [...this.advance()];
				while (!this.isDone && Char.inc(TokenWhitespace.CHARS, this.c0)) {
					buffer.push(...this.advance());
				};
				yield new TokenWhitespace(...buffer);

			} else {
				yield this.generate_do() || (() => { throw new LexError01(this.c0); })();
			};
		};
	}
	protected generate_do(): Token | null {
		return null;
	}

	/**
	 * Lex a quoted token.
	 * @param start_delim   the delimiter that starts the token (e.g., an open-quote)
	 * @param end_delim     the delimiter that ends the token (e.g., a close-quote)
	 * @returns             the characters from which to construct a new Token
	 * @final
	 */
	protected lexQuoted(start_delim: string, end_delim: string = start_delim): NonemptyArray<Char> {
		const buffer: NonemptyArray<Char> = [...this.advance(BigInt(start_delim.length))];
		function stopAdvancing(lexer: Lexer): boolean {
			return Char.eq(end_delim, lexer.c0, ...(end_delim.length >= 2 ? [
				lexer.c1,
				...(end_delim.length >= 3 ? [
					lexer.c2,
					...(end_delim.length >= 4 ? [lexer.c3] : []),
				] : []),
			] : []));
		}
		while (!this.isDone && !stopAdvancing(this)) {
			if (Char.eq(Filebound.EOT, this.c0)) {
				// @ts-expect-error
				throw new LexError02(new Token('QUOTED', ...buffer));
			};
			buffer.push(...this.advance());
		};
		buffer.push(...this.advance(BigInt(end_delim.length))); // add end delim to token
		return buffer;
	}
}
