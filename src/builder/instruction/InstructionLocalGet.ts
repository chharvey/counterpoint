import type binaryen from 'binaryen';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Get a local variable.
 */
export class InstructionLocalGet extends InstructionLocal {
	constructor (name: bigint | string, to_float: boolean = false) {
		super(name, to_float)
	}
	/** @return `'(local.get ‹name›)'` */
	override toString(): string {
		return `(local.get ${ this.name })`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const idx = +this.name; // TODO don’t allow string names
		return mod.local.get(idx, this.binType);
	}
}
