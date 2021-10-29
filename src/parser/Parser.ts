import * as xjs from 'extrajs';
import {ParseError01} from './package.js';
import type {EBNFObject} from './utils-public.js';
import {Terminal} from './terminal/index.js';
import {Production} from './Production.js';
import type {Rule} from './Rule.js';
import type {Configuration} from './Configuration.js';
import type {
	GrammarSymbol,
	Grammar,
} from './Grammar.js';
import {
	Token,
	TokenWhitespace,
	TokenComment,
} from './Token.js';
import {ParseNode} from './ParseNode.js';
import type {Lexer} from './Lexer.js';



type State = ReadonlySet<Configuration>;



/**
 * An LR(1), shift-reduce Parser.
 * @see http://www2.lawrence.edu/fast/GREGGJ/CMSC515/parsing/LR_parsing.html
 */
export class Parser<GoalNodeType extends ParseNode> {
	/**
	 * Takes a set of JSON objects representing syntactic productions
	 * and returns a string in TypeScript language representing a subclass of {@link Parser}.
	 * @param   jsons    a set of JSON productions
	 * @returns          a string to print to a TypeScript file
	 */
	static fromJSON(jsons: EBNFObject[]): string {
		return xjs.String.dedent`
			export const PARSER: Parser<ParseNodeGoal> = new Parser<ParseNodeGoal>(
				LEXER,
				GRAMMAR,
				new Map<Production, typeof ParseNode>([
					${ jsons.map((json) => `[${ Production.classnameOf(json) }.instance, ${ ParseNode.classnameOf(json) }]`).join(',\n\t\t') },
				]),
			);
		`;
	}


	/** A token generator produced by a Lexer. */
	private token_generator?: Generator<Token>;
	/** The result of the lexer iterator. */
	private iterator_result_token?: IteratorResult<Token, void>;
	/** Working stack of tokens, nodes, and configuration states. */
	private stack: [Token | ParseNode, State][] = [];
	/** Lookahead into the input stream. */
	private lookahead!: Token;

	/**
	 * Construct a new Parser object.
	 * @param lexer         a fresh Lexer instance
	 * @param grammar       The syntactic grammar of the language used in parsing.
	 * @param parsenode_map A mapping of productions to parse node types.
	 */
	constructor (
		private readonly lexer: Lexer,
		private readonly grammar: Grammar,
		private readonly parsenode_map: ReadonlyMap<Production, typeof ParseNode>,
	) {
	}

	/**
	 * Shift the parser, moving the lookahead token onto the stack.
	 * @param   curr_state the current configuration state
	 * @returns            whether the shift was successful
	 */
	private shift(curr_state: State): boolean {
		const next_state: ReadonlySet<Configuration> = new Set<Configuration>([...curr_state].filter((config) => {
			const next_symbol: GrammarSymbol | null = config.after[0] || null;
			return (
				(typeof next_symbol === 'string') ? this.lookahead.source === next_symbol :
				(next_symbol instanceof Terminal) ? next_symbol.match(this.lookahead) :
				false
			);
		}).map((config) => config.advance()));
		let shifted: boolean = false;
		if (next_state.size > 0) {
			this.stack.push([this.lookahead, this.grammar.closure(next_state)]);
			this.iterator_result_token = this.token_generator!.next();
			while (
				this.iterator_result_token.value instanceof TokenWhitespace ||
				this.iterator_result_token.value instanceof TokenComment
			) {
				this.iterator_result_token = this.token_generator!.next();
			};
			this.lookahead = this.iterator_result_token.value as Token;
			shifted = true;
		};
		return shifted;
	}

	/**
	 * Reduce the parser, taking a number of tokens/nodes on the stack and replacing them with a node.
	 * @param   curr_state the current configuration state
	 * @returns            whether the reduce was successful
	 */
	private reduce(curr_state: State): true {
		const dones: Configuration[] = [...curr_state].filter((config) => config.done);
		if (dones.length) {
			const reductions: Configuration[] = dones.filter((config) => this.lookahead
				? config.hasLookahead(this.lookahead)
				: config.lookaheads.size === 0
			);
			if (reductions.length === 1) {
				const rule: Rule = reductions[0].rule;
				const children: (Token | ParseNode)[] = rule.symbols.map(() => this.stack.pop()![0]).reverse();
				const node: ParseNode = this.makeParseNode(rule, children);
				const next_state: ReadonlySet<Configuration> = new Set<Configuration>((this.stack.length)
					? [...this.stack[this.stack.length - 1][1]]
						.filter((config) => config.after[0] === rule.production)
						.map((config) => config.advance())
					: []
				);
				this.stack.push([node, this.grammar.closure(next_state)]);
				if (next_state.size < 0 && rule.production.displayName !== 'Goal') {
					throw new Error('no next configuration found');
				};
				return true;
			} else if (reductions.length) {
				throw new Error(`Reduce-Reduce Conflict:\n${ reductions.map((r) => r.toString()).join('\n') }`);
			};
		};
		throw new ParseError01(this.lookahead);
	}

	/**
	 * Construct a speific subtype of ParseNode depending on which production the rule belongs to.
	 *
	 * @param rule     the Rule used to create the ParseNode
	 * @param children the set of child inputs to create the ParseNode
	 * @returns        a new ParseNode object
	 */
	private makeParseNode(rule: Rule, children: readonly (Token | ParseNode)[]): ParseNode {
		const nodetype: typeof ParseNode | null = [...this.parsenode_map].find(([prod, _nodetype]) => rule.production.equals(prod))?.[1] || null;
		return (!!nodetype)
			? new nodetype(children)
			: new ParseNode(children);
	}

	/**
	 * Parse source text into a parse tree.
	 * @param source the source text
	 * @returns      a token representing the grammar’s goal symbol
	 * @final
	 */
	parse(source: string): GoalNodeType {
		this.stack = []; // reset the stack for the next time parsing
		this.token_generator = this.lexer.generate(source);
		this.iterator_result_token = this.token_generator.next();
		while (
			this.iterator_result_token.value instanceof TokenWhitespace ||
			this.iterator_result_token.value instanceof TokenComment
		) {
			this.iterator_result_token = this.token_generator.next();
		};
		this.lookahead = this.iterator_result_token.value as Token;
		while (!this.iterator_result_token.done) {
			const curr_state: State = this.stack.length
				? this.stack[this.stack.length - 1][1]
				: this.grammar.closure()
			;
			const shifted: boolean = this.shift(curr_state);
			if (shifted) {
				continue;
			};
			const reduced: true = this.reduce(curr_state);
			if (reduced) {
				continue;
			};
			throw new Error('I neither shifted nor reduced; there must be a syntax error.');
		};
		const final_state: State = this.stack[this.stack.length - 1][1];
		if ([...final_state][0].rule.production.equals(this.grammar.goal)) {
			this.reduce(final_state);
		};
		if (this.stack.length < 1) { throw new Error('Somehow, the stack was emptied. It should have 1 final element, a top-level rule.'); };
		if (this.stack.length > 1) { throw new Error('There is still unfinished business: The Stack should have only 1 element left.'); };
		return this.stack[0][0] as GoalNodeType;
	}

	/**
	 * View this Parser’s stack in a readable format.
	 * @returns an array containing Token–Configuration pairs represented as strings
	 * @final
	 */
	viewStack(): [string, Set<string>][] {
		return this.stack.map(([symb, state]) => [
			symb.serialize(),
			new Set([...state].map((e) => e.toString())),
		]);
	}
}
