import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocal} from './InstructionLocal.js';



/**
 * Tee a local variable.
 */
export class InstructionLocalTee extends InstructionLocal {
	constructor (name: bigint | string, op: InstructionExpression) {
		super(name, op)
	}
	/** @return `'(local.tee ‹name› ‹op›)'` */
	override toString(): string {
		return `(local.tee ${ this.name } ${ this.op })`
	}
}
