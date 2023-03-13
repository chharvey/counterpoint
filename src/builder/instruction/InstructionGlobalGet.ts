import {InstructionGlobal} from './InstructionGlobal.js';



/**
 * Get a global variable.
 */
export class InstructionGlobalGet extends InstructionGlobal {
	public constructor(name: bigint | string, to_float: boolean = false) {
		super(name, to_float);
	}

	/** @return `'(global.get ‹name›)'` */
	public override toString(): string {
		return `(global.get ${ this.name })`;
	}
}
