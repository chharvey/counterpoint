import type binaryen from 'binaryen';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Set a local variable.
 */
export class InstructionLocalSet extends InstructionLocal {
	declare op: InstructionExpression;

	constructor (name: bigint | string, op: InstructionExpression) {
		super(name, op)
	}
	/** @return `'(local.set ‹name› ‹op›)'` */
	override toString(): string {
		return `(local.set ${ this.name } ${ this.op })`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const idx = +this.name; // TODO don’t allow string names
		return mod.local.set(idx, this.op.buildBin(mod));
	}
}
