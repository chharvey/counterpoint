import type binaryen from 'binaryen';
import {Instruction} from './Instruction.js';
import type {InstructionExpression} from './InstructionExpression.js';



/**
 * Declare a global variable.
 */
export class InstructionDeclareGlobal extends Instruction {
	public static friendlyName(id: bigint): string {
		return `$glb${ id.toString(16) }`; // must begin with `'$'`
	}


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
		this.name = InstructionDeclareGlobal.friendlyName(id);
	}
	/** @return `'(global ‹name› ‹type› ‹init›)'` */
	override toString(): string {
		const type: string = (!this.init.isFloat) ? 'i32' : 'f64';
		return `(global ${ this.name } ${ (this.mut) ? `(mut ${ type })` : type } ${ this.init })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.addGlobal(this.name, this.init.binType, this.mut, this.init.buildBin(mod));
	}
}
