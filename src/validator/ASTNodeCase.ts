import type {PARSER} from './package.js';
import type {ASTNodeExpression} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeCase extends ASTNodeSolid {
	constructor (
		start_node: PARSER.ParseNodeCase,
		readonly antecedent: ASTNodeExpression,
		readonly consequent: ASTNodeExpression,
	) {
		super(start_node, {}, [antecedent, consequent]);
	}
}
