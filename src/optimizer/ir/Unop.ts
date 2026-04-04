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
		switch (this.operator) {
			case OpCode.TOBOOL: {
				return cg.module.call('vnot', [cg.module.call('vnot', [code], rt_value)], rt_value);
			}
			case OpCode.TOINT:   { throw new Error('not yet supported.'); } // TODO: v0.5+
			case OpCode.TONAT:   { throw new Error('not yet supported.'); } // TODO: v0.5+
			case OpCode.TOFLOAT: { throw new Error('not yet supported.'); } // TODO: v0.5+
		}
		return cg.module.call(new Map<OpCode, string>([
			[OpCode.ISNULL, 'isnull'],
			[OpCode.NOT,    'vnot'],
			[OpCode.EMP,    'vemp'],
			[OpCode.NEG,    'vneg'],
		]).get(this.operator)!, [code], rt_value);
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
