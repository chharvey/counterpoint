import {
	Token,
	Terminal,
} from '@chharvey/parser';
import * as xjs from 'extrajs'

import Util from '../class/Util.class'
import type {
	GrammarSymbol,
	GrammarTerminal,
} from './Grammar.class'
import type Rule from './Rule.class'


/**
 * A configuration is a grammar rule augmented with an additional symbol that tracks
 * our progress in identifying the right hand side.
 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
 */
export default class Configuration {
	/** The set of symbols before the current marker. */
	readonly before: readonly GrammarSymbol[] = this.rule.symbols.slice(0, Number(this.marker))
	/** The set of symbols after the current marker. */
	readonly after: readonly GrammarSymbol[] = this.rule.symbols.slice(Number(this.marker))
	/** Is this configuration done? That is, is the marker past all of the symbols in the rule? */
	readonly done: boolean = this.after.length === 0
	/** The set of terminal symbols that may succeed the symbols in this configuration’s rule. */
	readonly lookaheads: ReadonlySet<GrammarTerminal>;

	/**
	 * Construct a new Configuration object.
	 * @param  rule       - The rule to track.
	 * @param  marker     - The index of the marker’s current location.
	 *                      The items to the left of the marker (indices are < marker index) have been seen,
	 *                      and the items to the right of the marker (indices are >= marker index) have not yet been seen.
	 * @param  lookaheads - any lookaheads to add upon construction
	 */
	constructor(
		readonly rule: Rule,
		readonly marker: bigint = 0n,
		...lookaheads: readonly GrammarTerminal[]
	) {
		if (this.marker > this.rule.symbols.length) throw new Error('Cannot advance past end of rule.')
		this.lookaheads = new Set(lookaheads)
	}

	/**
	 * Does this Configuration’s lookahead set contain the given candidate Token?
	 * @param   candidate - the Token to check
	 * @returns             is the Token, or the Token’s cargo, in this lookahead set?
	 */
	hasLookahead(candidate: Token): boolean {
		return [...this.lookaheads].some((l) =>
			l === candidate.source ||
			l instanceof Terminal && l.match(candidate)
		)
	}
	/**
	 * Produce a new configuration that represents this configuartion with its marker advanced to the next symbol.
	 * If a parameter is supplied, advance the marker by that number of symbols.
	 * @param   step - number of steps to advance the marker; a positive integer
	 * @returns        a new Configuration with the marker moved forward 1 step
	 */
	advance(step: bigint = 1n): Configuration {
		return new Configuration(this.rule, this.marker + xjs.Math.maxBigInt(1n, step), ...this.lookaheads)
	}

	/**
	 * Is this configuration “equal to” the argument?
	 *
	 * Two configurations are “equal” if they are the same object, or all of the following are true:
	 * - The rules of both configurations are the same object.
	 * - The markers of both configurations are equal.
	 * - The lookahead sets of both configurations are “equal” (they contain the same terminal symbols).
	 *
	 * The last criterian may be disabled by providing `false` for the `lookaheads` parameter.
	 *
	 * @param   config     - the configuration to compare
	 * @param   lookaheads - should lookahead sets be compared?
	 * @returns              is this configuration “equal to” the argument?
	 */
	equals(config: Configuration, lookaheads: boolean = true): boolean {
		return this === config ||
			this.rule.equals(config.rule) &&
			this.marker === config.marker &&
			(!lookaheads || Util.equalSets<GrammarTerminal>(this.lookaheads, config.lookaheads))
	}

	/** @override */
	toString(): string {
		return `${ this.rule.production.displayName } --> ${ Util.stringOfSymbols(this.before) } \u2022 ${ Util.stringOfSymbols(this.after) } {${ Util.stringOfSymbols([...this.lookaheads]).replace(/\s/g, ', ') }}`
	}
}
