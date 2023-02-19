import {
	Operator,
	ValidOperatorEquality,
} from './package.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionBinop} from './InstructionBinop.js';



export class InstructionBinopEquality extends InstructionBinop {
	/**
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	public constructor (
		op:   ValidOperatorEquality,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1);
	}

	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	public override toString(): string {
		return `(${
			(!this.arg0.isFloat && !this.arg1.isFloat) ? 'i32.eq' :
			(!this.arg0.isFloat &&  this.arg1.isFloat) ? 'call $i_f_id' :
			( this.arg0.isFloat && !this.arg1.isFloat) ? 'call $f_i_id' :
			new Map<Operator, string>([
				[Operator.ID, 'call $fid'],
				[Operator.EQ, 'f64.eq'],
			]).get(this.op)!
		} ${ this.arg0 } ${ this.arg1 })`;
	}

	public get isFloat(): boolean {
		return false;
	}
}
