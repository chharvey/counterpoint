import {
	Operator,
	ValidOperatorComparative,
} from './package.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionBinop} from './InstructionBinop.js';



export class InstructionBinopComparative extends InstructionBinop {
	/**
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		op:   ValidOperatorComparative,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
		if (this.intarg && this.floatarg) {
			throw new TypeError(`Both operands must be either integers or floats, but not a mix.\nOperands: ${ this.arg0 } ${ this.arg1 }`)
		}
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	override toString(): string {
		return `(${ new Map<Operator, string>([
			[Operator.LT, (!this.floatarg) ? `i32.lt_s` : `f64.lt`],
			[Operator.GT, (!this.floatarg) ? `i32.gt_s` : `f64.gt`],
			[Operator.LE, (!this.floatarg) ? `i32.le_s` : `f64.le`],
			[Operator.GE, (!this.floatarg) ? `i32.ge_s` : `f64.ge`],
		]).get(this.op)! } ${ this.arg0 } ${ this.arg1 })`
	}
	get isFloat(): boolean {
		return false
	}
}
