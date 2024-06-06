import type binaryen from 'binaryen';
import type {ASTNodeSolid} from './ASTNodeSolid.js';



/**
 * Known implementers:
 * - ASTNodeExpression
 * - ASTNodeStatement
 * - ASTNodeGoal
 */
export interface Buildable extends ASTNodeSolid {
	/**
	 * Give directions to the runtime code builder.
	 * @return the directions to print
	 */
	build(): binaryen.ExpressionRef;
}
