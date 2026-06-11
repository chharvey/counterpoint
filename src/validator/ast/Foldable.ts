import type {AstNode} from './AstNode.ts';



/**
 * Known implementers:
 * - Statement
 * - Block
 */
export interface Foldable extends AstNode {
	/**
	 * Return whether this node contains an expression of type `nothing` (the bottom type).
	 * For expressions, any sub-expression that’s of type `nothing` bubbles up.
	 * This method emulates that for statements and blocks.
	 */
	get hasBottomType(): boolean;
}
