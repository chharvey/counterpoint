import {
	Terminal,
	Production,
} from '@chharvey/parser';
import type {Rule} from '@chharvey/parser/dist/grammar/Rule.js';
import * as xjs from 'extrajs';
import type {NonemptyArray} from './package.js';
import type {EBNFObject} from './utils-public.js';
import {Configuration} from './Configuration.js';



export type GrammarSymbol =
	| GrammarTerminal
	| Production
;

export type GrammarTerminal =
	| string
	| Terminal
;



/**
 * A formal grammar.
 * @see https://en.wikipedia.org/wiki/Formal_grammar
 * @final
 */
export class Grammar {
	/**
	 * Takes a set of JSON objects representing syntactic productions
	 * and returns a string in TypeScript language representing an instance of {@link Grammar}.
	 * @param   jsons    a set of JSON productions
	 * @returns          a string to print to a TypeScript file
	 */
	static fromJSON(jsons: EBNFObject[]): string {
		return xjs.String.dedent`
			export const GRAMMAR: Grammar = new Grammar([
				${ jsons.map((json) => `${ Production.classnameOf(json) }.instance`).join(',\n\t') },
			], ProductionGoal.instance);
		`;
	}


	/** The productions of this Grammar decomposed into rules. There are likely many rules per production. */
	private readonly rules: readonly Rule[];

	/**
	 * Construct a new Grammar object.
	 * @param productions The set of all productions in this Grammar.
	 * @param goal        The goal production of this Grammar.
	 */
	constructor (
		private readonly productions: Readonly<NonemptyArray<Production>>,
		readonly goal: Production,
	) {
		this.rules = this.productions.map((prod) => prod.toRules()).flat();
	}

	/**
	 * The **first** of a grammar symbol `s` is,
	 * if `s` is a terminal, the singleton set $\{s\}$, or
	 * if `s` is a nonterminal, the set of all terminals that can appear as
	 * the first element of any sequence in a rule defining `s`.
	 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
	 * @param   symbol a terminal or nonterminal grammar symbol
	 * @returns        the set of all possible terminal symbols, each of which may replace `symbol`
	 */
	private first(symbol: GrammarSymbol): Set<GrammarTerminal> {
		return new Set<GrammarTerminal>(
			(typeof symbol === 'string' || symbol instanceof Terminal) ? [symbol] :
			(symbol instanceof Production) ? symbol.sequences.flatMap<GrammarTerminal>((seq) =>
				(seq[0] !== symbol) ? [...this.first(seq[0])] : [] // avoid infinite loop
			) :
			[]
		);
	}

	/**
	 * The **follow** of a grammar symbol `s` is
	 * the set of all possible terminals that may appear immediately after `s` in a rule.
	 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
	 * @param   symbol a terminal or nonterminal grammar symbol
	 * @returns        the set of all possible terminal symbols, each of which may follow `symbol`
	 */
	private follow(symbol: GrammarSymbol): Set<GrammarTerminal> {
		return new Set<GrammarTerminal>(this.rules
			.filter((rule) => rule.symbols.includes(symbol))
			.flatMap<GrammarTerminal>((rule) => {
				const index: number = rule.symbols.indexOf(symbol);
				return (index < rule.symbols.length - 1) // COMBAK if (symbol !== rule.symbols.lastItem)
					? [...this.first(rule.symbols[index + 1])]
					: [...this.follow(rule.production)]
			})
		);
	}

	/**
	 * The **closure** of a configuration set adds new configurations by expanding variables that appear to the right of the marker.
	 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
	 * @param   configurations the set of configurations to close upon
	 * @returns                the closure set
	 */
	closure(configurations: ReadonlySet<Configuration>
		= new Set<Configuration>(this.goal.toRules().map((rule) => new Configuration(rule)))
	): Set<Configuration> {
		const closure: Set<Configuration> = new Set<Configuration>(configurations);
		closure.forEach((config) => { // callback will visit any new items added to the set before `.forEach()` returns
			const expand: GrammarSymbol | null = config.after[0] || null;
			const follow: GrammarSymbol | null = config.after[1] || null;
			if (expand instanceof Production) {
				expand.toRules().forEach((rule) => {
					/** equivalent configurations (differ only by lookahead set) */
					const similar: Configuration | null = [...closure].find((c) => c.rule.equals(rule) && c.marker === 0n) || null;
					const new_config: Configuration = new Configuration(rule, 0n, ...[
						...(follow ? this.first(follow) : config.lookaheads),
						...(similar ? similar.lookaheads : []),
					]);
					if (![...closure].find((c) => c.equals(new_config))) {
						closure.add(new_config); // callback of `closure.forEach()` will run on these added items
						similar && closure.delete(similar);
					};
				});
			};
		});
		return closure;
	}
}
