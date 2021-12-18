import type {
	NonemptyArray,
	ParseNode,
} from './package.js';
import {ASTNodeExpr} from './ASTNodeExpr.js';



/**
 * Known subclasses:
 * - ASTNodeOpUn
 * - ASTNodeOpBin
 */
export abstract class ASTNodeOp extends ASTNodeExpr {
	constructor (parse_node: ParseNode, operator: number, operands: Readonly<NonemptyArray<ASTNodeExpr>>) {
		super(parse_node, {operator}, operands);
	}
}
