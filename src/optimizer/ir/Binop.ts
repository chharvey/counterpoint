import type {TYPE} from '../../typer/index.ts';
import type {Local} from '../utils-public.ts';
import type {Optimizer} from '../Optimizer.ts';
import {Set as IrSet} from './index.ts';
import {is_unit} from './utils-private.ts';
import {Value} from './Value.ts';
import {Get} from './Get.ts';



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
	/**
	 * Construct a new Binop using the Three-Address Code technique.
	 *
	 * Every binary operation should take the form of `t1 := t2 + t3`.
	 * Nested operations such as `5 + 3 * 2 - 7`, instead of a tree-like structure:
	 * ```
	 * (SUB (ADD 5 (MUL 3 2)) 7)
	 * ```
	 * become flattened with the use of temporary locals:
	 * ```
	 * (SET $0 (MUL 3 2))        ;; t0 := 3 * 2
	 * (SET $1 (ADD 5 (GET $0))) ;; t1 := 5 + t0
	 * (SET $2 (SUB (GET $1) 7)) ;; t2 := t1 - 7
	 * (GET $2)                  ;; t2
	 * ```
	 * Rather than returning `operation` directly, we set it to a temporary variable
	 * and then return that variable.
	 *
	 * @param optimizer
	 * @param operator
	 * @param operand0 left
	 * @param operand1 right
	 * @see https://en.wikipedia.org/wiki/Three-address_code
	 */
	public static new(optimizer: Optimizer, operator: BinOp, operand0: Value, operand1: Value, typ: TYPE.Type): Binop {
		if (is_unit(operand0) && is_unit(operand1)) {
			return new Binop(operator, operand0, operand1, typ);
		} else if (is_unit(operand0)) {
			const local1: Local = optimizer.newTempLocal(operand1.type);
			optimizer.pushInstruction(new IrSet(local1, operand1));
			return new Binop(operator, operand0, new Get(local1), typ);
		} else if (is_unit(operand1)) {
			const local0: Local = optimizer.newTempLocal(operand0.type);
			optimizer.pushInstruction(new IrSet(local0, operand0));
			return new Binop(operator, new Get(local0), operand1, typ);
		} else {
			const local0: Local = optimizer.newTempLocal(operand0.type);
			const local1: Local = optimizer.newTempLocal(operand1.type);
			optimizer.pushInstruction(new IrSet(local0, operand0));
			optimizer.pushInstruction(new IrSet(local1, operand1));
			return new Binop(operator, new Get(local0), new Get(local1), typ);
		}
	}


	private constructor(
		private readonly operator: BinOp,
		private readonly operand0: Value,
		private readonly operand1: Value,
		private readonly typ:      TYPE.Type,
	) {
		super();
	}

	public override get type(): TYPE.Type {
		return this.typ;
	}

	public override toString(): string {
		return `(${ BinOp[this.operator] } ${ this.operand0 } ${ this.operand1 })`;
	}
}
