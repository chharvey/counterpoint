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
	protected readonly intarg: boolean = !this.arg0.isFloat || !this.arg1.isFloat
	/** Is either one of the arguments of type `f64`? */
	protected readonly floatarg: boolean = this.arg0.isFloat || this.arg1.isFloat
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
		if (this.intarg && this.floatarg) {
			throw new TypeError(`Both operands must be either integers or floats, but not a mix.\nOperands: ${ this.arg0 } ${ this.arg1 }`);
		}
	}
}
