import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {Builder} from './package.js';
import {Instruction} from './Instruction.js';
import type {InstructionDeclareGlobal} from './InstructionDeclareGlobal.js';
import type {InstructionFunction} from './InstructionFunction.js';



/**
 * Create a program.
 */
export class InstructionModule extends Instruction {
	/**
	 * @param comps the components of the program
	 */
	public constructor(private readonly comps: readonly (InstructionDeclareGlobal | InstructionFunction)[] = []) {
		super();
	}

	/**
	 * @return a new module containing the components
	 */
	public override toString(): string {
		return xjs.String.dedent`
			(module
				${ [...Builder.IMPORTS, ...this.comps].join('\n') }
			)
		`;
	}

	public override buildBin(mod: binaryen.Module): number {
		this.comps.forEach((comp) => {
			comp.buildBin(mod);
		});
		const validation = mod.validate();
		if (!validation) {
			throw new Error('Invalid WebAssembly module.');
		}
		return validation;
	}
}
