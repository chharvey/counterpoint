import {
	Operator,
	type ValidOperatorUnary,
} from '../../validator/index.js';
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
		return [Operator.AFF, Operator.NEG].includes(this.op) && this.arg.isFloat;
	}
}
