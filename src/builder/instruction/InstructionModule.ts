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
	public constructor(private readonly comps: Array<string | InstructionNone | InstructionStatement | InstructionDeclareGlobal> = []) {
		super();
	}

	/**
	 * @return a new module containing the components
	 */
	public override toString(): string {
		return xjs.String.dedent`
			(module
				${ this.comps.join('\n') }
			)
		`;
	}
}
