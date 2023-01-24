import type binaryen from 'binaryen';
import {InstructionGlobal} from './InstructionGlobal.js';



/**
 * Get a global variable.
 */
export class InstructionGlobalGet extends InstructionGlobal {
	public constructor(id: bigint, to_float: boolean = false) {
		super(id, to_float);
	}
	/** @return `'(global.get ‹name›)'` */
	override toString(): string {
		return `(global.get $${ this.name })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.global.get(this.name, this.binType);
	}
}
