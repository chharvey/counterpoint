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
	public constructor(
		op:   ValidOperatorArithmetic,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1);
		this.typecheckArgs();
	}

	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	public override toString(): string {
		return `(${ new Map<Operator, string>([
			[Operator.EXP, (!this.floatarg) ? 'call $exp' : new InstructionUnreachable().toString()], // TODO Runtime exponentiation not yet supported.
			[Operator.MUL, (!this.floatarg) ? 'i32.mul'   : 'f64.mul'],
			[Operator.DIV, (!this.floatarg) ? 'i32.div_s' : 'f64.div'],
			[Operator.ADD, (!this.floatarg) ? 'i32.add'   : 'f64.add'],
			[Operator.SUB, (!this.floatarg) ? 'i32.sub'   : 'f64.sub'],
		]).get(this.op)! } ${ this.arg0 } ${ this.arg1 })`;
	}

	public get isFloat(): boolean {
		return this.floatarg;
	}
}
