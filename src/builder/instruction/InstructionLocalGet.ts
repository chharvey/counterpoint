import binaryen from 'binaryen';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Get a local variable.
 */
export class InstructionLocalGet extends InstructionLocal {
	public constructor(
		var_index: number,
		private readonly _binType: binaryen.Type,
	) {
		super(var_index);
	}

	public override get isFloat(): boolean {
		return this._binType === binaryen.f64;
	}

	public override get binType(): binaryen.Type {
		return this._binType;
	}

	/** @return `'(local.get ‹name›)'` */
	override toString(): string {
		return `(local.get $${ this.name })`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.get(this.index, this.binType);
	}
}
