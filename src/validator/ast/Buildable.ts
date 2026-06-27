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
	 * @param  builder the IR-builder
	 * @return         an IR value if present
	 */
	build(builder: Builder): void;
}
