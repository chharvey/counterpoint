import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {drop_then} from './utils-private.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** An enum of allowed unary operations. */
export type OpCodeUn = (
	| OpCode.BOOL_FROM
	| OpCode.INT_FROM
	| OpCode.NAT_FROM
	| OpCode.FLOAT_FROM
	| OpCode.STR_FROM

	| OpCode.NOT
	| OpCode.EMP
	| OpCode.NEG

	| OpCode.LIST_COUNT
	| OpCode.DICT_COUNT
	| OpCode.SET_COUNT
	| OpCode.MAP_COUNT

	| OpCode.NONE_IS
	| OpCode.FAIL_IS
	| OpCode.MAYBE_UNWRAP
	| OpCode.RESULT_UNWRAP
	| OpCode.RESULT_EXTRACT
);



/** A unary operation of 1 value. */
export class Unop extends Value {
	public constructor(
		public readonly operator: OpCodeUn,
		public readonly operand:  ValueTac,
		typ: TYPE.Type,
	) {
		super(operator, typ);
	}

	public override toString(): string {
		return super.toString(this.operand);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {op, Vect, Value: VmValue, List, Dict, Map: VmMap}, mod: {wasm}} = cg;
		const code: binaryen.ExpressionRef = this.operand.codegen(cg);
		switch (this.operator) {
			case OpCode.BOOL_FROM:  { return op.not(op.not(code)); }
			case OpCode.INT_FROM:   { return op.toInt(code); }
			case OpCode.NAT_FROM:   { return op.toNat(code); }
			case OpCode.FLOAT_FROM: { return op.toFloat(code); }
			case OpCode.STR_FROM:   { return op.toStr(code); }

			case OpCode.NOT: { return op.not(code); }
			case OpCode.EMP: { return op.isEmpty(code); }
			case OpCode.NEG: { return op.negate(code); }

			case OpCode.LIST_COUNT: { return VmValue.fromNat(Vect.newNat(wasm.i64.extend_i32_u(List .count(VmValue.asList(code))))); }
			case OpCode.DICT_COUNT: { return VmValue.fromNat(Vect.newNat(wasm.i64.extend_i32_u(Dict .count(VmValue.asDict(code))))); }
			case OpCode.SET_COUNT:  { return VmValue.fromNat(Vect.newNat(wasm.i64.extend_i32_u(VmMap.count(VmValue.asMap (code))))); }
			case OpCode.MAP_COUNT:  { return VmValue.fromNat(Vect.newNat(wasm.i64.extend_i32_u(VmMap.count(VmValue.asMap (code))))); }

			case OpCode.NONE_IS:        { return cg.vm.op.isNone(code); }
			case OpCode.FAIL_IS:        { return cg.vm.op.isFail(code); }
			case OpCode.MAYBE_UNWRAP:   { return op.unwrapMaybe(code); }
			case OpCode.RESULT_UNWRAP:  { return op.unwrapResult(code); }
			case OpCode.RESULT_EXTRACT: { return op.extractResult(code); }
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
					cg.vm.Value.TRUE,
				], cg.vm.reftype.Value);
			} else if (t0.isDefinitelyTruthy) {
				return wasm.block(null, [
					wasm.drop(arg0),
					cg.vm.Value.FALSE,
				], cg.vm.reftype.Value);
			}
		} else if (this.operator === Operator.EMP && t0.isDefinitelyFalsy) {
			return wasm.block(null, [
				wasm.drop(arg0),
				cg.vm.Value.TRUE,
			], cg.vm.reftype.Value);
		}
		return 0;
	}
	/* eslint-enable */
}
