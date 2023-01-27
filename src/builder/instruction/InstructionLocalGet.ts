import binaryen from 'binaryen';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Get a local variable.
 */
export class InstructionLocalGet extends InstructionLocal {
	public constructor(var_index: number, bin_type: binaryen.Type) {
		super(var_index, bin_type === binaryen.f64);
	}
	/** @return `'(local.get ‹name›)'` */
	override toString(): string {
		return `(local.get $${ this.name })`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.get(Number(this.index), this.binType);
	}
}
