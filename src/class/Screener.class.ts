import type SolidConfig from '../SolidConfig.d'

import Dev from './Dev.class'
import Lexer from './Lexer.class'
import Token, {
	TokenWhitespace,
	TokenIdentifier,
	TokenComment,
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
	private readonly lexer: Generator<Token>;
	/** The result of the lexer iterator. */
	private iterator_result_token: IteratorResult<Token, void>;
	/** The current token. */
	private t0: Token|void;
	/** A set of all unique identifiers in the program. */
	private _ids: Set<string> = new Set()

	/**
	 * Construct a new Screener object.
	 * @param source - the entire source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (source: string, config: SolidConfig) {
		this.lexer = new Lexer(source, config).generate()
		this.iterator_result_token = this.lexer.next()
		this.t0 = this.iterator_result_token.value
	}

	/**
	 * Prepare the next token for the parser.
	 * Whitespace and comment tokens are filtered out.
	 * @returns the next token
	 */
	* generate(): Generator<Token> {
		while (!this.iterator_result_token.done) {
			if (!(this.t0 instanceof TokenWhitespace) && !(this.t0 instanceof TokenComment)) {
				if (Dev.supports('variables') && this.t0 instanceof TokenIdentifier) {
					this._ids.add(this.t0.source)
					this.t0.setValue(BigInt([...this._ids].indexOf(this.t0.source)))
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
