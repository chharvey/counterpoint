import type {
	EBNFObject,
	EBNFChoice,
} from './package.js';
import type {ConcreteNonterminal} from './utils-private.js';
import {ASTNodeEbnf} from './ASTNodeEbnf.js';



/**
 * Known subclasses:
 * - ASTNodeConst
 * - ASTNodeRef
 * - ASTNodeItem
 * - ASTNodeOp
 */
export abstract class ASTNodeExpr extends ASTNodeEbnf {
	/**
	 * Transform this semantic expression into JSON data.
	 * @param   nt         a specific nonterminal symbol that contains this expression
	 * @param   has_params whether the general nonterminal defined has parameters and thus creates a family of similar nonterminals
	 * @param   data       the bank of JSON data
	 * @returns            data representing an EBNF choice
	 */
	abstract transform(nt: ConcreteNonterminal, has_params: boolean, data: EBNFObject[]): EBNFChoice;
}
