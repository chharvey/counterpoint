import {InstructionLocal} from './InstructionLocal.js';



/**
 * Get a local variable.
 */
export class InstructionLocalGet extends InstructionLocal {
	public constructor(name: bigint | string, to_float: boolean = false) {
		super(name, to_float);
	}

	/** @return `'(local.get ‹name›)'` */
	public override toString(): string {
		return `(local.get ${ this.name })`;
	}
}
