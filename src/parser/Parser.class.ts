import type SolidConfig from '../SolidConfig'
import Dev from '../class/Dev.class'
import {ParseError01} from '../error/ParseError.class'
import type {
	Token,
} from '../lexer/'
import {
	Validator,
} from '../validator/'
import {ParseNode} from './ParseNode.class'
import * as PARSENODE from './ParseNode.auto'
import Grammar, {
	GrammarSymbol,
} from './Grammar.class'
import Terminal from './Terminal.class'
import type Production from './Production.class'
import * as PRODUCTION from './Production.auto'
import type Rule from './Rule.class'
import type Configuration from './Configuration.class'


type State = ReadonlySet<Configuration>



/**
 * An LR(1), shift-reduce Parser.
 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
 */
export class Parser {
	/** The result of the screener iterator. */
	private iterator_result_token: IteratorResult<Token, void>;
	/** Working stack of tokens, nodes, and configuration states. */
	private readonly stack: [Token | ParseNode, State][] = []
	/** Lookahead into the input stream. */
	private lookahead: Token;

	/**
	 * Construct a new Parser object.
	 * @param tokengenerator - A token generator produced by a Screener.
	 * @param grammar - The syntactic grammar of the language used in parsing.
	 * @param parsenode_map - A mapping of productions to parse node types.
	 */
	constructor (
		private readonly tokengenerator: Generator<Token>,
		private readonly grammar: Grammar,
		private readonly parsenode_map: Map<Production, typeof ParseNode>,
	) {
		this.iterator_result_token = this.tokengenerator.next()
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
			this.iterator_result_token = this.tokengenerator.next()
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
				const children: (Token | ParseNode)[] = rule.symbols.map(() => this.stack.pop()![0]).reverse()
				const node: ParseNode = this.makeParseNode(rule, children)
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
				throw new Error(`Reduce-Reduce Conflict:\n${reductions.map((r) => r.toString()).join('\n')}`)
			}
		}
		throw new ParseError01(this.lookahead)
	}

	/**
	 * Construct a speific subtype of ParseNode depending on which production the rule belongs to.
	 *
	 * @param rule     - The Rule used to create this ParseNode.
	 * @param children - The set of child inputs that creates this ParseNode.
	 * @returns          a new ParseNode object
	 */
	private makeParseNode(rule: Rule, children: readonly (Token | ParseNode)[]): ParseNode {
		let returned: ParseNode = new ParseNode(rule, children)
		this.parsenode_map.forEach((nodetype, prod) => {
			if (rule.production.equals(prod)) {
				returned = new nodetype(rule, children)
			}
		})
		return returned
	}

	/**
	 * Main parsing function.
	 * @returns          a token representing the grammar’s goal symbol
	 */
	parse(): ParseNode {
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
		return this.stack[0][0] as ParseNode
	}
}



export class ParserSolid extends Parser {
	/**
	 * Construct a new ParserSolid object.
	 * @param tokengenerator - A token generator produced by a Screener.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		tokengenerator: Generator<Token>,
		private readonly config: SolidConfig,
	) {
		super(tokengenerator, new Grammar([
			PRODUCTION.ProductionPrimitiveLiteral.instance,
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeKeyword             .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeUnit                .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeUnarySymbol         .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeIntersection        .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeUnion               .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionType                    .instance] : []),
			...(Dev.supports('literalTemplate') ? [PRODUCTION.ProductionStringTemplate          .instance] : []),
			...(Dev.supports('literalTemplate') ? [PRODUCTION.ProductionStringTemplate__0__List .instance] : []),
			PRODUCTION.ProductionExpressionUnit           .instance,
			PRODUCTION.ProductionExpressionUnarySymbol    .instance,
			PRODUCTION.ProductionExpressionExponential    .instance,
			PRODUCTION.ProductionExpressionMultiplicative .instance,
			PRODUCTION.ProductionExpressionAdditive       .instance,
			PRODUCTION.ProductionExpressionComparative    .instance,
			PRODUCTION.ProductionExpressionEquality       .instance,
			PRODUCTION.ProductionExpressionConjunctive    .instance,
			PRODUCTION.ProductionExpressionDisjunctive    .instance,
			PRODUCTION.ProductionExpressionConditional    .instance,
			PRODUCTION.ProductionExpression               .instance,
			...(Dev.supportsAll('variables', 'typingExplicit') ? [PRODUCTION.ProductionDeclarationVariable.instance] : []),
			...(Dev.supports   ('variables')                   ? [PRODUCTION.ProductionStatementAssignment.instance] : []),
			PRODUCTION.ProductionStatement.instance,
			PRODUCTION.ProductionGoal.instance,
			PRODUCTION.ProductionGoal__0__List.instance,
		], PRODUCTION.ProductionGoal.instance), new Map<Production, typeof ParseNode>([
			[PRODUCTION.ProductionPrimitiveLiteral.instance, PARSENODE.ParseNodePrimitiveLiteral],
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeKeyword             .instance, PARSENODE.ParseNodeTypeKeyword]             as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeUnit                .instance, PARSENODE.ParseNodeTypeUnit]                as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeUnarySymbol         .instance, PARSENODE.ParseNodeTypeUnarySymbol]         as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeIntersection        .instance, PARSENODE.ParseNodeTypeIntersection]        as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeUnion               .instance, PARSENODE.ParseNodeTypeUnion]               as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionType                    .instance, PARSENODE.ParseNodeType]                    as const] : []),
			...(Dev.supports('literalTemplate') ? [[PRODUCTION.ProductionStringTemplate          .instance, PARSENODE.ParseNodeStringTemplate]          as const] : []),
			...(Dev.supports('literalTemplate') ? [[PRODUCTION.ProductionStringTemplate__0__List .instance, PARSENODE.ParseNodeStringTemplate__0__List] as const] : []),
			[PRODUCTION.ProductionExpressionUnit           .instance, PARSENODE.ParseNodeExpressionUnit],
			[PRODUCTION.ProductionExpressionUnarySymbol    .instance, PARSENODE.ParseNodeExpressionUnarySymbol],
			[PRODUCTION.ProductionExpressionExponential    .instance, PARSENODE.ParseNodeExpressionExponential],
			[PRODUCTION.ProductionExpressionMultiplicative .instance, PARSENODE.ParseNodeExpressionMultiplicative],
			[PRODUCTION.ProductionExpressionAdditive       .instance, PARSENODE.ParseNodeExpressionAdditive],
			[PRODUCTION.ProductionExpressionComparative    .instance, PARSENODE.ParseNodeExpressionComparative],
			[PRODUCTION.ProductionExpressionEquality       .instance, PARSENODE.ParseNodeExpressionEquality],
			[PRODUCTION.ProductionExpressionConjunctive    .instance, PARSENODE.ParseNodeExpressionConjunctive],
			[PRODUCTION.ProductionExpressionDisjunctive    .instance, PARSENODE.ParseNodeExpressionDisjunctive],
			[PRODUCTION.ProductionExpressionConditional    .instance, PARSENODE.ParseNodeExpressionConditional],
			[PRODUCTION.ProductionExpression               .instance, PARSENODE.ParseNodeExpression],
			...(Dev.supports('variables') ? [[PRODUCTION.ProductionDeclarationVariable.instance, PARSENODE.ParseNodeDeclarationVariable] as const] : []),
			...(Dev.supports('variables') ? [[PRODUCTION.ProductionStatementAssignment.instance, PARSENODE.ParseNodeStatementAssignment] as const] : []),
			[PRODUCTION.ProductionStatement     .instance, PARSENODE.ParseNodeStatement],
			[PRODUCTION.ProductionGoal          .instance, PARSENODE.ParseNodeGoal],
			[PRODUCTION.ProductionGoal__0__List .instance, PARSENODE.ParseNodeGoal__0__List],
		]))
	}

	parse(): PARSENODE.ParseNodeGoal {
		return super.parse() as PARSENODE.ParseNodeGoal
	}

	/**
	 * Construct a new Validator object from this Parser.
	 * @return a new Validator with this Parser as its argument
	 */
	get validator(): Validator {
		return new Validator(this.parse(), this.config)
	}
}
