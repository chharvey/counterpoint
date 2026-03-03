import * as assert from 'node:assert';
import {runOnceMethod} from '../../lib/index.ts';
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

	INT_NEG,
	FLOAT_NEG,
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

	@runOnceMethod
	public override validate(): void {
		const NUMBER: TYPE.Type = TYPE.Union.all(TYPE.INT, TYPE.FLOAT);
		this.operand.validate();
		switch (this.operator) {
			case UnOp.TOINT:     { return assert.ok(this.operand.type.isSubtypeOf(NUMBER)); }
			case UnOp.TONAT:     { return assert.ok(this.operand.type.isSubtypeOf(NUMBER)); }
			case UnOp.TOFLOAT:   { return assert.ok(this.operand.type.isSubtypeOf(NUMBER)); }
			case UnOp.INT_NEG:   { return assert.ok(this.operand.type.isSubtypeOf(TYPE.INT)); }
			case UnOp.FLOAT_NEG: { return assert.ok(this.operand.type.isSubtypeOf(TYPE.FLOAT)); }
		}
	}

	public override toString(): string {
		return `(${ UnOp[this.operator].replace(/_/, '.') } ${ this.operand })`;
	}
}
