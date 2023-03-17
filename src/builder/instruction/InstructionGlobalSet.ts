import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionGlobal} from './InstructionGlobal.js';



/**
 * Set a global variable.
 */
export class InstructionGlobalSet extends InstructionGlobal {
	public constructor(name: bigint | string, op: InstructionExpression) {
		super(name, op);
	}

	/** @return `'(global.set ‹name› ‹op›)'` */
	public override toString(): string {
		return `(global.set ${ this.name } ${ this.op })`;
	}
}
