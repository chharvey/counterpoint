import type {ValidOperatorBinary} from './package.js';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Perform a binary operation on the stack.
 * Known subclasses:
 * - InstructionBinopArithmetic
 * - InstructionBinopComparative
 * - InstructionBinopEquality
 * - InstructionBinopLogical
 */
export abstract class InstructionBinop extends InstructionExpression {
	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		protected readonly op:   ValidOperatorBinary,
		protected readonly arg0: InstructionExpression,
		protected readonly arg1: InstructionExpression,
	) {
		super()
	}

	/**
	 * Ensure that both args are either both ints or both floats.
	 * @throw if one arg is an int and the other is a float
	 */
	protected typecheckArgs(): void {
		if (this.arg0.binType !== this.arg1.binType) {
			throw new TypeError(`Both operands must be the same type.\nOperands: ${ this.arg0 } ${ this.arg1 }`);
		}
	}
}
