import type {TYPE} from '../../typer/index.ts';
import type {Local} from '../utils-public.ts';
import type {Optimizer} from '../Optimizer.ts';
import {Set as IrSet} from './index.ts';
import {is_unit} from './utils-private.ts';
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
	public static new(optimizer: Optimizer, operator: UnOp, operand: Value, typ: TYPE.Type): Unop {
		if (is_unit(operand)) {
			return new Unop(operator, operand, typ);
		} else {
			const local: Local = optimizer.newTempLocal(typ);
			optimizer.pushInstruction(new IrSet(local, operand));
			return new Unop(operator, new Get(local), typ);
		}
	}


	private constructor(
		private readonly operator: UnOp,
		private readonly operand:  Value,
		private readonly typ:      TYPE.Type,
	) {
		super();
	}

	public override get type(): TYPE.Type {
		return this.typ;
	}

	public override toString(): string {
		return `(${ UnOp[this.operator] } ${ this.operand })`;
	}
}
