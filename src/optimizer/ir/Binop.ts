import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



/** An enum of binary operations. */
export enum BinOp {
	INT_ADD,
	INT_SUB,
	INT_MUL,
	INT_DIV,
	INT_EXP,

	NAT_ADD,
	NAT_SUB,
	NAT_MUL,
	NAT_DIV,
	NAT_EXP,

	FLOAT_ADD,
	FLOAT_SUB,
	FLOAT_MUL,
	FLOAT_DIV,
	FLOAT_EXP,

	LT,
	GT,
	LE,
	GE,
	NLT,
	NGT,

	ID,
	EQ,
	NID,
	NEQ,
}



/** A binary operation of 2 values. */
export class Binop extends Value {
	private readonly operand0: Value;
	private readonly operand1: Value;

	public constructor(
		optimizer: Optimizer,
		private readonly operator: BinOp,
		operand0: Value,
		operand1: Value,
		private readonly typ: TYPE.Type,
	) {
		super();
		this.operand0 = as_unit(optimizer, operand0);
		this.operand1 = as_unit(optimizer, operand1);
	}

	public override get type(): TYPE.Type {
		return this.typ;
	}

	public override toString(): string {
		return `(${ BinOp[this.operator].replace(/_/, '.') } ${ this.operand0 } ${ this.operand1 })`;
	}
}
