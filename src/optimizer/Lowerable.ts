import type {Optimizer} from './index.ts';



/**
 * Known implementers:
 * - ASTNodeStatement
 * - ASTNodeGoal
 */
export interface Lowerable {
	/**
	 * Lowers this AST node to a high-level IR instruction.
	 * @param  optimizer the set of instructions to build the IR
	 * @return           an optimized value if present
	 */
	lower(optimizer: Optimizer): void;
}
