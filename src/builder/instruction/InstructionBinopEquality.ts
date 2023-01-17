import binaryen from 'binaryen';
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
	constructor (
		op:   ValidOperatorEquality,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	override toString(): string {
		return `(${
			(!this.arg0.isFloat && !this.arg1.isFloat) ? `i32.eq` :
			(!this.arg0.isFloat &&  this.arg1.isFloat) ? `call $i_f_id` :
			( this.arg0.isFloat && !this.arg1.isFloat) ? `call $f_i_id` :
			new Map<Operator, string>([
				[Operator.ID, `call $fid`],
				[Operator.EQ, `f64.eq`],
			]).get(this.op)!
		} ${ this.arg0 } ${ this.arg1 })`
	}
	get isFloat(): boolean {
		return false
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const [left, right] = [this.arg0, this.arg1].map((arg) => arg.buildBin(mod));
		return (
			(!this.arg0.isFloat && !this.arg1.isFloat) ? mod.i32.eq(left, right) : // `ID` and `EQ` give the same result
			(!this.arg0.isFloat &&  this.arg1.isFloat) ? mod.call('$i_f_id', [left, right], binaryen.i32) :
			( this.arg0.isFloat && !this.arg1.isFloat) ? mod.call('$f_i_id', [left, right], binaryen.i32) :
			( this.arg0.isFloat &&  this.arg1.isFloat,   (this.op === Operator.ID)
				? mod.call('$fid', [left, right], binaryen.i32)
				: mod.f64.eq(left, right)
			)
		);
	}
}
