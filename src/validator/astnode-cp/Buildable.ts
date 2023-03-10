import type binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import type {ASTNodeCP} from './ASTNodeCP.js';



/**
 * Known implementers:
 * - ASTNodeExpression
 * - ASTNodeStatement
 * - ASTNodeGoal
 */
export interface Buildable extends ASTNodeCP {
	/**
	 * Give directions to the runtime code builder.
	 * @param builder the builder to direct
	 * @return the directions to print
	 */
	build(builder: Builder): binaryen.ExpressionRef | binaryen.Module;
}
