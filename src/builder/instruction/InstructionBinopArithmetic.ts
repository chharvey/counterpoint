import binaryen from 'binaryen';
import {
	Operator,
	ValidOperatorArithmetic,
} from './package.js';
import {InstructionUnreachable} from './InstructionUnreachable.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionBinop} from './InstructionBinop.js';



export class InstructionBinopArithmetic extends InstructionBinop {
	/**
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		op:   ValidOperatorArithmetic,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
		this.typecheckArgs();
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	override toString(): string {
		return `(${ new Map<Operator, string>([
			[Operator.EXP, (!this.floatarg) ? `call $exp` : new InstructionUnreachable().toString()], // TODO Runtime exponentiation not yet supported.
			[Operator.MUL, (!this.floatarg) ? `i32.mul`   : `f64.mul`],
			[Operator.DIV, (!this.floatarg) ? `i32.div_s` : `f64.div`],
			[Operator.ADD, (!this.floatarg) ? `i32.add`   : `f64.add`],
			[Operator.SUB, (!this.floatarg) ? `i32.sub`   : `f64.sub`],
		]).get(this.op)! } ${ this.arg0 } ${ this.arg1 })`
	}
	get isFloat(): boolean {
		return this.floatarg
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const [left, right] = [this.arg0, this.arg1].map((arg) => arg.buildBin(mod));
		if (this.op === Operator.EXP) {
			return (this.floatarg)
				? new InstructionUnreachable().buildBin(mod) // TODO: support runtime exponentiation for floats
				: mod.call('$exp', [left, right], binaryen.i32);
		}
		if (this.op === Operator.DIV) {
			return !this.floatarg
				? mod.i32.div_s(left, right)
				: mod.f64.div(left, right);
		}
		return mod[(!this.floatarg) ? 'i32' : 'f64'][new Map<Operator, 'mul' | 'add' | 'sub'>([
			[Operator.MUL, 'mul'],
			[Operator.ADD, 'add'],
			[Operator.SUB, 'sub'],
		]).get(this.op)!](left, right);
	}
}
