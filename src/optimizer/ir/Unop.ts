import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



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



/** A unary operation of 1 value. */
export class Unop extends Value {
	private readonly operand: Value;

	public constructor(
		optimizer: Optimizer,
		private readonly operator: UnOp,
		operand: Value,
		typ: TYPE.Type,
	) {
		super(typ);
		this.operand = as_unit(optimizer, operand);
	}

	public override toString(): string {
		return `(${ UnOp[this.operator].replace(/_/, '.') } ${ this.operand })`;
	}
}
