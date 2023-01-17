import {Instruction} from './Instruction.js';



/**
 * Absence of instruction.
 */
export class InstructionNone extends Instruction {
	/**
	 * @return `''`
	 */
	override toString(): string {
		return ''
	}

	override buildBin() {
		// TODO: delete this class and use InstructionNop instead
		return 0;
	}
}
