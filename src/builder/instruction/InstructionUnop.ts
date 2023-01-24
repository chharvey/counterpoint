import binaryen from 'binaryen';
import {
	Operator,
	ValidOperatorUnary,
} from './package.js';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Perform a unary operation on the stack.
 */
export class InstructionUnop extends InstructionExpression {
	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg the operand
	 */
	public constructor(
		private readonly op: ValidOperatorUnary,
		private readonly arg: InstructionExpression,
	) {
		super();
	}

	/**
	 * @return `'(‹op› ‹arg›)'`
	 */
	public override toString(): string {
		return `(${ new Map<Operator, string>([
			// [Operator.AFF, 'nop'],
			[Operator.NEG, (!this.arg.isFloat) ? 'call $neg'  : 'f64.neg'],
			[Operator.NOT, (!this.arg.isFloat) ? 'call $inot' : 'call $fnot'],
			[Operator.EMP, (!this.arg.isFloat) ? 'call $iemp' : 'call $femp'],
		]).get(this.op)! } ${ this.arg })`;
	}

	public get isFloat(): boolean {
		return this.op === Operator.NEG && this.arg.isFloat;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		if (this.op === Operator.NEG && this.arg.isFloat) {
			return mod.f64.neg(this.arg.buildBin(mod));
		}
		return mod.call(new Map<Operator, string>([
			[Operator.NEG, 'neg'],
			[Operator.NOT, (!this.arg.isFloat) ? 'inot' : 'fnot'],
			[Operator.EMP, (!this.arg.isFloat) ? 'iemp' : 'femp'],
		]).get(this.op)!, [this.arg.buildBin(mod)], binaryen.i32);
	}
}
