import type SolidConfig from '../SolidConfig'

import {
	Screener,
	Token,
} from '../lexer'
import Terminal from './Terminal.class'
import ParseNode, {
	ParseNodeGoal,
} from './ParseNode.class'
import Grammar, {
	GrammarSymbol,
} from './Grammar.class'
import type Rule from './Rule.class'
import type Configuration from './Configuration.class'


type State = ReadonlySet<Configuration>



/**
 * An LR(1), shift-reduce Parser.
 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
 */
export default class Parser {
	/** The syntactic grammar of the language used in parsing. */
	private readonly grammar: Grammar;
	/** The screener returning tokens for each iteration. */
	private readonly screener: Generator<Token>;
	/** The result of the screener iterator. */
	private iterator_result_token: IteratorResult<Token, void>;
	/** Working stack of tokens, nodes, and configuration states. */
	private readonly stack: [Token|ParseNode, State][] = []
	/** Lookahead into the input stream. */
	private lookahead: Token;

	/**
	 * Construct a new Parser object.
	 * @param source - the entire source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (source: string, readonly config: SolidConfig) {
		this.grammar = new Grammar()
		this.screener = new Screener(source, this.config).generate()
		this.iterator_result_token = this.screener.next()
		this.lookahead = this.iterator_result_token.value as Token
	}

	/**
	 * View this Parser’s stack in a readable format.
	 * @returns an array containing Token–Configuration pairs represented as strings
	 */
	viewStack(): [string, Set<string>][] {
		const printSet = (s: ReadonlySet<object>): Set<string> => new Set([...s].map((e) => e.toString()))
		return this.stack.map(([symb, state]) => [
			symb.serialize(),
			printSet(state),
		] as [string, Set<string>])
	}

	/**
	 * Shift the parser, moving the lookahead token onto the stack.
	 * @param   curr_state - the current configuration state
	 * @returns              whether the shift was successful
	 */
	private shift(curr_state: State): boolean {
		const next_state: Set<Configuration> = new Set<Configuration>([...curr_state].filter((config) => {
			const next_symbol: GrammarSymbol|null = config.after[0] || null
			return (typeof next_symbol === 'string') ?
				this.lookahead.source === next_symbol
			: (next_symbol instanceof Terminal) ?
				next_symbol.match(this.lookahead)
			: false
		}).map((config) => config.advance()))
		let shifted: boolean = false
		if (next_state.size > 0) {
			this.stack.push([this.lookahead, this.grammar.closure(next_state)])
			this.iterator_result_token = this.screener.next()
			this.lookahead = this.iterator_result_token.value as Token
			shifted = true
		}
		return shifted
	}

	/**
	 * Reduce the parser, taking a number of tokens/nodes on the stack and replacing them with a node.
	 * @param   curr_state - the current configuration state
	 * @returns              whether the rduce was successful
	 */
	private reduce(curr_state: State): true {
		const dones: Configuration[] = [...curr_state].filter((config) => config.done)
		if (dones.length) {
			const reductions: Configuration[] = dones.filter((config) =>
				this.lookahead ? config.hasLookahead(this.lookahead) : config.lookaheads.size === 0
			)
			if (reductions.length === 1) {
				const rule: Rule = reductions[0].rule
				const children: (Token|ParseNode)[] = rule.symbols.map(() => this.stack.pop() ![0]).reverse()
				const node: ParseNode = ParseNode.from(rule, children, this.config)
				const next_state: Set<Configuration> = new Set<Configuration>((this.stack.length) ?
					[...this.stack[this.stack.length-1][1]]
						.filter((config) => config.after[0] === rule.production)
						.map((config) => config.advance())
				: [])
				this.stack.push([node, this.grammar.closure(next_state)])
				if (next_state.size < 0 && rule.production.displayName !== 'Goal') {
					throw new Error('no next configuration found')
				}
				return true
			} else if (reductions.length) {
				throw new Error(`Reduce-Reduce Conflict:\n${reductions.map((r) => r.toString())}`)
			}
			throw new Error(`Unexpected token: ${this.lookahead.serialize()}`)
		}
		throw new Error(`There are no finished configurations; I cannot reduce now.`)
	}

	/**
	 * Main parsing function.
	 * @returns          a token representing the grammar’s goal symbol
	 */
	parse(): ParseNodeGoal {
		while (!this.iterator_result_token.done) {
			const curr_state: State = this.stack.length ? this.stack[this.stack.length - 1][1] : this.grammar.closure()
			const shifted: boolean = this.shift(curr_state)
			if (shifted) {
				continue;
			}
			const reduced: true = this.reduce(curr_state)
			if (reduced) {
				continue;
			}
			throw new Error('I neither shifted nor reduced; there must be a syntax error.')
		}
		const final_state: State = this.stack[this.stack.length-1][1]
		if ([...final_state][0].rule.production.equals(this.grammar.goal)) {
			this.reduce(final_state)
		}
		if (this.stack.length < 1) throw new Error('Somehow, the stack was emptied. It should have 1 final element, a top-level rule.')
		if (this.stack.length > 1) throw new Error('There is still unfinished business: The Stack should have only 1 element left.')
		return this.stack[0][0] as ParseNodeGoal
	}
}
