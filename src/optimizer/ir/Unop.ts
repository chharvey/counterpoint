import type {Optimizer} from '../Optimizer.ts';
import {Set as IrSet} from './index.ts';
import {is_unit} from './utils-private.ts';
import type {Instruction} from './Instruction.ts';
import {Value} from './Value.ts';
import {Get} from './Get.ts';



/** An enum of unary operations. */
export enum UnOp {
	TOINT,
	TONAT,
	TOFLOAT,

	NOT,
	EMP,

	INT_NEG,
	FLOAT_NEG,
}



export class Unop extends Value {
	public static new(optimizer: Optimizer, operator: UnOp, operand: Value): Unop {
		if (is_unit(operand)) {
			return new Unop(operator, operand);
		} else {
			const local_name: string = optimizer.newTempLocalName();
			optimizer.pushInstruction(new IrSet(local_name, operand));
			return new Unop(operator, new Get(local_name));
		}
	}


	private constructor(
		private readonly operator: UnOp,
		private readonly operand:  Instruction,
	) {
		super();
	}

	public override toString(): string {
		return `(${ UnOp[this.operator] } ${ this.operand })`;
	}
}
