import type {
	Instruction,
	Builder,
} from './package.js';
import type {ASTNodeCP} from './ASTNodeCP.js';



export interface Buildable extends ASTNodeCP {
	/**
	 * Give directions to the runtime code builder.
	 * @param builder the builder to direct
	 * @return the directions to print
	 */
	build(builder: Builder): Instruction;
}
