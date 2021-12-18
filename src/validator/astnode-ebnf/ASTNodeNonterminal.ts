import type {
	TOKEN,
	ParseNode,
} from './package.js';
import {ConcreteNonterminal} from './utils-private.js';
import {ASTNodeEbnf} from './ASTNodeEbnf.js';
import type {ASTNodeParam} from './ASTNodeParam.js';



export class ASTNodeNonterminal extends ASTNodeEbnf {
	constructor (parse_node: ParseNode, nonterm: TOKEN.TokenIdentifier);
	constructor (parse_node: ParseNode, nonterm: ASTNodeNonterminal, params: readonly ASTNodeParam[]);
	constructor (
		parse_node: ParseNode,
		private readonly nonterm: TOKEN.TokenIdentifier | ASTNodeNonterminal,
		readonly params: readonly ASTNodeParam[] = [],
	) {
		super(
			parse_node,
			{name: (nonterm instanceof ASTNodeNonterminal) ? nonterm.name : nonterm.source},
			(nonterm instanceof ASTNodeNonterminal) ? [nonterm, ...params] : [],
		);
	}
	private readonly name: string = (this.nonterm instanceof ASTNodeNonterminal) ? this.nonterm.name : this.nonterm.source;

	/**
	 * Expands this nonterminal in its abstract form into a set of nonterminals with concrete parameters.
	 * E.g., expands `N<X, Y>` into `[N, N_X, N_Y, N_X_Y]`.
	 * @returns an array of objects representing nonterminals
	 */
	expand(): ConcreteNonterminal[] {
		return (this.params.length)
			? (this.nonterm as ASTNodeNonterminal).expand().flatMap((cn) =>
				[...new Array(2 ** this.params.length)].map((_, count) =>
					new ConcreteNonterminal(cn.name, [
						...cn.suffixes,
						...[...count.toString(2).padStart(this.params.length, '0')]
							.map((d, i) => [this.params[i], !!+d] as const)
							.filter(([_param, b]) => !!b)
							.map(([param, _b]) => param)
						,
					])
				)
			)
			: [new ConcreteNonterminal(this.name)]
		;
	}
}
