import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** An enum of allowed binary operations. */
export type OpCodeBin = (
	| OpCode.INT_ADD
	| OpCode.INT_SUB
	| OpCode.INT_MUL
	| OpCode.INT_DIV
	| OpCode.INT_EXP

	| OpCode.NAT_ADD
	| OpCode.NAT_SUB
	| OpCode.NAT_MUL
	| OpCode.NAT_DIV
	| OpCode.NAT_EXP

	| OpCode.FLOAT_ADD
	| OpCode.FLOAT_SUB
	| OpCode.FLOAT_MUL
	| OpCode.FLOAT_DIV
	| OpCode.FLOAT_EXP

	| OpCode.LT
	| OpCode.GT
	| OpCode.LE
	| OpCode.GE
	| OpCode.NLT
	| OpCode.NGT

	| OpCode.ID
	| OpCode.EQ
	| OpCode.NID
	| OpCode.NEQ
);



/** A binary operation of 2 values. */
export class Binop extends Value {
	public constructor(
		private readonly operator: OpCodeBin,
		private readonly operand0: Value,
		private readonly operand1: Value,
		typ: TYPE.Type,
	) {
		super(operator, typ);
	}

	public override toString(): string {
		return super.toString(this.operand0, this.operand1);
	}

	@runOnceMethod
	public override validate(): void {
		const operands = [this.operand0, this.operand1] as const;
		return xjs.Array.forEachAggregated(operands, (arg) => {
			arg.validate();
			switch (this.operator) {
				case OpCode.INT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case OpCode.INT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case OpCode.INT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case OpCode.INT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case OpCode.INT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }

				case OpCode.NAT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case OpCode.NAT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case OpCode.NAT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case OpCode.NAT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case OpCode.NAT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }

				case OpCode.FLOAT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case OpCode.FLOAT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case OpCode.FLOAT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case OpCode.FLOAT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case OpCode.FLOAT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }

				case OpCode.LT:  { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.GT:  { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.LE:  { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.GE:  { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.NLT: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.NGT: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
			}
		});
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const codes: [binaryen.ExpressionRef, binaryen.ExpressionRef] = [this.operand0.codegen(cg), this.operand1.codegen(cg)];
		switch (this.operator) {
			case OpCode.FLOAT_EXP: { return cg.module.unreachable(); }

			case OpCode.NLT: { return cg.module.call('vnot', [cg.module.call('vlt', codes, binaryen.v128)], binaryen.v128); }
			case OpCode.NGT: { return cg.module.call('vnot', [cg.module.call('vgt', codes, binaryen.v128)], binaryen.v128); }

			case OpCode.NID: { return cg.module.call('vnot', [cg.module.call('vid', codes, binaryen.v128)], binaryen.v128); }
			case OpCode.NEQ: { return cg.module.call('vnot', [cg.module.call('veq', codes, binaryen.v128)], binaryen.v128); }
		}
		return cg.module.call(new Map<OpCode, string>([
			[OpCode.INT_ADD, 'viadd'],
			[OpCode.INT_SUB, 'visub_s'],
			[OpCode.INT_MUL, 'vimul'],
			[OpCode.INT_DIV, 'vidiv_s'],
			[OpCode.INT_EXP, 'viexp'],

			[OpCode.NAT_ADD, 'viadd'],
			[OpCode.NAT_SUB, 'visub_u'],
			[OpCode.NAT_MUL, 'vimul'],
			[OpCode.NAT_DIV, 'vidiv_u'],
			[OpCode.NAT_EXP, 'viexp'],

			[OpCode.FLOAT_ADD, 'vfadd'],
			[OpCode.FLOAT_SUB, 'vfsub'],
			[OpCode.FLOAT_MUL, 'vfmul'],
			[OpCode.FLOAT_DIV, 'vfdiv'],

			[OpCode.LT, 'vlt'],
			[OpCode.GT, 'vgt'],
			[OpCode.LE, 'vle'],
			[OpCode.GE, 'vge'],

			[OpCode.ID, 'vid'],
			[OpCode.EQ, 'veq'],
		]).get(this.operator)!, codes, binaryen.v128);
	}
}
