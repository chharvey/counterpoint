import * as assert from 'node:assert';
import * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import {
	type CodeGenerator,
	NanErrorDivZero,
} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {drop_then} from './utils-private.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
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
	public override validate(builder: Builder): void {
		const operands = [this.operand0, this.operand1] as const;
		return xjs.Array.forEachAggregated(operands, (arg) => {
			arg.validate(builder);
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

				case OpCode.LT: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.GT: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.LE: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.GE: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
			}
		});
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		const [operand0, operand1]: [VALUE.Value, VALUE.Value] = [this.operand0.interpret(interp), this.operand1.interpret(interp)];
		switch (this.operator) {
			case OpCode.INT_ADD: { return (operand0 as VALUE.Integer).plus   (operand1 as VALUE.Integer); }
			case OpCode.INT_SUB: { return (operand0 as VALUE.Integer).minus  (operand1 as VALUE.Integer); }
			case OpCode.INT_MUL: { return (operand0 as VALUE.Integer).times  (operand1 as VALUE.Integer); }
			case OpCode.INT_DIV: { return (operand0 as VALUE.Integer).divide (operand1 as VALUE.Integer); }
			case OpCode.INT_EXP: { return (operand0 as VALUE.Integer).exp    (operand1 as VALUE.Integer); }

			case OpCode.NAT_ADD: { return (operand0 as VALUE.Natural).plus   (operand1 as VALUE.Natural); }
			case OpCode.NAT_SUB: { return (operand0 as VALUE.Natural).minus  (operand1 as VALUE.Natural); }
			case OpCode.NAT_MUL: { return (operand0 as VALUE.Natural).times  (operand1 as VALUE.Natural); }
			case OpCode.NAT_DIV: { return (operand0 as VALUE.Natural).divide (operand1 as VALUE.Natural); }
			case OpCode.NAT_EXP: { return (operand0 as VALUE.Natural).exp    (operand1 as VALUE.Natural); }

			case OpCode.FLOAT_ADD: { return (operand0 as VALUE.Float).plus   (operand1 as VALUE.Float); }
			case OpCode.FLOAT_SUB: { return (operand0 as VALUE.Float).minus  (operand1 as VALUE.Float); }
			case OpCode.FLOAT_MUL: { return (operand0 as VALUE.Float).times  (operand1 as VALUE.Float); }
			case OpCode.FLOAT_DIV: { return (operand0 as VALUE.Float).divide (operand1 as VALUE.Float); }
			case OpCode.FLOAT_EXP: { return (operand0 as VALUE.Float).exp    (operand1 as VALUE.Float); }

			case OpCode.LT: { return VALUE.Boolean.fromBoolean((operand0 as VALUE.Number).lt(operand1 as VALUE.Number)); }
			case OpCode.GT: { return VALUE.Boolean.fromBoolean((operand1 as VALUE.Number).lt(operand0 as VALUE.Number)); }
			case OpCode.LE: { return VALUE.Boolean.fromBoolean((operand0 as VALUE.Number).equal(operand1) || (operand0 as VALUE.Number).lt(operand1 as VALUE.Number)); }
			case OpCode.GE: { return VALUE.Boolean.fromBoolean((operand1 as VALUE.Number).equal(operand0) || (operand1 as VALUE.Number).lt(operand0 as VALUE.Number)); }

			case OpCode.ID: { return VALUE.Boolean.fromBoolean(operand0.identical(operand1)); }
			case OpCode.EQ: { return VALUE.Boolean.fromBoolean(operand0.equal(operand1)); }
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {op} = cg.vm;
		const [code0, code1]: [binaryen.ExpressionRef, binaryen.ExpressionRef] = [this.operand0.codegen(cg), this.operand1.codegen(cg)];
		switch (this.operator) {
			case OpCode.INT_ADD: { return op.intAdd(code0, code1); }
			case OpCode.INT_SUB: { return op.intSub(code0, code1); }
			case OpCode.INT_MUL: { return op.intMul(code0, code1); }
			case OpCode.INT_DIV: { return op.intDiv(code0, code1); }
			case OpCode.INT_EXP: { return op.intExp(code0, code1); }

			case OpCode.NAT_ADD: { return op.natAdd(code0, code1); }
			case OpCode.NAT_SUB: { return op.natSub(code0, code1); }
			case OpCode.NAT_MUL: { return op.natMul(code0, code1); }
			case OpCode.NAT_DIV: { return op.natDiv(code0, code1); }
			case OpCode.NAT_EXP: { return op.natExp(code0, code1); }

			case OpCode.FLOAT_ADD: { return op.floatAdd(code0, code1); }
			case OpCode.FLOAT_SUB: { return op.floatSub(code0, code1); }
			case OpCode.FLOAT_MUL: { return op.floatMul(code0, code1); }
			case OpCode.FLOAT_DIV: { return op.floatDiv(code0, code1); }
			case OpCode.FLOAT_EXP: { return op.floatExp(code0, code1); }

			case OpCode.LT: { return op.lt(code0, code1); }
			case OpCode.GT: { return op.gt(code0, code1); }
			case OpCode.LE: { return op.le(code0, code1); }
			case OpCode.GE: { return op.ge(code0, code1); }

			case OpCode.ID: { return op.id(code0, code1); }
			case OpCode.EQ: { return op.eq(code0, code1); }
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
					binaryen.v128,
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
						binaryen.v128,
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
				cg.vm.Vect.FALSE,
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
