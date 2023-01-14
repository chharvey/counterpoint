import {Instruction} from './Instruction.js';



/**
 * Throw an error at runtime.
 */
export class InstructionUnreachable extends Instruction {
	/**
	 * @return `'(unreachable)'`
	 */
	override toString(): string {
		return `(unreachable)`
	}
}
