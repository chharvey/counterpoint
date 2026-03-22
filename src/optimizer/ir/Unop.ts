import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



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
);



/** A unary operation of 1 value. */
export class Unop extends Value {
	public constructor(
		private readonly operator: OpCodeUn,
		private readonly operand:  Value,
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
			case OpCode.TOINT:   { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }
			case OpCode.TONAT:   { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }
			case OpCode.TOFLOAT: { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }
			case OpCode.NEG:     { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }
		}
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
		const code: binaryen.ExpressionRef = this.operand.codegen(cg);
		if (this.operator === OpCode.TOBOOL) {
			return cg.module.call('vnot_', [cg.module.call('vnot_', [code], rt_value)], rt_value);
		}
		return cg.module.call(new Map<OpCode, string>([
			[OpCode.ISNULL,  'isnull_'],
			[OpCode.NOT,     'vnot_'],
			[OpCode.EMP,     'vemp_'],
			[OpCode.NEG,     'vneg_'],
			[OpCode.TOINT,   'vtoi_'],
			[OpCode.TONAT,   'vton_'],
			[OpCode.TOFLOAT, 'vtof_'],
		]).get(this.operator)!, [code], rt_value);
	}
}
