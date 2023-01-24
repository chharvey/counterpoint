import type binaryen from 'binaryen';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Get a local variable.
 */
export class InstructionLocalGet extends InstructionLocal {
	public constructor(index: number, to_float: boolean = false) {
		super(index, to_float);
	}
	/** @return `'(local.get ‹name›)'` */
	override toString(): string {
		return `(local.get $${ this.name })`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.get(Number(this.index), this.binType);
	}
}
