import type {Builder} from '../../index.ts';
import type {AstNode} from './AstNode.ts';



/**
 * Known implementers:
 * - Statement
 * - Block
 * - Goal
 */
export interface Buildable extends AstNode {
	/**
	 * Builds a high-level IR instruction from thie AST node.
	 * @param  optimizer the set of instructions to build the IR
	 * @return           an optimized value if present
	 */
	build(optimizer: Builder): void;
}
