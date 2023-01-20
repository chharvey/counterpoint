import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Set a local variable.
 */
export class InstructionLocalSet extends InstructionLocal {
	public constructor(name: bigint | string, op: InstructionExpression) {
		super(name, op);
	}

	/** @return `'(local.set ‹name› ‹op›)'` */
	public override toString(): string {
		return `(local.set ${ this.name } ${ this.op })`;
	}
}
