import * as assert from 'node:assert';
import binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {Value} from './Value.ts';



/** An enum of unary operations. */
export enum UnOp {
	ISNULL,

	TOBOOL,
	TOINT,
	TONAT,
	TOFLOAT,

	NOT,
	EMP,
	NEG,
}



/** A unary operation of 1 value. */
export class Unop extends Value {
	public constructor(
		private readonly operator: UnOp,
		private readonly operand:  Value,
		typ: TYPE.Type,
	) {
		super(typ);
	}

	public override toString(): string {
		return `(${ UnOp[this.operator].replace(/_/, '.') } ${ this.operand })`;
	}

	@runOnceMethod
	public override validate(): void {
		this.operand.validate();
		switch (this.operator) {
			case UnOp.TOINT:     { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }
			case UnOp.TONAT:     { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }
			case UnOp.TOFLOAT:   { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }
			case UnOp.NEG:       { return assert.ok(this.operand.type.isSubtypeOf(TYPE.NUMBER)); }
		}
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const code: binaryen.ExpressionRef = this.operand.codegen(cg);
		if (this.operator === UnOp.TOBOOL) {
			return cg.module.call('vnot', [cg.module.call('vnot', [code], binaryen.v128)], binaryen.v128);
		}
		return cg.module.call(new Map<UnOp, string>([
			[UnOp.ISNULL,  'isnull'],
			[UnOp.TOINT,   'vtoi'],
			[UnOp.TONAT,   'vton'],
			[UnOp.TOFLOAT, 'vtof'],
			[UnOp.NOT,     'vnot'],
			[UnOp.EMP,     'vemp'],
			[UnOp.NEG,     'vneg'],
		]).get(this.operator)!, [code], binaryen.v128);
	}
}
