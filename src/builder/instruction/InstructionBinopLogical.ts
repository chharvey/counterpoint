import type binaryen from 'binaryen';
import {
	Operator,
	ValidOperatorLogical,
} from './package.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionLocalGet} from './InstructionLocalGet.js';
import {InstructionLocalTee} from './InstructionLocalTee.js';
import {InstructionUnop} from './InstructionUnop.js';
import {InstructionBinop} from './InstructionBinop.js';
import {
	InstructionCond,
	InstructionDeclareLocal,
} from './index.js';



export class InstructionBinopLogical extends InstructionBinop {
	/**
	 * @param count the index of a temporary optimization variable
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		private readonly count: bigint,
		op:   ValidOperatorLogical,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
		this.typecheckArgs();
	}
	/**
	 * @return a `(select)` instruction determining which operand to produce
	 */
	override toString(): string {
		const condition: InstructionExpression = new InstructionUnop(
			Operator.NOT,
			new InstructionUnop(
				Operator.NOT,
				new InstructionLocalTee(this.count, this.arg0),
			),
		)
		const left:  InstructionExpression = new InstructionLocalGet(this.count, this.arg0.isFloat)
		const right: InstructionExpression = this.arg1
		return `${ new InstructionDeclareLocal(this.count, this.arg0.isFloat) } ${
			(this.op === Operator.AND)
				? new InstructionCond(condition, right, left)
				: new InstructionCond(condition, left, right)
		}`
	}
	get isFloat(): boolean {
		return this.floatarg
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		const condition: InstructionExpression = new InstructionUnop(
			Operator.NOT,
			new InstructionUnop(
				Operator.NOT,
				new InstructionLocalTee(this.count, this.arg0),
			),
		);
		const inst_left:  InstructionExpression = new InstructionLocalGet(this.count, this.arg0.isFloat);
		const inst_right: InstructionExpression = this.arg1;

		new InstructionDeclareLocal(this.count, this.arg0.isFloat).buildBin(mod);
		return ((this.op === Operator.AND)
			? new InstructionCond(condition, inst_right, inst_left)
			: new InstructionCond(condition, inst_left,  inst_right)).buildBin(mod);
	}
}
