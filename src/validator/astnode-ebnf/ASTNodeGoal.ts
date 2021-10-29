import type {
	EBNFObject,
	ParseNode,
} from './package.js';
import {ASTNodeEbnf} from './ASTNodeEbnf.js';
import type {ASTNodeProduction} from './ASTNodeProduction.js';



export class ASTNodeGoal extends ASTNodeEbnf {
	constructor (
		parse_node: ParseNode,
		private readonly productions: readonly ASTNodeProduction[] = [],
	) {
		super(parse_node, {}, productions);
	}

	transform(): EBNFObject[] {
		return this.productions.flatMap((prod) => prod.transform());
	}
}
