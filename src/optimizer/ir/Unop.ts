import * as assert from 'node:assert';
import {runOnceMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './utils-public.ts';
import {Value} from './Value.ts';



/** An enum of allowed unary operations. */
export type OpCodeUn = (
	| OpCode.ISNULL

	| OpCode.NOT
	| OpCode.EMP

	| OpCode.INT_NEG
	| OpCode.FLOAT_NEG

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

	@runOnceMethod
	public override validate(): void {
		const NUMBER: TYPE.Type = TYPE.Union.all(TYPE.INT, TYPE.FLOAT);
		this.operand.validate();
		switch (this.operator) {
			case OpCode.TOINT:     { return assert.ok(this.operand.type.isSubtypeOf(NUMBER)); }
			case OpCode.TONAT:     { return assert.ok(this.operand.type.isSubtypeOf(NUMBER)); }
			case OpCode.TOFLOAT:   { return assert.ok(this.operand.type.isSubtypeOf(NUMBER)); }
			case OpCode.INT_NEG:   { return assert.ok(this.operand.type.isSubtypeOf(TYPE.INT)); }
			case OpCode.FLOAT_NEG: { return assert.ok(this.operand.type.isSubtypeOf(TYPE.FLOAT)); }
		}
	}

	public override toString(): string {
		return `(${ this.opCodeString } ${ this.operand })`;
	}
}
