import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
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
		typ: TYPE.Type,
	) {
		super(typ);
	}

	public override toString(): string {
		return `(${ BinOp[this.operator].replace(/_/, '.') } ${ this.operand0 } ${ this.operand1 })`;
	}

	@runOnceMethod
	public override validate(): void {
		const operands = [this.operand0, this.operand1] as const;
		return xjs.Array.forEachAggregated(operands, (arg) => {
			arg.validate();
			switch (this.operator) {
				case BinOp.INT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case BinOp.INT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case BinOp.INT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case BinOp.INT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case BinOp.INT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }

				// case BinOp.NAT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				// case BinOp.NAT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				// case BinOp.NAT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				// case BinOp.NAT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				// case BinOp.NAT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }

				case BinOp.FLOAT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case BinOp.FLOAT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case BinOp.FLOAT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case BinOp.FLOAT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case BinOp.FLOAT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }

				case BinOp.LT:  { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case BinOp.GT:  { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case BinOp.LE:  { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case BinOp.GE:  { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case BinOp.NLT: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case BinOp.NGT: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
			}
		});
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
