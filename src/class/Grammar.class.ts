import Token, {TokenSubclass, isTokenSubclass} from './Token.class'
import ParseNode from './ParseNode.class'
import Production from './Production.class'
import Util from './Util.class'


export type GrammarSymbol = Terminal|Production
export type Terminal      = string|TokenSubclass


export default class Grammar {
	/** The productions of this grammar decomposed into rules. There are likely many rules per production. */
	readonly rules: readonly Rule[];
	/**
	 * Construct a new Grammar object.
	 * @param   productions - The set of all productions in this Grammar.
	 */
	constructor(
		readonly productions: readonly Production[],
	) {
		if (!this.productions.length) throw new Error('Grammar must ahve at least one production.')
		this.productions.forEach((prod) => {
			if (!prod.sequences.length) throw new Error('Grammar production must have at least one sequence.')
			prod.sequences.forEach((seq) => {
				if (!seq.length) throw new Error('Grammar sequence must have at least one symbol.')
			})
		})
		this.rules = this.productions.map((prod) => prod.toRules()).flat()
	}
	/**
	 * The **first** of a grammar symbol `s` is,
	 * if `s` is a terminal, the singleton set $\{s\}$, or
	 * if `s` is a nonterminal, the set of all terminals that can appear a
	 * the first element of any sequence in a rule defining `s`.
	 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
	 * @param   symbol - a terminal or nonterminal grammar symbol
	 * @returns          the set of all possible terminal symbols, each of which may replace `symbol`
	 */
	first(symbol: GrammarSymbol): Set<Terminal> {
		return new Set<Terminal>((typeof symbol === 'string') ? // a string literal (terminal)
			[symbol]
		: (symbol instanceof Function && isTokenSubclass(symbol)) ? // a token type (terminal)
			[symbol]
		: (symbol instanceof Production) ? // a reference to a nonterminal
			symbol.sequences.map<Terminal[]>((seq) =>
				(seq[0] !== symbol) ? // avoid infinite loop
					[...this.first(seq[0])] :
					[]
			).flat()
		: [])
	}
	/**
	 * The **follow** of a grammar symbol `s` is
	 * the set of all possible terminals that may appear immediately after `s` in a rule.
	 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
	 * @param   symbol - a terminal or nonterminal grammar symbol
	 * @returns          the set of all possible terminal symbols, each of which may follow `symbol`
	 */
	follow(symbol: GrammarSymbol): Set<Terminal> {
		const set: Set<string|TokenSubclass> = new Set<Terminal>(this.rules
			.filter((rule) => rule.symbols.includes(symbol))
			.map<Terminal[]>((rule) => {
				const index: number = rule.symbols.indexOf(symbol)
				return (index < rule.symbols.length-1) ? // if (item !== choice.lastItem)
					[...this.first(rule.symbols[index + 1])] :
					[...this.follow(rule.production)]
			})
			.flat()
		)
		return set
	}
	/**
	 * Generate an instance of the language of this Grammar.
	 * A language instance is a sequence of terminal symbols that can result from repeatedly replacing
	 * any nonterminal in the sequence with a right-hand side of a production for which
	 * the nonterminal is the left-hand side.
	 * @returns a well-formed program
	 */
	random(): string[] {
		let returned: string[]|null = null
		for (let i = 0; i < 64; i++) {
			try {
				returned = this.productions[0].random()
				break;
			} catch { // RangeError: Maximum call stack size exceeded
			}
		}
		return returned || []
	}
}


/**
 * A Rule is a single instance of a {@link Production} in use:
 * it consists of the production’s nonterminal and a single choice,
 * the sequence of symbols that is to be replaced.
 */
export class Rule {
	/** The sequence of terminals/nonterminals on the right-hand side of the rule. */
	readonly symbols: readonly GrammarSymbol[];
	/**
	 * Construct a new Rule object.
	 * @param   production - The production.
	 * @param   choice     - the index determining which of the production’s choices to use
	 */
	constructor(
		public readonly production: Production,
		choice: number /* TODO bigint */,
	) {
		this.symbols = production.sequences[choice]
	}
	/**
	 * Is this rule “equal to” the argument?
	 *
	 * Two rules are “equal” if they are the same object, or all of the following are true:
	 * - The productions of both rules are the same object.
	 * - The sequence arrays of both rules are “equal” (they contain the same elements, index by index).
	 *
	 * @param   rule - the rule to compare
	 * @returns        is this rule “equal to” the argument?
	 */
	equals(rule: Rule) {
		return this === rule ||
			this.production === rule.production &&
			Util.equalArrays<GrammarSymbol>(this.symbols, rule.symbols)
	}
	/**
	 * Does the given sequence of symbols satisfy this rule?
	 * @param   candidate - a sequence of grammar symbols
	 * @returns             does the given sequence of symbols satisfy this rule?
	 */
	match(candidate: readonly (Token|ParseNode)[]): boolean {
		return candidate.length === this.symbols.length && this.symbols.every((symbol, i) => {
			const test: Token|ParseNode = candidate[i]
			return (typeof symbol === 'string') ? // a string literal (terminal)
				test instanceof Token && test.cargo === symbol
			: (symbol instanceof Function && isTokenSubclass(symbol)) ? // a token type (terminal)
				test instanceof symbol
			: (symbol instanceof Production) ? // a reference to a nonterminal
				test instanceof ParseNode && symbol.toRules().some((rule) =>
					rule.match(test.inputs)
				)
			: false
		})
	}
}
