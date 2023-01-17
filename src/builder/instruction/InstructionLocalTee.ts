import type binaryen from 'binaryen';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Tee a local variable.
 */
export class InstructionLocalTee extends InstructionLocal {
	declare op: InstructionExpression;

	constructor (name: bigint | string, op: InstructionExpression) {
		super(name, op)
	}
	/** @return `'(local.tee ‹name› ‹op›)'` */
	override toString(): string {
		return `(local.tee ${ this.name } ${ this.op })`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const idx = +this.name; // TODO don’t allow string names
		return mod.local.tee(idx, this.op.buildBin(mod), this.binType);
	}
}
