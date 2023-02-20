import * as xjs from 'extrajs';
import {Instruction} from './Instruction.js';



/**
 * Create a program.
 */
export class InstructionModule extends Instruction {
	/**
	 * @param comps the components of the program
	 */
	public constructor (private readonly comps: Array<string | Instruction> = []) {
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
