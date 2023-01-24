import type binaryen from 'binaryen';
import {Instruction} from './Instruction.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Declare a local variable.
 */
export class InstructionDeclareLocal extends Instruction {
	/** The readable variable name. */
	private readonly name: string;

	/**
	 * @param index    the index of the variable
	 * @param to_float `true` if declaring a float
	 */
	constructor (
		index: number,
		private readonly to_float: boolean,
	) {
		super();
		this.name = InstructionLocal.friendlyName(index);
	}
	/** @return `'(local ‹name› ‹type›)'` */
	override toString(): string {
		return `(local $${ this.name } ${ (!this.to_float) ? 'i32' : 'f64' })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		throw mod && '`InstructionDeclareLocal#buildBin` not yet supported.';
	}
}
