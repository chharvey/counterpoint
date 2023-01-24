import type binaryen from 'binaryen';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Set a local variable.
 */
export class InstructionLocalSet extends InstructionLocal {
	// declare op: InstructionExpression;

	public constructor(
		index: number,
		protected override readonly op: InstructionExpression,
	) {
		super(index, op);
	}

	/** @return `'(local.set ‹name› ‹op›)'` */
	public override toString(): string {
		return `(local.set $${ this.name } ${ this.op })`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.set(Number(this.index), this.op.buildBin(mod));
	}
}
