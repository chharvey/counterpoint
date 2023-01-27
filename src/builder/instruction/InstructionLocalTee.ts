import type binaryen from 'binaryen';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Tee a local variable.
 */
export class InstructionLocalTee extends InstructionLocal {
	public constructor(
		var_index: number,
		private readonly op: InstructionExpression,
	) {
		super(var_index);
	}

	public override get isFloat(): boolean {
		return this.op.isFloat;
	}

	/** @return `'(local.tee ‹name› ‹op›)'` */
	override toString(): string {
		return `(local.tee $${ this.name } ${ this.op })`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.tee(this.index, this.op.buildBin(mod), this.binType);
	}
}
