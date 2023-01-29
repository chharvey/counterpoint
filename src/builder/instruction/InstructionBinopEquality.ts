import binaryen from 'binaryen';
import {
	Operator,
	ValidOperatorEquality,
} from './package.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionBinop} from './InstructionBinop.js';



export class InstructionBinopEquality extends InstructionBinop {
	public override readonly binType: binaryen.Type = binaryen.i32;

	/**
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	public constructor(
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
			(this.arg0.binType === binaryen.i32 && this.arg1.binType === binaryen.i32) ? 'i32.eq' :
			(this.arg0.binType === binaryen.i32 && this.arg1.binType === binaryen.f64) ? 'call $i_f_id' :
			(this.arg0.binType === binaryen.f64 && this.arg0.binType === binaryen.i32) ? 'call $f_i_id' :
			(this.arg0.binType === binaryen.f64 && this.arg0.binType === binaryen.f64, new Map<Operator, string>([
				[Operator.ID, 'call $fid'],
				[Operator.EQ, 'f64.eq'],
			]).get(this.op)!)
		} ${ this.arg0 } ${ this.arg1 })`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const [left, right] = [this.arg0, this.arg1].map((arg) => arg.buildBin(mod));
		return (
			(this.arg0.binType === binaryen.i32 && this.arg1.binType === binaryen.i32) ? mod.i32.eq(left, right) : // `ID` and `EQ` give the same result
			(this.arg0.binType === binaryen.i32 && this.arg1.binType === binaryen.f64) ? mod.call('i_f_id', [left, right], binaryen.i32) :
			(this.arg0.binType === binaryen.f64 && this.arg1.binType === binaryen.i32) ? mod.call('f_i_id', [left, right], binaryen.i32) :
			(this.arg0.binType === binaryen.f64 && this.arg1.binType === binaryen.f64,   (this.op === Operator.ID)
				? mod.call('fid', [left, right], binaryen.i32)
				: mod.f64.eq(left, right)
			)
		);
	}
}
