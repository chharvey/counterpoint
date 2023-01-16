import * as xjs from 'extrajs';
import {Instruction} from './Instruction.js';



/**
 * Create a program.
 */
export class InstructionModule extends Instruction {
	/**
	 * @param comps the components of the program
	 */
	constructor (private readonly comps: (string | Instruction)[] = []) {
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
}
