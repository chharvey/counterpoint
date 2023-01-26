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
import {InstructionCond} from './index.js';



export class InstructionBinopLogical extends InstructionBinop {
	private readonly instructionCond: InstructionCond;

	/**
	 * @param var_index the index of a temporary optimization variable
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		var_index: number,
		op:   ValidOperatorLogical,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
		this.typecheckArgs();

		const condition = new InstructionUnop(
			Operator.NOT,
			new InstructionUnop(
				Operator.NOT,
				new InstructionLocalTee(var_index, this.arg0),
			),
		)
		const left                         = new InstructionLocalGet(var_index, this.arg0.isFloat);
		const right: InstructionExpression = this.arg1
		this.instructionCond = (this.op === Operator.AND)
			? new InstructionCond(condition, right, left)
			: new InstructionCond(condition, left, right);
	}
	/**
	 * @return an `(if)` instruction determining which operand to produce
	 */
	public override toString(): string {
		return this.instructionCond.toString();
	}
	get isFloat(): boolean {
		return this.floatarg
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return this.instructionCond.buildBin(mod);
	}
}
