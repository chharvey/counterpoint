import * as assert from 'node:assert';
import * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {drop_then} from './utils-private.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** An enum of allowed unary operations. */
export type OpCodeUn = (
	| OpCode.MAYBE_UNWRAP

	| OpCode.ISNULL
	| OpCode.ISNONE

	| OpCode.NOT
	| OpCode.EMP
	| OpCode.NEG

	| OpCode.TOBOOL
	| OpCode.TOINT
	| OpCode.TONAT
	| OpCode.TOFLOAT
	| OpCode.TOSTR

	| OpCode.LIST_COUNT
	| OpCode.DICT_COUNT
	| OpCode.SET_COUNT
	| OpCode.MAP_COUNT
);



/** A unary operation of 1 value. */
export class Unop extends Value {
	public constructor(
		private readonly operator: OpCodeUn,
		private readonly operand:  ValueTac,
		typ: TYPE.Type,
	) {
		super(operator, typ);
	}

	public override toString(): string {
		return super.toString(this.operand);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		this.operand.validate(builder);
		switch (this.operator) {
			case OpCode.MAYBE_UNWRAP: {
				assert_instanceof(this.operand.type, TYPE.Maybe);
				return assert.ok(this.type.isSubtypeOf(this.operand.type.typearg));
			}

			case OpCode.NEG:
			case OpCode.TOINT:
			case OpCode.TONAT:
			case OpCode.TOFLOAT: { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }

			case OpCode.LIST_COUNT: {
				assert_instanceof(this.operand.type, TYPE.List);
				return assert.ok(this.type.isSubtypeOf(TYPE.NAT));
			}
			case OpCode.DICT_COUNT: {
				assert_instanceof(this.operand.type, TYPE.Dict);
				return assert.ok(this.type.isSubtypeOf(TYPE.NAT));
			}
			case OpCode.SET_COUNT:  {
				assert_instanceof(this.operand.type, TYPE.Set);
				return assert.ok(this.type.isSubtypeOf(TYPE.NAT));
			}
			case OpCode.MAP_COUNT:  {
				assert_instanceof(this.operand.type, TYPE.Map);
				return assert.ok(this.type.isSubtypeOf(TYPE.NAT));
			}
		}
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		const operand: VALUE.Value = this.operand.interpret(interp);
		switch (this.operator) {
			case OpCode.MAYBE_UNWRAP: { throw new Error('not yet supported.'); }

			case OpCode.ISNULL: { return VALUE.Boolean.fromBoolean(operand.identical(VALUE.NULL)); }
			case OpCode.ISNONE: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Maybe && operand.isNone); }

			case OpCode.NOT: { return VALUE.Boolean.fromBoolean(!operand.isTruthy); }
			case OpCode.EMP: { return VALUE.Boolean.fromBoolean(!operand.isTruthy || operand.isEmpty); }
			case OpCode.NEG: { return (operand as VALUE.Integer | VALUE.Float).neg(); }

			case OpCode.TOBOOL:  { return VALUE.Boolean.fromBoolean(operand.isTruthy); }
			case OpCode.TOINT:   { return (operand as VALUE.Number).toInt(); }
			case OpCode.TONAT:   { return (operand as VALUE.Number).toNat(); }
			case OpCode.TOFLOAT: { return (operand as VALUE.Number).toFloat(); }
			case OpCode.TOSTR:   { return (operand as VALUE.Number).toCplString(); }

			case OpCode.LIST_COUNT: { return new VALUE.Natural((operand as VALUE.List).count); }
			case OpCode.DICT_COUNT: { return new VALUE.Natural((operand as VALUE.Dict).count); }
			case OpCode.SET_COUNT:  { return new VALUE.Natural((operand as VALUE.Set).count); }
			case OpCode.MAP_COUNT:  { return new VALUE.Natural((operand as VALUE.Map).count); }
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, op, Vect, Value: VmValue, List, Dict, Map: VmMap}, mod: {wasm}} = cg;
		const code: binaryen.ExpressionRef = this.operand.codegen(cg);
		switch (this.operator) {
			case OpCode.MAYBE_UNWRAP: { throw new Error('not yet supported.'); }

			case OpCode.ISNULL: { return op.isNull(code); }
			case OpCode.ISNONE: { return op.isNone(code); }

			case OpCode.NOT: { return op.not(code); }
			case OpCode.EMP: { return op.isEmpty(code); }
			case OpCode.NEG: { return op.negate(code); }

			case OpCode.TOBOOL:  { return op.not(op.not(code)); }
			case OpCode.TOINT:   { return op.toInt(code); }
			case OpCode.TONAT:   { return op.toNat(code); }
			case OpCode.TOFLOAT: { return op.toFloat(code); }
			case OpCode.TOSTR:   { return VmValue.stringify(code); }

			case OpCode.LIST_COUNT: { return VmValue.newPrimitive(Vect.newNat(wasm.i64.extend_i32_u(List .count(VmValue.cast(code, reftype.List))))); }
			case OpCode.DICT_COUNT: { return VmValue.newPrimitive(Vect.newNat(wasm.i64.extend_i32_u(Dict .count(VmValue.cast(code, reftype.Dict))))); }
			case OpCode.SET_COUNT:  { return VmValue.newPrimitive(Vect.newNat(wasm.i64.extend_i32_u(VmMap.count(VmValue.cast(code, reftype.Map))))); }
			case OpCode.MAP_COUNT:  { return VmValue.newPrimitive(Vect.newNat(wasm.i64.extend_i32_u(VmMap.count(VmValue.cast(code, reftype.Map))))); }
		}
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: CodeGenerator, Operator: any, t0: any, arg0: any): number {
		const {vm: {Vect}, mod: {wasm}} = cg;
		if (this.type().isSubtypeOf(TYPE.TRUE)) {
			return drop_then(cg, [arg0], true);
		} else if (this.type().isSubtypeOf(TYPE.FALSE)) {
			return drop_then(cg, [arg0], false);
		}
		if (this.operator === Operator.NOT) {
			if (t0.isDefinitelyFalsy) {
				return wasm.block(null, [
					wasm.drop(arg0),
					Vect.TRUE,
				], binaryen.v128);
			} else if (t0.isDefinitelyTruthy) {
				return wasm.block(null, [
					wasm.drop(arg0),
					Vect.FALSE,
				], binaryen.v128);
			}
		} else if (this.operator === Operator.EMP && t0.isDefinitelyFalsy) {
			return wasm.block(null, [
				wasm.drop(arg0),
				Vect.TRUE,
			], binaryen.v128);
		}
		return 0;
	}
	/* eslint-enable */
}
