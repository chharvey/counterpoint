import type binaryen from 'binaryen';
import type {AstNode} from './AstNode.ts';



/**
 * Known implementers:
 * - Expression
 * - Statement
 * - Block
 * - Goal
 */
export interface Buildable extends AstNode {
	/**
	 * Give directions to the runtime code builder.
	 * @return the directions to print
	 */
	build(): binaryen.ExpressionRef;
}
