import type binaryen from 'binaryen';
import type {ASTNodeCP} from './ASTNodeCP.ts';



/**
 * Known implementers:
 * - ASTNodeExpression
 * - ASTNodeStatement
 * - ASTNodeGoal
 */
export interface Buildable extends ASTNodeCP {
	/**
	 * Give directions to the runtime code builder.
	 * @return the directions to print
	 */
	build(): binaryen.ExpressionRef;
}
