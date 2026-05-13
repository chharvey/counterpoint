import * as assert from 'node:assert';
import binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** An enum of allowed unary operations. */
export type OpCodeUn = (
	| OpCode.ISNULL

	| OpCode.NOT
	| OpCode.EMP
	| OpCode.NEG

	| OpCode.TOBOOL
	| OpCode.TOINT
	| OpCode.TONAT
	| OpCode.TOFLOAT

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
	public override validate(): void {
		this.operand.validate();
		switch (this.operator) {
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

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const code: binaryen.ExpressionRef = this.operand.codegen(cg);
		switch (this.operator) {
			case OpCode.ISNULL: { return cg.vm.op.isNull(code); }

			case OpCode.NOT: { return cg.vm.op.not(code); }
			case OpCode.EMP: { return cg.vm.op.isEmpty(code); }
			case OpCode.NEG: { return cg.vm.op.negate(code); }

			case OpCode.TOBOOL:  { return cg.vm.op.not(cg.vm.op.not(code)); }
			case OpCode.TOINT:   { return cg.vm.op.toInt(code); }
			case OpCode.TONAT:   { return cg.vm.op.toNat(code); }
			case OpCode.TOFLOAT: { return cg.vm.op.toFloat(code); }

			case OpCode.LIST_COUNT: { return cg.vm.Value.newPrimitive(cg.vm.Vect.newNat(cg.module.i64.extend_u(cg.vm.List.count(code)))); }
			case OpCode.DICT_COUNT: { return cg.vm.Value.newPrimitive(cg.vm.Vect.newNat(cg.module.i64.extend_u(cg.vm.Dict.count(code)))); }
			case OpCode.SET_COUNT:  { return cg.vm.Value.newPrimitive(cg.vm.Vect.newNat(cg.module.i64.extend_u(cg.module.call('Map.count',  [code], binaryen.i32)))); }
			case OpCode.MAP_COUNT:  { return cg.vm.Value.newPrimitive(cg.vm.Vect.newNat(cg.module.i64.extend_u(cg.module.call('Map.count',  [code], binaryen.i32)))); }
		}
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: Builder, Operator: any, t0: any, arg0: any, drop_then: any, binaryen: any): number {
		if (this.type().isSubtypeOf(TYPE.TRUE)) {
			return drop_then(cg.module, [arg0], true);
		} else if (this.type().isSubtypeOf(TYPE.FALSE)) {
			return drop_then(cg.module, [arg0], false);
		}
		if (this.operator === Operator.NOT) {
			if (t0.isDefinitelyFalsy) {
				return cg.module.block(null, [
					cg.module.drop(arg0),
					cg.vm.Vect.TRUE,
				], binaryen.v128);
			} else if (t0.isDefinitelyTruthy) {
				return cg.module.block(null, [
					cg.module.drop(arg0),
					cg.vm.Vect.FALSE,
				], binaryen.v128);
			}
		} else if (this.operator === Operator.EMP && t0.isDefinitelyFalsy) {
			return cg.module.block(null, [
				cg.module.drop(arg0),
				cg.vm.Vect.TRUE,
			], binaryen.v128);
		}
		return 0;
	}
	/* eslint-enable */
}
