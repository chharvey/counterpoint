import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	drop_then,
	type Builder,
} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



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
		private readonly operand0: ValueTac,
		private readonly operand1: ValueTac,
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
			case OpCode.INT_ADD: { return cg.vm.op.intAdd(...codes); }
			case OpCode.INT_SUB: { return cg.vm.op.intSub(...codes); }
			case OpCode.INT_MUL: { return cg.vm.op.intMul(...codes); }

			case OpCode.NAT_ADD: { return cg.vm.op.natAdd(...codes); }
			case OpCode.NAT_SUB: { return cg.vm.op.natSub(...codes); }
			case OpCode.NAT_MUL: { return cg.vm.op.natMul(...codes); }

			case OpCode.FLOAT_ADD: { return cg.vm.op.floatAdd(...codes); }
			case OpCode.FLOAT_SUB: { return cg.vm.op.floatSub(...codes); }
			case OpCode.FLOAT_MUL: { return cg.vm.op.floatMul(...codes); }
			case OpCode.FLOAT_EXP: { return cg.module.unreachable(); }

			case OpCode.NLT: { return cg.vm.op.not(cg.module.call('vlt', codes, cg.reftype.Value)); }
			case OpCode.NGT: { return cg.vm.op.not(cg.module.call('vgt', codes, cg.reftype.Value)); }

			case OpCode.NID: { return cg.vm.op.not(cg.module.call('vid', codes, cg.reftype.Value)); }
			case OpCode.NEQ: { return cg.vm.op.not(cg.module.call('veq', codes, cg.reftype.Value)); }
		}
		return cg.module.call(new Map<OpCode, string>([
			[OpCode.INT_DIV, 'vidiv_s'],
			[OpCode.INT_EXP, 'viexp'],

			[OpCode.NAT_DIV, 'vidiv_u'],
			[OpCode.NAT_EXP, 'viexp'],

			[OpCode.FLOAT_DIV, 'vfdiv'],

			[OpCode.LT, 'vlt'],
			[OpCode.GT, 'vgt'],
			[OpCode.LE, 'vle'],
			[OpCode.GE, 'vge'],

			[OpCode.ID, 'vid'],
			[OpCode.EQ, 'veq'],
		]).get(this.operator)!, codes, cg.reftype.Value);
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: Builder, Operator: any, t0: any, t1: any, arg0: any, arg1: any, binaryen: any): number {
		type Local = any;
		let mod = cg.module;
		let bothInts: any;
		let bothNats: any;
		let bothFloats: any;
		let bigint_to_i64: any;

		// Operator Addition
		if (this.operator === Operator.ADD) {
			const local0: Local = cg.newLocal(arg0);
			const teeer         = cg.newVect(local0.tee());
			const getter        = cg.newVect(local0.get());
			// if arg0 is mathematically 0, return arg1
			return mod.if(
				mod.i32.or(
					mod.i32.and(cg.vm.Vect.isInt(teeer),    mod.i64.eqz(cg.vm.Vect.asInt(getter))),
					mod.i32.and(cg.vm.Vect.isFloat(getter), mod.f64.eq(cg.vm.Vect.asFloat(getter), mod.f64.const(0.0))), // also takes care of the `-0.0` case
				),
				arg1,
				// else return a wasm call
				mod.call(
					bothInts(t0, t1) ? 'cpl:int-add' : bothNats(t0, t1) ? 'cpl:nat-add' : (assert.ok(bothFloats(t0, t1)), 'cpl:float-add'),
					[local0.get(), arg1],
					binaryen.v128,
				),
			);
		}

		// Operator Multiplication
		if (this.operator === Operator.MUL) {
			const local0: Local = cg.newLocal(arg0);
			const teeer         = cg.newVect(local0.tee());
			const getter        = cg.newVect(local0.get());
			// if arg0 is mathematically 0, return it
			return mod.if(
				mod.i32.or(
					mod.i32.and(cg.vm.Vect.isInt(teeer),    mod.i64.eqz(cg.vm.Vect.asInt(getter))),
					mod.i32.and(cg.vm.Vect.isFloat(getter), mod.f64.eq(cg.vm.Vect.asFloat(getter), mod.f64.const(0.0))), // also takes care of the `-0.0` case
				),
				local0.get(),
				// else if arg0 is mathematically 1, return arg1
				mod.if(
					mod.i32.or(
						mod.i32.and(cg.vm.Vect.isInt(getter),   mod.i64.eq(cg.vm.Vect.asInt(getter),   bigint_to_i64(mod, 1n))),
						mod.i32.and(cg.vm.Vect.isFloat(getter), mod.f64.eq(cg.vm.Vect.asFloat(getter), mod.f64.const(1.0))),
					),
					arg1,
					// else return a wasm call
					mod.call(
						bothInts(t0, t1) ? 'cpl:int-mul' : bothNats(t0, t1) ? 'cpl:nat-mul' : (assert.ok(bothFloats(t0, t1)), 'cpl:float-mul'),
						[local0.get(), arg1],
						binaryen.v128,
					),
				),
			);
		}

		// Operator Equality
		if (this.type().equals(TYPE.FALSE)) {
			drop_then(this.builder, [arg0, arg1], false);
			return cg.module.block(null, [
				cg.module.drop(arg0),
				cg.module.drop(arg1),
				cg.newVect(false),
			], binaryen.v128);
		}

		// Operator Logical
		const block1: binaryen.ExpressionRef = drop_then(cg, [arg0], arg1);
		if (t0.isDefinitelyFalsy) {
			return this.operator === Operator.AND ? arg0 : block1;
		} else if (t0.isDefinitelyTruthy) {
			return this.operator === Operator.AND ? block1 : arg0;
		}

		return 0;
	}
	/* eslint-enable */
}
