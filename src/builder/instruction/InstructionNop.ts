import {Instruction} from './Instruction.js';



/**
 * Do nothing at runtime.
 */
export class InstructionNop extends Instruction {
	/**
	 * @return `'(nop)'`
	 */
	public override toString(): string {
		return '(nop)';
	}
}
