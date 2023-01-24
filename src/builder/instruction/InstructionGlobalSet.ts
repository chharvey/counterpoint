import type binaryen from 'binaryen';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionGlobal} from './InstructionGlobal.js';



/**
 * Set a global variable.
 */
export class InstructionGlobalSet extends InstructionGlobal {
	public constructor(
		id: bigint,
		protected override readonly op: InstructionExpression,
	) {
		super(id, op);
	}

	/** @return `'(global.set ‹name› ‹op›)'` */
	public override toString(): string {
		return `(global.set $${ this.name } ${ this.op })`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.global.set(this.name, this.op.buildBin(mod));
	}
}
