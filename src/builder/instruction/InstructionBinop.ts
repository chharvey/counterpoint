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
	/** Is either one of the arguments of type `i32`? */
	protected readonly intarg: boolean = !this.arg0.isFloat || !this.arg1.isFloat;
	/** Is either one of the arguments of type `f64`? */
	protected readonly floatarg: boolean = this.arg0.isFloat || this.arg1.isFloat;
	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	public constructor (
		protected readonly op:   ValidOperatorBinary,
		protected readonly arg0: InstructionExpression,
		protected readonly arg1: InstructionExpression,
	) {
		super();
	}
}
