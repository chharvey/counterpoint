import type {
	Builder,
	Instruction,
} from '../builder/index.js';
import type {ASTNodeSolid} from './index.js';



export interface Buildable extends ASTNodeSolid {
	/**
	 * Give directions to the runtime code builder.
	 * @param builder the builder to direct
	 * @return the directions to print
	 */
	build(builder: Builder): Instruction;
}
