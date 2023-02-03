import binaryen from 'binaryen';
import type {ValidOperatorBinary} from './package.js';
import {InstructionExpression} from './InstructionExpression.js';
import {InstructionConvert} from './InstructionConvert.js';



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
	 * Coerce either operand from an i32 into an f64 if necessary and possible.
	 * @param arg0 the left argument
	 * @param arg1 the right argument
	 * @return the pair of arguments, updated
	 * @throws if the arguments have different types even after the coercion
	 */
	public static coerceOperands(arg0: InstructionExpression, arg1: InstructionExpression): [InstructionExpression, InstructionExpression] {
		if ([arg0.binType, arg1.binType].includes(binaryen.f64)) {
			if (arg0.binType === binaryen.i32) {
				arg0 = new InstructionConvert(arg0);
			}
			if (arg1.binType === binaryen.i32) {
				arg1 = new InstructionConvert(arg1);
			}
			if (arg0.binType !== arg1.binType) {
				throw new TypeError(`Both operands must be the same type.\nOperands: ${ arg0 } ${ arg1 }`);
			}
		}
		return [arg0, arg1];
	}


	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	public constructor(
		protected readonly op:   ValidOperatorBinary,
		protected readonly arg0: InstructionExpression,
		protected readonly arg1: InstructionExpression,
	) {
		super();
	}
}
