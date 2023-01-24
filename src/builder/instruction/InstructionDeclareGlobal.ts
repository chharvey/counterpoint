import type binaryen from 'binaryen';
import {Instruction} from './Instruction.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionGlobal} from './InstructionGlobal.js';



/**
 * Declare a global variable.
 */
export class InstructionDeclareGlobal extends Instruction {
	/** The readable variable name. */
	private readonly name: string;

	/**
	 * @param id   a unique id number
	 * @param mut  is the variable mutable? (may it be reassigned?)
	 * @param init the initial value of the variable
	 */
	constructor (
		id: bigint,
		private readonly mut: boolean,
		private readonly init: InstructionExpression,
	) {
		super();
		this.name = InstructionGlobal.friendlyName(id);
	}
	/** @return `'(global ‹name› ‹type› ‹init›)'` */
	override toString(): string {
		const type: string = (!this.init.isFloat) ? 'i32' : 'f64';
		return `(global $${ this.name } ${ (this.mut) ? `(mut ${ type })` : type } ${ this.init })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.GlobalRef {
		return mod.addGlobal(this.name, this.init.binType, this.mut, this.init.buildBin(mod));
	}
}
