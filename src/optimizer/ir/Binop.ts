import * as assert from 'node:assert';
import type binaryen from 'binaryen';
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
		const rt_value: binaryen.Type = cg.getReftype('(ref $Value)')!;
		const codes: [binaryen.ExpressionRef, binaryen.ExpressionRef] = [this.operand0.codegen(cg), this.operand1.codegen(cg)];
		switch (this.operator) {
			case OpCode.FLOAT_EXP: { return cg.module.unreachable(); }

			case OpCode.NLT: { return cg.module.call('vnot_', [cg.module.call('vlt_', codes, rt_value)], rt_value); }
			case OpCode.NGT: { return cg.module.call('vnot_', [cg.module.call('vgt_', codes, rt_value)], rt_value); }

			case OpCode.NID: { return cg.module.call('vnot_', [cg.module.call('vid_', codes, rt_value)], rt_value); }
			case OpCode.NEQ: { return cg.module.call('vnot_', [cg.module.call('veq_', codes, rt_value)], rt_value); }
		}
		return cg.module.call(new Map<OpCode, string>([
			[OpCode.INT_ADD, 'viadd_'],
			[OpCode.INT_SUB, 'visub_s_'],
			[OpCode.INT_MUL, 'vimul_'],
			[OpCode.INT_DIV, 'vidiv_s_'],
			[OpCode.INT_EXP, 'viexp_'],

			[OpCode.NAT_ADD, 'viadd_'],
			[OpCode.NAT_SUB, 'visub_u_'],
			[OpCode.NAT_MUL, 'vimul_'],
			[OpCode.NAT_DIV, 'vidiv_u_'],
			[OpCode.NAT_EXP, 'viexp_'],

			[OpCode.FLOAT_ADD, 'vfadd_'],
			[OpCode.FLOAT_SUB, 'vfsub_'],
			[OpCode.FLOAT_MUL, 'vfmul_'],
			[OpCode.FLOAT_DIV, 'vfdiv_'],

			[OpCode.LT, 'vlt_'],
			[OpCode.GT, 'vgt_'],
			[OpCode.LE, 'vle_'],
			[OpCode.GE, 'vge_'],

			[OpCode.ID, 'vid_'],
			[OpCode.EQ, 'veq_'],
		]).get(this.operator)!, codes, rt_value);
	}
}
