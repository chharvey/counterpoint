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
}
