import type {TypeName} from './Type.ts';
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
	public constructor(
		private readonly operator: BinOp,
		private readonly operand0: Value,
		private readonly operand1: Value,
		typ: TypeName,
	) {
		super(typ);
	}

	public override toString(): string {
		return `(${ BinOp[this.operator].replace(/_/, '.') } ${ this.operand0 } ${ this.operand1 })`;
	}
}
