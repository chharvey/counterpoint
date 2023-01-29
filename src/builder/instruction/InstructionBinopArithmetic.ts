import binaryen from 'binaryen';
import {
	Operator,
	ValidOperatorArithmetic,
} from './package.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionBinop} from './InstructionBinop.js';



export class InstructionBinopArithmetic extends InstructionBinop {
	public override readonly binType: typeof binaryen.i32 | typeof binaryen.f64 = (![this.arg0.binType, this.arg1.binType].includes(binaryen.f64)) ? binaryen.i32 : binaryen.f64;

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
		return `(${ new Map<binaryen.Type, ReadonlyMap<Operator, string>>([
			[binaryen.i32, new Map<Operator, string>([
				[Operator.EXP, 'call $exp'],
				[Operator.MUL, 'i32.mul'],
				[Operator.DIV, 'i32.div_s'],
				[Operator.ADD, 'i32.add'],
				[Operator.SUB, 'i32.sub'],
			])],
			[binaryen.f64, new Map<Operator, string>([
				[Operator.EXP, '(unreachable)'], // TODO: support runtime exponentiation for floats
				[Operator.MUL, 'f64.mul'],
				[Operator.DIV, 'f64.div'],
				[Operator.ADD, 'f64.add'],
				[Operator.SUB, 'f64.sub'],
			])],
		]).get(this.binType)!.get(this.op)! } ${ this.arg0 } ${ this.arg1 })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const [left, right] = [this.arg0, this.arg1].map((arg) => arg.buildBin(mod));
		if (this.op === Operator.EXP) {
			return new Map<binaryen.Type, binaryen.ExpressionRef>([
				[binaryen.i32, mod.call('exp', [left, right], binaryen.i32)],
				[binaryen.f64, mod.unreachable()], // TODO: support runtime exponentiation for floats
			]).get(this.binType)!;
		}
		if (this.op === Operator.DIV) {
			return new Map<binaryen.Type, binaryen.ExpressionRef>([
				[binaryen.i32, mod.i32.div_s(left, right)],
				[binaryen.f64, mod.f64.div(left, right)],
			]).get(this.binType)!;
		}
		return mod[this.binTypeString][new Map<Operator, 'mul' | 'add' | 'sub'>([
			[Operator.MUL, 'mul'],
			[Operator.ADD, 'add'],
			[Operator.SUB, 'sub'],
		]).get(this.op)!](left, right);
	}
}
