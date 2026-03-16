import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	BinValue,
	type Builder,
} from '../../index.ts';
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

				// case OpCode.NAT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				// case OpCode.NAT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				// case OpCode.NAT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				// case OpCode.NAT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				// case OpCode.NAT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }

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
			case OpCode.NLT: { return new BinValue(cg, cg.module.call('vnot', [cg.module.call('vlt', codes, binaryen.v128)], binaryen.v128)).value; }
			case OpCode.NGT: { return new BinValue(cg, cg.module.call('vnot', [cg.module.call('vgt', codes, binaryen.v128)], binaryen.v128)).value; }

			case OpCode.NID: { return new BinValue(cg, cg.module.call('vnot', [cg.module.call('vid', codes, binaryen.v128)], binaryen.v128)).value; }
			case OpCode.NEQ: { return new BinValue(cg, cg.module.call('vnot', [cg.module.call('veq', codes, binaryen.v128)], binaryen.v128)).value; }
		}
		return new BinValue(cg, cg.module.call(new Map<OpCode, string>([
			// TODO: v0.5+: update with new functions
			[OpCode.INT_ADD, 'vadd'],
			[OpCode.INT_SUB, 'visub_s'],
			[OpCode.INT_MUL, 'vmul'],
			[OpCode.INT_DIV, 'vdiv'],
			[OpCode.INT_EXP, 'vexp'],

			[OpCode.NAT_ADD, 'vadd'],
			[OpCode.NAT_SUB, 'visub_u'],
			[OpCode.NAT_MUL, 'vmul'],
			[OpCode.NAT_DIV, 'vdiv'],
			[OpCode.NAT_EXP, 'vexp'],

			[OpCode.FLOAT_ADD, 'vadd'],
			[OpCode.FLOAT_SUB, 'vfsub'],
			[OpCode.FLOAT_MUL, 'vmul'],
			[OpCode.FLOAT_DIV, 'vdiv'],
			[OpCode.FLOAT_EXP, 'vexp'],

			[OpCode.LT, 'vlt'],
			[OpCode.GT, 'vgt'],
			[OpCode.LE, 'vle'],
			[OpCode.GE, 'vge'],

			[OpCode.ID, 'vid'],
			[OpCode.EQ, 'veq'],
		]).get(this.operator)!, codes, binaryen.v128)).value;
	}
}
