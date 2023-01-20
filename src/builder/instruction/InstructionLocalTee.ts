import type binaryen from 'binaryen';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Tee a local variable.
 */
export class InstructionLocalTee extends InstructionLocal {
	declare op: InstructionExpression;

	public constructor(index: number, op: InstructionExpression) {
		super(index, op);
	}
	/** @return `'(local.tee ‹name› ‹op›)'` */
	override toString(): string {
		return `(local.tee ${ this.name } ${ this.op })`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.local.tee(Number(this.index), this.op.buildBin(mod), this.binType);
	}
}
