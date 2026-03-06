import * as assert from 'node:assert';
import binaryen from 'binaryen';
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

				case BinOp.NAT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case BinOp.NAT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case BinOp.NAT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case BinOp.NAT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case BinOp.NAT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }

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
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const codes: [binaryen.ExpressionRef, binaryen.ExpressionRef] = [this.operand0.codegen(cg), this.operand1.codegen(cg)];
		switch (this.operator) {
			case BinOp.FLOAT_EXP: { return cg.module.unreachable(); }

			case BinOp.NLT: { return cg.module.call('vnot', [cg.module.call('vlt', codes, binaryen.v128)], binaryen.v128); }
			case BinOp.NGT: { return cg.module.call('vnot', [cg.module.call('vgt', codes, binaryen.v128)], binaryen.v128); }

			case BinOp.NID: { return cg.module.call('vnot', [cg.module.call('vid', codes, binaryen.v128)], binaryen.v128); }
			case BinOp.NEQ: { return cg.module.call('vnot', [cg.module.call('veq', codes, binaryen.v128)], binaryen.v128); }
		}
		return cg.module.call(new Map<BinOp, string>([
			[BinOp.INT_ADD, 'viadd'],
			[BinOp.INT_SUB, 'visub_s'],
			[BinOp.INT_MUL, 'vimul'],
			[BinOp.INT_DIV, 'vidiv_s'],
			[BinOp.INT_EXP, 'viexp'],

			[BinOp.NAT_ADD, 'viadd'],
			[BinOp.NAT_SUB, 'visub_u'],
			[BinOp.NAT_MUL, 'vimul'],
			[BinOp.NAT_DIV, 'vidiv_u'],
			[BinOp.NAT_EXP, 'viexp'],

			[BinOp.FLOAT_ADD, 'vfadd'],
			[BinOp.FLOAT_SUB, 'vfsub'],
			[BinOp.FLOAT_MUL, 'vfmul'],
			[BinOp.FLOAT_DIV, 'vfdiv'],

			[BinOp.LT, 'vlt'],
			[BinOp.GT, 'vgt'],
			[BinOp.LE, 'vle'],
			[BinOp.GE, 'vge'],

			[BinOp.ID, 'vid'],
			[BinOp.EQ, 'veq'],
		]).get(this.operator)!, codes, binaryen.v128);
	}
}
