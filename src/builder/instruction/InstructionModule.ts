import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {Builder} from './package.js';
import {Instruction} from './Instruction.js';
import type {InstructionFunction} from './InstructionFunction.js';



/**
 * Create a program.
 */
export class InstructionModule extends Instruction {
	/**
	 * @param comps the components of the program
	 */
	public constructor(private readonly comps: InstructionFunction[] = []) {
		super()
	}
	/**
	 * @return a new module containing the components
	 */
	override toString(): string {
		return xjs.String.dedent`
			(module
				${ [...Builder.IMPORTS, ...this.comps].join('\n') }
			)
		`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		this.comps.forEach((comp) => {
			// TODO: use xjs.Array.aggregateForEach
			comp.buildBin(mod);
		});
		mod.optimize();
		return mod.validate();
	}
}
