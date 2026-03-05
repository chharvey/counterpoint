import * as assert from 'node:assert';
import type binaryen from 'binaryen';
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
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
