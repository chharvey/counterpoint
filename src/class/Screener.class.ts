import Lexer from './Lexer.class'
import {STX, ETX} from './Char.class'
import Token, {
	TokenWhitespace,
	TokenComment,
	TokenWord,
} from './Token.class'



/**
 * A screener prepares the tokens for the parser.
 * It performs certian operations such as
 * - removing whitespace and comment tokens
 * - stripping out compiler directives (“pragmas”) and sending them
 * 	separately to the compiler
 * - computing the mathematical values of numerical constants
 * - computing the string values, including escaping, of string constants (“cooking”)
 * - optimizing identifiers
 */
export default class Screener {
	/** The lexer returning tokens for each iteration. */
	private readonly lexer: Iterator<Token, void>;
	/** The result of the lexer iterator. */
	private iterator_result_token: IteratorResult<Token, void>;
	/** The current token. */
	private t0: Token|void;
	/** A set of all unique identifiers in the program. */
	private _ids: Set<string> = new Set()

	/**
	 * Construct a new Screener object.
	 * @param   source - the entire source text
	 */
	constructor(source: string) {
		this.lexer = new Lexer(source).generate()
		this.iterator_result_token = this.lexer.next()
		this.t0 = this.iterator_result_token.value
	}

	/**
	 * Return a list of unique identifiers in the program,
	 * in the order they appeared.
	 * @returns a list of unique identifiers
	 */
	get identifiers(): string[] {
		return [...this._ids]
	}

	/**
	 * Prepare the next token for the parser.
	 * Whitespace and comment tokens are filtered out.
	 * @returns the next token
	 */
	* generate(): Iterator<Token, void> {
		while (!this.iterator_result_token.done) {
			if (!(this.t0 instanceof TokenWhitespace) && !(this.t0 instanceof TokenComment)) {
				if (this.t0 instanceof TokenWord && this.t0.is_identifier) {
					this._ids.add(this.t0.source)
					this.t0.setValue(this)
				}
				if (this.t0 instanceof Token) {
					yield this.t0
				}
			}
			this.iterator_result_token = this.lexer.next()
			this.t0 = this.iterator_result_token.value
		}
	}
}
