import {Instruction} from './Instruction.ts';



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
}



export class Binop extends Instruction {
	public constructor(
		private readonly operator: BinOp,
		private readonly operand0: Instruction,
		private readonly operand1: Instruction,
	) {
		super();
	}

	public override toString(): string {
		return `(${ BinOp[this.operator] } ${ this.operand0 } ${ this.operand1 })`;
	}
}
