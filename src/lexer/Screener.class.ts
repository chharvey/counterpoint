import type {
	Token,
} from '@chharvey/parser';

import type SolidConfig from '../SolidConfig'

import Dev from '../class/Dev.class'
import {
	TokenSolid,
	TokenWhitespace,
	TokenIdentifier,
	TokenComment,
} from './Token.class'
import type {ParserSolid as Parser} from '../parser/'



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
export abstract class Screener {
	/** The result of the lexer iterator. */
	private iterator_result_token: IteratorResult<Token, void>;
	/** The current token. */
	private _t0: Token;

	/**
	 * Construct a new Screener object.
	 * @param tokengenerator - A token generator produced by a Lexer.
	 */
	constructor (
		private readonly tokengenerator: Generator<Token>,
	) {
		this.iterator_result_token = this.tokengenerator.next()
		this._t0 = this.iterator_result_token.value as Token
	}

	get t0(): Token { return this._t0 }
	get isDone(): boolean { return !!this.iterator_result_token.done }

	/**
	 * Advance this Screener, lexing the next token and reassigning variables.
	 */
	advance(): void {
		this.iterator_result_token = this.tokengenerator.next()
		if (!this.iterator_result_token.done) {
			this._t0 = this.iterator_result_token.value
		}
	}

	/**
	 * Prepare the next token for the parser.
	 * Whitespace and comment tokens are filtered out.
	 * @returns the next token
	 */
	abstract generate(): Generator<Token>;
}



export class ScreenerSolid extends Screener {
	// @ts-expect-error
	declare readonly t0: TokenSolid; // NB https://github.com/microsoft/TypeScript/issues/40220
	/** A set of all unique identifiers in the program. */
	private _ids: Set<string> = new Set()

	/**
	 * Construct a new ScreenerSolid object.
	 * @param tokengenerator - A token generator produced by a Lexer.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		tokengenerator: Generator<TokenSolid>,
		private readonly config: SolidConfig,
	) {
		super(tokengenerator)
	}

	* generate(): Generator<TokenSolid> {
		while (!this.isDone) {
			if (!(this.t0 instanceof TokenWhitespace) && !(this.t0 instanceof TokenComment)) {
				if (Dev.supports('variables') && this.t0 instanceof TokenIdentifier) {
					this._ids.add(this.t0.source)
					this.t0.setValue(BigInt([...this._ids].indexOf(this.t0.source)))
				}
				yield this.t0
			}
			this.advance()
		}
	}

	/**
	 * Construct a new Parser object from this Screener.
	 * @return a new Parser with this Screener as its argument
	 */
	get parser(): Parser {
		const Parser_class: typeof Parser = require('../parser/').ParserSolid
		return new Parser_class(this.generate(), this.config)
	}
}
