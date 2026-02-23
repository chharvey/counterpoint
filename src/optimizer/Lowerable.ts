import type {Optimizer} from './index.ts';



/**
 * Known implementers:
 * - ASTNodeDeclarationVariable
 * - ASTNodeStatementExpression
 * - ASTNodeAssignment // TODO: Reassignment
 * - // TODO: Conditional
 * - // TODO: Loop
 * - // TODO: Iteration
 * - // TODO: Break
 * - ASTNodeGoal
 */
export interface Lowerable<Return extends null> {
	/**
	 * Lowers this AST node or folded value to a high-level IR instruction.
	 * @param  optimizer the set of instructions to build the IR
	 * @return           an optimized value if present
	 */
	lower(optimizer: Optimizer): Return;
}
