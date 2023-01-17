import binaryen from 'binaryen';
import {Instruction} from './Instruction.js';
import type {InstructionExpression} from './InstructionExpression.js';



/**
 * Declare a global variable.
 */
export class InstructionDeclareGlobal extends Instruction {
	private readonly type: string = (this.init.isFloat) ? 'f64' : 'i32';
	/**
	 * @param name the variable name (must begin with `'$'`)
	 * @param mut  is the variable mutable? (may it be reassigned?)
	 * @param init the initial value of the variable
	 */
	constructor (
		private readonly name: bigint | string,
		private readonly mut: boolean,
		private readonly init: InstructionExpression,
	) {
		super();
		this.name = (typeof name === 'bigint') ? `$glb${ name.toString(16) }` : name;
	}
	/** @return `'(global ‹name› ‹type› ‹init›)'` */
	override toString(): string {
		return `(global ${ this.name } ${ (this.mut) ? `(mut ${ this.type })` : this.type } ${ this.init })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.addGlobal(this.name as string, (!this.init.isFloat) ? binaryen.i32 : binaryen.f64, this.mut, this.init.buildBin(mod));
	}
}
