import {Instruction} from './Instruction.js';



/**
 * Declare a local variable.
 */
export class InstructionDeclareLocal extends Instruction {
	/**
	 * @param name the variable name (must begin with `'$'`)
	 * @param to_float `true` if declaring a float
	 */
	constructor (
		private readonly name: string,
		private readonly to_float: boolean,
	) {
		super();
	}
	/** @return `'(local ‹name› ‹type›)'` */
	override toString(): string {
		return `(local ${ this.name } ${ (this.to_float) ? 'f64' : 'i32' })`;
	}
}
