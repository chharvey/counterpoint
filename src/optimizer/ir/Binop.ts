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
		const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
		const codes: [binaryen.ExpressionRef, binaryen.ExpressionRef] = [this.operand0.codegen(cg), this.operand1.codegen(cg)];
		switch (this.operator) {
			case OpCode.NLT: { return cg.module.call('vnot_', [cg.module.call('vlt_', codes, rt_value)], rt_value); }
			case OpCode.NGT: { return cg.module.call('vnot_', [cg.module.call('vgt_', codes, rt_value)], rt_value); }

			case OpCode.NID: { return cg.module.call('vnot_', [cg.module.call('vid_', codes, rt_value)], rt_value); }
			case OpCode.NEQ: { return cg.module.call('vnot_', [cg.module.call('veq_', codes, rt_value)], rt_value); }
		}
		return cg.module.call(new Map<OpCode, string>([
			// TODO: v0.5+: update with new functions
			[OpCode.INT_ADD, 'vadd_'],
			[OpCode.INT_SUB, 'visub_s_'],
			[OpCode.INT_MUL, 'vmul_'],
			[OpCode.INT_DIV, 'vdiv_'],
			[OpCode.INT_EXP, 'vexp_'],

			[OpCode.NAT_ADD, 'vadd_'],
			[OpCode.NAT_SUB, 'visub_u_'],
			[OpCode.NAT_MUL, 'vmul_'],
			[OpCode.NAT_DIV, 'vdiv_'],
			[OpCode.NAT_EXP, 'vexp_'],

			[OpCode.FLOAT_ADD, 'vadd_'],
			[OpCode.FLOAT_SUB, 'vfsub_'],
			[OpCode.FLOAT_MUL, 'vmul_'],
			[OpCode.FLOAT_DIV, 'vdiv_'],
			[OpCode.FLOAT_EXP, 'vexp_'],

			[OpCode.LT, 'vlt_'],
			[OpCode.GT, 'vgt_'],
			[OpCode.LE, 'vle_'],
			[OpCode.GE, 'vge_'],

			[OpCode.ID, 'vid_'],
			[OpCode.EQ, 'veq_'],
		]).get(this.operator)!, codes, rt_value);
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: Builder, Operator: any, BinVect: any, t0: any, t1: any, arg0: any, arg1: any, binaryen: any): number {
		type Local = any;
		let mod: any;
		let bothInts: any;
		let bothNats: any;
		let bothFloats: any;
		let bigint_to_i64: any;

		// Operator Addition
		if (this.operator === Operator.ADD) {
			const local0: Local = this.builder.newLocal(arg0);
			const teeer         = new BinVect(mod, local0.tee());
			const getter        = new BinVect(mod, local0.get());
			// if arg0 is mathematically 0, return arg1
			return mod.if(
				mod.i32.or(
					mod.i32.and(teeer.isInt,    mod.i64.eqz(getter.intValue)),
					mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(0.0))), // also takes care of the `-0.0` case
				),
				arg1,
				// else return a wasm call
				mod.call(
					bothInts(t0, t1) || bothNats(t0, t1) ? 'viadd' : (assert.ok(bothFloats(t0, t1)), 'vfadd'),
					[local0.get(), arg1],
					binaryen.v128,
				),
			);
		}

		// Operator Multiplication
		if (this.operator === Operator.MUL) {
			const local0: Local = this.builder.newLocal(arg0);
			const teeer         = new BinVect(mod, local0.tee());
			const getter        = new BinVect(mod, local0.get());
			// if arg0 is mathematically 0, return it
			return mod.if(
				mod.i32.or(
					mod.i32.and(teeer.isInt,    mod.i64.eqz(getter.intValue)),
					mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(0.0))), // also takes care of the `-0.0` case
				),
				local0.get(),
				// else if arg0 is mathematically 1, return arg1
				mod.if(
					mod.i32.or(
						mod.i32.and(getter.isInt,   mod.i64.eq(getter.intValue,   bigint_to_i64(mod, 1n))),
						mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(1.0))),
					),
					arg1,
					// else return a wasm call
					mod.call(
						bothInts(t0, t1) || bothNats(t0, t1) ? 'vimul' : (assert.ok(bothFloats(t0, t1)), 'vfmul'),
						[local0.get(), arg1],
						binaryen.v128,
					),
				),
			);
		}

		// Operator Equality
		if (this.type().equals(TYPE.FALSE)) {
			return cg.module.block(null, [
				cg.module.drop(arg0),
				cg.module.drop(arg1),
				new BinVect(cg.module, false).vect,
			], binaryen.v128);
		}
		return 0;
	}
	/* eslint-enable */
}
