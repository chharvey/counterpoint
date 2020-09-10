import Util from '../class/Util.class'
import type {GrammarSymbol} from './Grammar.class'
import type Production from './Production.class'



/**
 * A Rule is a single instance of a {@link Production} in use:
 * it consists of the production’s nonterminal and a single choice,
 * the sequence of symbols that is to be replaced.
 */
export default class Rule {
	/** The sequence of terminals/nonterminals on the right-hand side of the rule. */
	readonly symbols: readonly GrammarSymbol[];

	/**
	 * Construct a new Rule object.
	 * @param   production - The production.
	 * @param   choice     - the index determining which of the production’s choices to use
	 */
	constructor(
		readonly production: Production,
		choice: number,
	) {
		this.symbols = production.sequences[choice]
	}

	/**
	 * Is this rule “equal to” the argument?
	 *
	 * Two rules are “equal” if they are the same object, or all of the following are true:
	 * - The sequence arrays of both rules are “equal” (they contain the same elements, index by index).
	 *
	 * @param   rule - the rule to compare
	 * @returns        is this rule “equal to” the argument?
	 */
	equals(rule: Rule) {
		return this === rule ||
			this.production.displayName === rule.production.displayName &&
			Util.equalArrays<GrammarSymbol>(this.symbols, rule.symbols)
	}

	/** @override */
	toString(): string {
		return `${ this.production.displayName } --> ${ Util.stringOfSymbols(this.symbols) }`
	}
}
