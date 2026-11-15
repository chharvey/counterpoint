import * as assert from 'node:assert';
import * as binaryen from 'binaryen.ts';
import {
	type CodeGenerator,
	NanErrorDivZero,
} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {
	type VALUE,
	TYPE,
} from '../../typer/index.ts';
import {drop_then} from './utils-private.ts';
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

	| OpCode.ID
	| OpCode.EQ
	| OpCode.IS
);



/** A binary operation of 2 values. */
export class Binop extends Value {
	public constructor(
		public readonly operator: OpCodeBin,
		public readonly operand0: ValueTac,
		public readonly operand1: ValueTac,
		typ: TYPE.Type,
	) {
		super(operator, typ);
	}

	public override toString(): string {
		return super.toString(this.operand0, this.operand1);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const [code0, code1]: [binaryen.ExpressionRef, binaryen.ExpressionRef] = [this.operand0.codegen(cg), this.operand1.codegen(cg)];
		switch (this.operator) {
			case OpCode.INT_ADD: { return cg.vm.op.intAdd(code0, code1); }
			case OpCode.INT_SUB: { return cg.vm.op.intSub(code0, code1); }
			case OpCode.INT_MUL: { return cg.vm.op.intMul(code0, code1); }
			case OpCode.INT_DIV: { return cg.vm.op.intDiv(code0, code1); }
			case OpCode.INT_EXP: { return cg.vm.op.intExp(code0, code1); }

			case OpCode.NAT_ADD: { return cg.vm.op.natAdd(code0, code1); }
			case OpCode.NAT_SUB: { return cg.vm.op.natSub(code0, code1); }
			case OpCode.NAT_MUL: { return cg.vm.op.natMul(code0, code1); }
			case OpCode.NAT_DIV: { return cg.vm.op.natDiv(code0, code1); }
			case OpCode.NAT_EXP: { return cg.vm.op.natExp(code0, code1); }

			case OpCode.FLOAT_ADD: { return cg.vm.op.floatAdd(code0, code1); }
			case OpCode.FLOAT_SUB: { return cg.vm.op.floatSub(code0, code1); }
			case OpCode.FLOAT_MUL: { return cg.vm.op.floatMul(code0, code1); }
			case OpCode.FLOAT_DIV: { return cg.vm.op.floatDiv(code0, code1); }
			case OpCode.FLOAT_EXP: { return cg.vm.op.floatExp(code0, code1); }

			case OpCode.LT: { return cg.vm.op.lt(code0, code1); }
			case OpCode.GT: { return cg.vm.op.gt(code0, code1); }
			case OpCode.LE: { return cg.vm.op.le(code0, code1); }
			case OpCode.GE: { return cg.vm.op.ge(code0, code1); }

			case OpCode.ID: { return cg.vm.op.id(code0, code1); }
			case OpCode.EQ: { return cg.vm.op.eq(code0, code1); }
			case OpCode.IS: { return cg.vm.op.is(code0, code1); }
		}
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: CodeGenerator, Operator: any, t0: any, t1: any, arg0: any, arg1: any, v0: any, v1: any): number {
		type Local = any;
		const {wasm} = cg.mod;
		let bothInts: any;
		let bothNats: any;
		let bothFloats: any;

		// Operator Addition
		if (this.operator === Operator.ADD && (v0 as VALUE.Number).eq0()) {
			return v1;
		}
		if (this.operator === Operator.ADD) {
			const local0: Local = cg.newLocal(arg0);
			const teeer         = cg.newVect(local0.tee());
			const getter        = cg.newVect(local0.get());
			// if arg0 is mathematically 0, return arg1
			return wasm.if(
				wasm.i32.or(
					wasm.i32.and(cg.vm.Vect.isInt(teeer),    wasm.i64.eqz(cg.vm.Vect.asInt(getter))),
					wasm.i32.and(cg.vm.Vect.isFloat(getter), wasm.f64.eq(cg.vm.Vect.asFloat(getter), wasm.f64.const(0.0))), // also takes care of the `-0.0` case
				),
				arg1,
				// else return a wasm call
				wasm.call(
					bothInts(t0, t1) ? 'op:int-add' : bothNats(t0, t1) ? 'op:nat-add' : (assert.ok(bothFloats(t0, t1)), 'op:float-add'),
					[local0.get(), arg1],
					binaryen.Type.v128,
				),
			);
		}

		// Operator Multiplication
		if (this.operator === Operator.MUL && (v0 as VALUE.Number).eq1()) {
			return v1;
		}
		if (this.operator === Operator.MUL) {
			const local0: Local = cg.newLocal(arg0);
			const teeer         = cg.newVect(local0.tee());
			const getter        = cg.newVect(local0.get());
			// if arg0 is mathematically 0, return it
			return wasm.if(
				wasm.i32.or(
					wasm.i32.and(cg.vm.Vect.isInt(teeer),    wasm.i64.eqz(cg.vm.Vect.asInt(getter))),
					wasm.i32.and(cg.vm.Vect.isFloat(getter), wasm.f64.eq(cg.vm.Vect.asFloat(getter), wasm.f64.const(0.0))), // also takes care of the `-0.0` case
				),
				local0.get(),
				// else if arg0 is mathematically 1, return arg1
				wasm.if(
					wasm.i32.or(
						wasm.i32.and(cg.vm.Vect.isInt(getter),   wasm.i64.eq(cg.vm.Vect.asInt(getter),   wasm.i64.const(1n))),
						wasm.i32.and(cg.vm.Vect.isFloat(getter), wasm.f64.eq(cg.vm.Vect.asFloat(getter), wasm.f64.const(1.0))),
					),
					arg1,
					// else return a wasm call
					wasm.call(
						bothInts(t0, t1) ? 'op:int-mul' : bothNats(t0, t1) ? 'op:nat-mul' : (assert.ok(bothFloats(t0, t1)), 'op:float-mul'),
						[local0.get(), arg1],
						binaryen.Type.v128,
					),
				),
			);
		}

		// Operator Division
		if (this.operator === Operator.DIV && (v1 as VALUE.Number).eq0()) {
			throw new NanErrorDivZero(this.operand1);
		}

		// Operator Equality
		if (this.type().equals(TYPE.FALSE)) {
			drop_then(cg, [arg0, arg1], false);
			return wasm.block(null, [
				wasm.drop(arg0),
				wasm.drop(arg1),
				cg.vm.Value.FALSE,
			], cg.vm.reftype.Value);
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
