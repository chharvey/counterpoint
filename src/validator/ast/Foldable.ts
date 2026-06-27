import type {AstNode} from './AstNode.ts';



/**
 * Known implementers:
 * - Statement
 * - Block
 *
 * Note: For `Expression` objects, just use the result of `Expression#fold()`.
 */
export interface Foldable extends AstNode {
	/** Return whether this node may be omitted from the compiled output when built. */
	get isFoldable(): boolean;

	/**
	 * Return whether this node contains an expression of type `nothing` (the bottom type).
	 * For expressions, any sub-expression that’s of type `nothing` bubbles up.
	 * This method emulates that for statements and blocks.
	 */
	get hasBottomType(): boolean;
}
