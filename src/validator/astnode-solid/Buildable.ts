import type {
	INST,
	Builder,
} from './package.js';
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
	 * @param builder the builder to direct
	 * @return the directions to print
	 */
	build(builder: Builder): INST.Instruction;
}
