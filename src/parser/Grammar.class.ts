import type {NonemptyArray} from '../types.d'
import type {
	Filebound,
	Punctuator,
	Keyword,
} from '../lexer/'
import type Rule from './Rule.class'
import Configuration from './Configuration.class'
import Terminal from './Terminal.class'
import Production from './Production.class'



export type GrammarSymbol =
	| GrammarTerminal
	| Production

export type GrammarTerminal =
	| string
	| Filebound
	| Punctuator
	| Keyword
	| Terminal



export default class Grammar {
	/** The productions of this Grammar decomposed into rules. There are likely many rules per production. */
	readonly rules: readonly Rule[];

	/**
	 * Construct a new Grammar object.
	 * @param productions The set of all productions in this Grammar.
	 * @param goal        The goal production of this Grammar.
	 */
	constructor (
		readonly productions: NonemptyArray<Production>,
		readonly goal: Production,
	) {
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
	first(symbol: GrammarSymbol): Set<GrammarTerminal> {
		return new Set<GrammarTerminal>((typeof symbol === 'string') ? // a string literal (terminal)
			[symbol]
		: (symbol instanceof Terminal) ? // a token type (terminal)
			[symbol]
		: (symbol instanceof Production) ? // a reference to a nonterminal
			symbol.sequences.map<GrammarTerminal[]>((seq) =>
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
	follow(symbol: GrammarSymbol): Set<GrammarTerminal> {
		const set: Set<GrammarTerminal> = new Set<GrammarTerminal>(this.rules
			.filter((rule) => rule.symbols.includes(symbol))
			.map<GrammarTerminal[]>((rule) => {
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
	 * The **closure** of a configuration set adds new configurations by expanding variables that appear to the right of the marker.
	 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
	 * @param   configurations - the set of configurations to close upon
	 * @returns                  the closure set
	 */
	closure(configurations: ReadonlySet<Configuration>
		= new Set<Configuration>(this.goal.toRules().map((rule) => new Configuration(rule)))
	): Set<Configuration> {
		const closure: Set<Configuration> = new Set<Configuration>(configurations)
		closure.forEach((config) => { // callback will visit any new items added to the set before `.forEach()` returns
			const expand: GrammarSymbol|null = config.after[0] || null
			const follow: GrammarSymbol|null = config.after[1] || null
			if (expand instanceof Production) {
				expand.toRules().forEach((rule) => {
					/* equivalent configurations (differ only by lookahead set) */
					const similar: Configuration|null = [...closure].find((c) => c.rule.equals(rule) && c.marker === 0n) || null
					const new_config: Configuration = new Configuration(rule, 0n, ...[
						...(follow ? this.first(follow) : config.lookaheads),
						...(similar ? similar.lookaheads : []),
					])
					if (![...closure].find((c) => c.equals(new_config))) {
						closure.add(new_config) // callback of `closure.forEach()` will run on these added items
						similar && closure.delete(similar)
					}
				})
			}
		})
		return closure
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
				returned = this.goal.random()
				break;
			} catch (err) { // RangeError: Maximum call stack size exceeded
				if (err.message !== 'Maximum call stack size exceeded') {
					throw err
				}
			}
		}
		return returned || []
	}
}
