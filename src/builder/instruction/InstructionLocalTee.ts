import type binaryen from 'binaryen';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Tee a local variable.
 */
export class InstructionLocalTee extends InstructionLocal {
	public override readonly binType: binaryen.Type = this.op.binType;

	public constructor(
		var_index: number,
		private readonly op: InstructionExpression,
	) {
		super(var_index);
	}

	/** @return `'(local.tee ‹name› ‹op›)'` */
	public override toString(): string {
		return `(local.tee $${ this.name } ${ this.op })`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.tee(this.index, this.op.buildBin(mod), this.binType);
	}
}
