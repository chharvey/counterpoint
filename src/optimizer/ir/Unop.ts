import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	type Builder,
	BinVect,
} from '../../index.ts';
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
		if (this.operator === OpCode.TOBOOL) {
			return cg.module.call('vnot', [cg.module.call('vnot', [code], cg.reftype.Value)], cg.reftype.Value);
		}
		switch (this.operator) {
			case OpCode.LIST_COUNT: { return cg.vm.Value.new(new BinVect(cg.module, cg.module.i64.extend_u(cg.module.call('List.count', [code], binaryen.i32)), {unsigned: true}).vect); }
			case OpCode.DICT_COUNT: { return cg.vm.Value.new(new BinVect(cg.module, cg.module.i64.extend_u(cg.module.call('Dict.count', [code], binaryen.i32)), {unsigned: true}).vect); }
			case OpCode.SET_COUNT:  { return cg.vm.Value.new(new BinVect(cg.module, cg.module.i64.extend_u(cg.module.call('Map.count',  [code], binaryen.i32)), {unsigned: true}).vect); }
			case OpCode.MAP_COUNT:  { return cg.vm.Value.new(new BinVect(cg.module, cg.module.i64.extend_u(cg.module.call('Map.count',  [code], binaryen.i32)), {unsigned: true}).vect); }
		}
		return cg.module.call(new Map<OpCode, string>([
			[OpCode.ISNULL,  'isnull'],
			[OpCode.NOT,     'vnot'],
			[OpCode.EMP,     'vemp'],
			[OpCode.NEG,     'vneg'],
			[OpCode.TOINT,   'vtoi'],
			[OpCode.TONAT,   'vton'],
			[OpCode.TOFLOAT, 'vtof'],
		]).get(this.operator)!, [code], cg.reftype.Value);
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: Builder, Operator: any, BinVect: any, t0: any, arg0: any, drop_then: any, binaryen: any): number {
		if (this.type().isSubtypeOf(TYPE.TRUE)) {
			return drop_then(cg.module, [arg0], true);
		} else if (this.type().isSubtypeOf(TYPE.FALSE)) {
			return drop_then(cg.module, [arg0], false);
		}
		if (this.operator === Operator.NOT) {
			if (t0.isDefinitelyFalsy) {
				return cg.module.block(null, [
					cg.module.drop(arg0),
					new BinVect(cg.module, true).vect,
				], binaryen.v128);
			} else if (t0.isDefinitelyTruthy) {
				return cg.module.block(null, [
					cg.module.drop(arg0),
					new BinVect(cg.module, false).vect,
				], binaryen.v128);
			}
		} else if (this.operator === Operator.EMP && t0.isDefinitelyFalsy) {
			return cg.module.block(null, [
				cg.module.drop(arg0),
				new BinVect(cg.module, true).vect,
			], binaryen.v128);
		}
		return 0;
	}
	/* eslint-enable */
}
