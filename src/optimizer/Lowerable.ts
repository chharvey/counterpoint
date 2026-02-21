import type {
	Optimizer,
	CFG,
} from './index.ts';



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
	 * @param  optimizer the set of instructions to build the IR
	 * @return           an optimized value if present
	 */
	lower(optimizer: Optimizer): CFG.Instruction | null;
}
