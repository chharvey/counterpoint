import type binaryen from 'binaryen';
import {Instruction} from './Instruction.js';



/**
 * Do nothing at runtime.
 */
export class InstructionNop extends Instruction {
	/**
	 * @return `'(nop)'`
	 */
	override toString(): string {
		return `(nop)`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.nop();
	}
}
