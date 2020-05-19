import * as xjs from 'extrajs'

import Util from './Util.class'
import {
	SOT,
	EOT,
} from './Char.class'
import type Token from './Token.class'
import Terminal from './Terminal.class'
import Production, {
	ProductionPrimitiveLiteral,
	ProductionStringTemplate,
	ProductionExpressionUnit,
	ProductionExpressionUnarySymbol,
	ProductionExpressionExponential,
	ProductionExpressionMultiplicative,
	ProductionExpressionAdditive,
	ProductionExpression,
	ProductionDeclarationVariable,
	ProductionStatementAssignment,
	ProductionStatement,
	ProductionGoal,
} from './Production.class'


export type GrammarSymbol   = GrammarTerminal|Production
export type GrammarTerminal = string|Terminal



/**
 * Display a string of grammar symbols for debugging purposes.
 *
 * @param   arr - the array of grammar symbols
 * @returns       a string representing the sequence of those symbols
 */
const stringOfSymbols = (arr: readonly GrammarSymbol[]): string =>
	arr.map((symbol) => (typeof symbol === 'string') ?
		`"${ symbol }"`
			.replace(SOT, '\u2402') // SYMBOL FOR START OF TEXT
			.replace(EOT, '\u2403') // SYMBOL FOR END   OF TEXT
		: symbol.displayName
	).join(' ')



export default class Grammar {
	/** The set of all productions in this Grammar. */
	readonly productions: readonly Production[];
	/** The goal production of this Grammar. */
	readonly goal: Production = ProductionGoal.instance
	/** The productions of this Grammar decomposed into rules. There are likely many rules per production. */
	readonly rules: readonly Rule[];

	/**
	 * Construct a new Grammar object.
	 */
	constructor() {
		this.productions = [
			ProductionPrimitiveLiteral.instance,
			ProductionStringTemplate.instance,
			ProductionStringTemplate.__0__List.instance,
			ProductionExpressionUnit.instance,
			ProductionExpressionUnarySymbol.instance,
			ProductionExpressionExponential.instance,
			ProductionExpressionMultiplicative.instance,
			ProductionExpressionAdditive.instance,
			ProductionExpression.instance,
			ProductionDeclarationVariable.instance,
			ProductionStatementAssignment.instance,
			ProductionStatement.instance,
			ProductionGoal.instance,
			ProductionGoal.__0__List.instance,
		]
		if (!this.productions.length) throw new Error('Grammar must have at least one production.')
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
			Util.equalArrays<GrammarSymbol>(this.symbols, rule.symbols)
	}

	/** @override */
	toString(): string {
		return `${this.production.displayName} --> ${stringOfSymbols(this.symbols)}`
	}
}



/**
 * A configuration is a grammar rule augmented with an additional symbol that tracks
 * our progress in identifying the right hand side.
 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
 */
export class Configuration {
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
		return this.lookaheads.has(candidate.source) || [...this.lookaheads].some((l) => l instanceof Terminal && l.match(candidate))
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
		const lookaheads = (set: ReadonlySet<GrammarTerminal>): string =>
			stringOfSymbols([...set]).replace(/\s/g, ', ')
		return `${this.rule.production.displayName} --> ${stringOfSymbols(this.before)} \u2022 ${stringOfSymbols(this.after)} {${lookaheads(this.lookaheads)}}`
	}
}
