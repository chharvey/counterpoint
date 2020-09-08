import type SolidConfig from '../SolidConfig'

import Dev from '../class/Dev.class'
import Token, {
	TokenWhitespace,
	TokenIdentifier,
	TokenComment,
} from './Token.class'
import type {Parser} from '../parser/'



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
	/** The result of the lexer iterator. */
	private iterator_result_token: IteratorResult<Token, void>;
	/** The current token. */
	private t0: Token|void;
	/** A set of all unique identifiers in the program. */
	private _ids: Set<string> = new Set()

	/**
	 * Construct a new Screener object.
	 * @param tokengenerator - A token generator produced by a Lexer.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		private readonly tokengenerator: Generator<Token>,
		private readonly config: SolidConfig,
	) {
		this.iterator_result_token = this.tokengenerator.next()
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
			this.iterator_result_token = this.tokengenerator.next()
			this.t0 = this.iterator_result_token.value
		}
	}

	/**
	 * Construct a new Parser object from this Screener.
	 * @return a new Parser with this Screener as its argument
	 */
	get parser(): Parser {
		const Parser_class: typeof Parser = require('../parser/').Parser
		return new Parser_class(this.generate(), this.config)
	}
}
