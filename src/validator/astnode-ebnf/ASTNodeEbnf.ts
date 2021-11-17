import {
	Token,
	ParseNode,
	ASTNode,
} from './package.js';



/**
 * Known subclasses:
 * - ASTNodeParam
 * - ASTNodeArg
 * - ASTNodeCondition
 * - ASTNodeExpr
 * - ASTNodeNonterminal
 * - ASTNodeProduction
 * - ASTNodeGoal
 */
export class ASTNodeEbnf extends ASTNode {
	constructor (
		parse_node: ParseNode | Token,
		attributes: {[key: string]: boolean | number | string} = {},
		children:   readonly ASTNode[] = [],
	) {
		super(parse_node, attributes, children);
	}
}
