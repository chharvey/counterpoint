import type binaryen from 'binaryen';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Get a local variable.
 */
export class InstructionLocalGet extends InstructionLocal {
	public override readonly binType: binaryen.Type = this._binType;

	public constructor(
		var_index: number,
		private readonly _binType: binaryen.Type,
	) {
		super(var_index);
	}

	/** @return `'(local.get ‹name›)'` */
	public override toString(): string {
		return `(local.get $${ this.name })`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.get(this.index, this.binType);
	}
}
