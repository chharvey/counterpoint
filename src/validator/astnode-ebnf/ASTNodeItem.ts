import type {
	EBNFObject,
	EBNFChoice,
	ParseNode,
} from './package.js';
import type {
	ConcreteNonterminal,
} from './utils-private.js';
import type {ASTNodeCondition} from './ASTNodeCondition.js';
import {ASTNodeExpr} from './ASTNodeExpr.js';



export class ASTNodeItem extends ASTNodeExpr {
	constructor (
		parse_node: ParseNode,
		private readonly item:       ASTNodeExpr,
		private readonly conditions: readonly ASTNodeCondition[] = [],
	) {
		super(parse_node, {}, [item, ...conditions]);
	}

	override transform(nt: ConcreteNonterminal, data: EBNFObject[]): EBNFChoice {
		return (this.conditions.some((cond) => cond.include === nt.hasSuffix(cond)))
			? this.item.transform(nt, data)
			: [
				[''],
			]
		;
	}
}
