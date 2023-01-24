import type binaryen from 'binaryen';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Tee a local variable.
 */
export class InstructionLocalTee extends InstructionLocal {
	public constructor(
		index: number,
		protected override readonly op: InstructionExpression,
	) {
		super(index, op);
	}

	/** @return `'(local.tee ‹name› ‹op›)'` */
	public override toString(): string {
		return `(local.tee $${ this.name } ${ this.op })`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.tee(Number(this.index), this.op.buildBin(mod), this.binType);
	}
}
