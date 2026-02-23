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



/** A unary operation of 1 value. */
export class Unop extends Value {
	/**
	 * Similar to `Binop.new`, but instead of “three-address code”, this is “two-address code”.
	 *
	 * Every unary operation should take the form of `t1 := -t2`.
	 * Nested operations such as `!-5`, instead of a tree-like structure:
	 * ```
	 * (NOT (INT_NEG 5))
	 * ```
	 * become flattened with the use of temporary locals:
	 * ```
	 * (SET $0 (INT_NEG 5))    ;; t0 := -5
	 * (SET $1 (NOT (GET $0))) ;; t1 := !t0
	 * (GET $1)                ;; t1
	 * ```
	 * Rather than returning `operation` directly, we set it to a temporary variable
	 * and then return that variable.
	 *
	 * @param optimizer
	 * @param operator
	 * @param operand
	 * @see https://en.wikipedia.org/wiki/Three-address_code
	 */
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
