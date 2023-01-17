import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {Instruction} from './Instruction.js';
import type {InstructionNone} from './InstructionNone.js';
import type {InstructionStatement} from './InstructionStatement.js';
import type {InstructionDeclareGlobal} from './InstructionDeclareGlobal.js';



/**
 * Create a program.
 */
export class InstructionModule extends Instruction {
	/**
	 * @param comps the components of the program
	 */
	constructor (private readonly comps: Array<string | InstructionNone | InstructionStatement | InstructionDeclareGlobal> = []) {
		super()
	}
	/**
	 * @return a new module containing the components
	 */
	override toString(): string {
		return xjs.String.dedent`
			(module
				${ this.comps.join('\n') }
			)
		`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		this.comps.forEach((comp) => {
			// TODO: use xjs.Array.aggregateForEach
			(comp instanceof Instruction) && comp.buildBin(mod);
		});
		mod.optimize();
		return mod.validate();
	}
}
