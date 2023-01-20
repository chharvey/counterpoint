import type binaryen from 'binaryen';
import {Instruction} from './Instruction.js';



/**
 * Declare a local variable.
 */
export class InstructionDeclareLocal extends Instruction {
	public static friendlyName(index: bigint): string {
		return `$var${ index.toString(16) }`; // must begin with `'$'`
	}


	/** The readable variable name. */
	private readonly name: string;

	/**
	 * @param index    the index of the variable
	 * @param to_float `true` if declaring a float
	 */
	constructor (
		index: bigint,
		private readonly to_float: boolean,
	) {
		super();
		this.name = InstructionDeclareLocal.friendlyName(index);
	}
	/** @return `'(local ‹name› ‹type›)'` */
	override toString(): string {
		return `(local ${ this.name } ${ (this.to_float) ? 'f64' : 'i32' })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		throw mod && '`InstructionDeclareLocal#buildBin` not yet supported.';
	}
}
