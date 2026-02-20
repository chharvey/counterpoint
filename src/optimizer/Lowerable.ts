import type {CFG} from './index.ts';



/**
 * Known implementers:
 * - ASTNodeExpression
 * - ASTNodeDeclarationVariable
 * - ASTNodeStatementExpression
 * - ASTNodeAssignment // TODO: Reassignment
 * - // TODO: Conditional
 * - // TODO: Loop
 * - // TODO: Iteration
 * - // TODO: Break
 * - ASTNodeGoal
 * - VALUE.Value
 */
export interface Lowerable {
	/**
	 * Lowers this AST node or folded value to a high-level IR instruction.
	 * @return an optimized value if present
	 */
	lower(): CFG.Value | null;
}
