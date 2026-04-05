import type {Optimizer} from '../../index.ts';
import type {AstNode} from './AstNode.ts';



/**
 * Known implementers:
 * - Statement
 * - Block
 * - Goal
 */
export interface Lowerable extends AstNode {
	/**
	 * Lowers this AST node to a high-level IR instruction.
	 * @param  optimizer the set of instructions to build the IR
	 * @return           an optimized value if present
	 */
	lower(optimizer: Optimizer): void;
}
