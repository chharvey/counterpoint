import type binaryen from 'binaryen';
import {Instruction} from './Instruction.js';
import type {InstructionExpression} from './InstructionExpression.js';



/**
 * Create a new operand stack.
 */
export class InstructionStatement extends Instruction {
	/**
	 * @param count the index of the statement within its scope
	 * @param expr the expression
	 */
	constructor (
		private readonly count: bigint,
		private readonly expr: InstructionExpression,
	) {
		super()
		this.count;
	}
	/**
	 * @return a new function evaluating the argument
	 */
	override toString(): string {
		return this.expr.toString();
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return this.expr.buildBin(mod);
	}
}
