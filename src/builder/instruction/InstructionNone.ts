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
}
