import binaryen from 'binaryen';
import {
	Operator,
	ValidOperatorComparative,
} from './package.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionBinop} from './InstructionBinop.js';



export class InstructionBinopComparative extends InstructionBinop {
	public override readonly binType: binaryen.Type = binaryen.i32;
	private readonly eitherFloats: boolean = [this.arg0.binType, this.arg1.binType].includes(binaryen.f64);

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
		this.typecheckArgs();
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	override toString(): string {
		return `(${ new Map<binaryen.Type, ReadonlyMap<Operator, string>>([
			[binaryen.i32, new Map<Operator, string>([
				[Operator.LT, 'i32.lt_s'],
				[Operator.GT, 'i32.gt_s'],
				[Operator.LE, 'i32.le_s'],
				[Operator.GE, 'i32.ge_s'],
			])],
			[binaryen.f64, new Map<Operator, string>([
				[Operator.LT, 'f64.lt'],
				[Operator.GT, 'f64.gt'],
				[Operator.LE, 'f64.le'],
				[Operator.GE, 'f64.ge'],
			])],
		]).get((!this.eitherFloats) ? binaryen.i32 : binaryen.f64)!.get(this.op)! } ${ this.arg0 } ${ this.arg1 })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const [left, right] = [this.arg0, this.arg1].map((arg) => arg.buildBin(mod));
		const opname = new Map<Operator, 'lt' | 'gt' | 'le' | 'ge'>([
			[Operator.LT, 'lt'],
			[Operator.GT, 'gt'],
			[Operator.LE, 'le'],
			[Operator.GE, 'ge'],
		]).get(this.op)!;
		return ((!this.eitherFloats)
			? mod.i32[`${ opname }_s`]
			: mod.f64[opname])(left, right);
	}
}
