import binaryen from 'binaryen';
import {
	Operator,
	ValidOperatorUnary,
} from './package.js';
import {throwUnsupportedType} from './utils-private.js';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Perform a unary operation on the stack.
 */
export class InstructionUnop extends InstructionExpression {
	private readonly isNegateFloat: boolean = this.op === Operator.NEG && this.arg.binType === binaryen.f64;
	public override readonly binType: binaryen.Type = (!this.isNegateFloat) ? binaryen.i32 : binaryen.f64;

	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg the operand
	 */
	constructor (
		private readonly op: ValidOperatorUnary,
		private readonly arg: InstructionExpression,
	) {
		super()
	}
	/**
	 * @return `'(‹op› ‹arg›)'`
	 */
	override toString(): string {
		return `(${ (new Map<binaryen.Type, ReadonlyMap<Operator, string>>([
			[binaryen.i32, new Map<Operator, string>([
				// [Operator.AFF, 'nop'],
				[Operator.NEG, 'call $neg'],
				[Operator.NOT, 'call $inot'],
				[Operator.EMP, 'call $iemp'],
			])],
			[binaryen.f64, new Map<Operator, string>([
				// [Operator.AFF, 'nop'],
				[Operator.NEG, 'f64.neg'],
				[Operator.NOT, 'call $fnot'],
				[Operator.EMP, 'call $femp'],
			])],
		]).get(this.arg.binType) ?? throwUnsupportedType(this.arg.binType)).get(this.op)! } ${ this.arg })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		if (this.isNegateFloat) {
			return mod.f64.neg(this.arg.buildBin(mod));
		}
		return mod.call((new Map<binaryen.Type, ReadonlyMap<Operator, string>>([
			[binaryen.i32, new Map<Operator, string>([
				[Operator.NEG, 'neg'],
				[Operator.NOT, 'inot'],
				[Operator.EMP, 'iemp'],
			])],
			[binaryen.f64, new Map<Operator, string>([
				[Operator.NEG, 'neg'],
				[Operator.NOT, 'fnot'],
				[Operator.EMP, 'femp'],
			])],
		]).get(this.arg.binType) ?? throwUnsupportedType(this.arg.binType)).get(this.op)!, [this.arg.buildBin(mod)], binaryen.i32);
	}
}
