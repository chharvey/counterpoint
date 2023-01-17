import type binaryen from 'binaryen';
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

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.unreachable();
	}
}
