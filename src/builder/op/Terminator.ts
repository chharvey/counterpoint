import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {runOnceSetter} from '../../lib/index.ts';
import {Opcode} from './Opcode.ts';



/**
 * A Terminator is the last instruction of a block. It links the block to its destination.
 *
 * Known subclasses:
 * - Goto
 * - GotoConditional
 * - EndProgram
 */
export abstract class Terminator extends Opcode {
	protected _containerLabel?: string;

	@runOnceSetter
	public set containerLabel(label: string) {
		this._containerLabel = label;
	}

	/**
	 * Generate assembly code.
	 * Creates an edge from this Terminator’s containing block to a destination block.
	 * @param cg        code-generator
	 * @param relooper  Binaryen Relooper for constructing Binaryen `blocks`
	 * @param blockrefs code-generated `CfgNode`s
	 */
	public abstract codegen(cg: CodeGenerator, relooper: binaryen.Relooper, blockrefs: ReadonlyMap<string, binaryen.RelooperBlockRef>): void;
}
