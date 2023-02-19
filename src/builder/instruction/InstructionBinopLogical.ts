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
	public constructor (
		private readonly count: bigint,
		op:   ValidOperatorLogical,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1);
		if (this.intarg && this.floatarg) {
			throw new TypeError(`Both operands must be either integers or floats, but not a mix.\nOperands: ${ this.arg0 } ${ this.arg1 }`);
		}
	}

	/**
	 * @return a `(select)` instruction determining which operand to produce
	 */
	public override toString(): string {
		const varname: string = `$o${ this.count.toString(16) }`;
		const condition: InstructionExpression = new InstructionUnop(
			Operator.NOT,
			new InstructionUnop(
				Operator.NOT,
				new InstructionLocalTee(varname, this.arg0),
			),
		);
		const left:  InstructionExpression = new InstructionLocalGet(varname, this.arg0.isFloat);
		const right: InstructionExpression = this.arg1;
		return `${ new InstructionDeclareLocal(varname, this.arg0.isFloat) } ${
			(this.op === Operator.AND)
				? new InstructionCond(condition, right, left)
				: new InstructionCond(condition, left, right)
		}`;
	}

	public get isFloat(): boolean {
		return this.floatarg;
	}
}
