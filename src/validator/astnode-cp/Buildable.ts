import type binaryen from 'binaryen';
import type {
	INST,
	Builder,
} from './package.js';
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
	build(builder: Builder): INST.Instruction | binaryen.ExpressionRef | binaryen.Module;
}
