import Token from './Token.class'
import Translator from './Translator.class'
import ParseNode from './ParseNode.class'
import Terminal from './Terminal.class'
import Grammar, {
	GrammarSymbol,
	Rule,
	Configuration,
} from './Grammar.class'


type State = ReadonlySet<Configuration>


/**
 * An LR(1), shift-reduce Parser.
 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
 */
export default class Parser {
	/** Working stack of tokens, nodes, and configuration states. */
	private readonly stack: [Token|ParseNode, State][] = []
	/** Lookahead into the input stream. */
	private lookahead: Token|null = null;

	/**
	 * Construct a new Parser object.
	 * @param   grammar - the grammar of the language to parse
	 */
	constructor(
		private readonly grammar: Grammar,
	) {
	}

	/**
	 * Shift the parser, moving the lookahead token onto the stack.
	 * @param   curr_state            - the current configuration state
	 * @param   translator            - the translator returning tokens for each iteration
	 * @param   iterator_result_token - the result of the translator iterator
	 * @returns                         a new `iterator_result_token`, for the next lookahead token, and whether the shift was successful
	 */
	private shift(curr_state: State, translator: Iterator<Token, void>, iterator_result_token: IteratorResult<Token, void>): [IteratorResult<Token, void>, boolean] {
		const next_state: Set<Configuration> = new Set<Configuration>([...curr_state].filter((config) => {
			const next_symbol: GrammarSymbol|null = config.after[0] || null
			return (
				typeof next_symbol === 'string' && this.lookahead !.cargo === next_symbol ||
				next_symbol instanceof Terminal && next_symbol.match(this.lookahead !)
			)
		}).map((config) => config.advance()))
		let shifted: boolean = false
		if (next_state.size > 0) {
			this.stack.push([this.lookahead !, this.grammar.closure(next_state)])
			iterator_result_token = translator.next()
			this.lookahead = iterator_result_token.value as Token
			shifted = true
		}
		return [iterator_result_token, shifted]
	}

	/**
	 * Reduce the parser, taking a number of tokens/nodes on the stack and replacing them with a node.
	 * @param   curr_state - the current configuration state
	 * @returns              whether the rduce was successful
	 */
	private reduce(curr_state: State): boolean {
		const dones: Configuration[] = [...curr_state].filter((config) => config.done)
		if (dones.length) {
			const reductions: Configuration[] = dones.filter((config) =>
				this.lookahead ? config.lookaheads.has(this.lookahead.cargo) : config.lookaheads.size === 0
			)
			if (reductions.length === 1) {
				const rule: Rule = reductions[0].rule
				const children: (Token|ParseNode)[] = rule.symbols.map(() =>
					this.stack.pop() ![0] as Token|ParseNode
				).reverse()
				// if (rule.match(this.stack.slice(-rule.symbols.length)))
				const token = new ParseNode(rule.production.displayName, children)
				const next_state: Set<Configuration> = new Set<Configuration>((this.stack.length) ?
					[...this.stack[this.stack.length-1][1]]
						.filter((config) => config.after[0] === rule.production)
						.map((config) => config.advance())
				: [])
				this.stack.push([token, this.grammar.closure(next_state)])
				if (next_state.size < 0 && rule.production.displayName !== 'File') { // TODO change to 'Goal' on v0.2
					throw new Error('no next configuration found')
				}
				return true
			} else if (reductions.length) {
				throw new Error(`Reduce-Reduce Conflict:\n${reductions.map((r) => r.toString())}`)
			}
		}
		throw new Error(`Unexpected token: ${this.lookahead !.serialize()}`)
	}

	/**
	 * Main parsing function.
	 * @param   source the source text
	 * @returns        a token representing the grammar’s goal symbol
	 */
	parse(source: string): Token|ParseNode {
		/** The translator returning tokens for each iteration. */
		const translator: Iterator<Token, void> = new Translator(source).generate()
		/** The result of the translator iterator. */
		let iterator_result_token: IteratorResult<Token, void> = translator.next()

		this.lookahead = iterator_result_token.value as Token
		while (!iterator_result_token.done) {
			const curr_state = this.stack.length ? this.stack[this.stack.length-1][1] : this.grammar.closure()

			const shift_result: [IteratorResult<Token, void>, boolean] = this.shift(curr_state, translator, iterator_result_token)
			iterator_result_token = shift_result[0]
			const shifted: boolean = shift_result[1]
			if (shifted) {
				continue;
			}

			const reduced: boolean = this.reduce(curr_state)
			if (reduced) {
				continue;
			}

			if (!shifted && !reduced) {
				throw new Error('I neither shifted nor reduced; there must be a syntax error.')
			}
		}
		const final_state: State = this.stack[this.stack.length-1][1]
		if ([...final_state][0].rule.belongsTo(this.grammar.productions[0])) {
			this.reduce(final_state)
		}
		if (this.stack.length === 0) throw new Error('Somehow, the stack was emptied. It should have 1 final element, a top-level rule.')
		if (this.stack.length >   1) throw new Error('There is still unfinished business: The Stack should have only 1 element left.')
		return this.stack[0][0]
	}
}
