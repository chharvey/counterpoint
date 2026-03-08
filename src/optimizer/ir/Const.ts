import * as assert from 'node:assert';
import {runOnceMethod} from '../../lib/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {OpCode} from './utils-public.ts';
import {
	TypeName,
	ast_type_name,
} from './TypeName.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		const typ: TYPE.Unit = value.toType();
		super(new Map<TypeName, OpCode>([
			[TypeName.TRAP,  OpCode.TRAP],
			[TypeName.NULL,  OpCode.NULL_CONST],
			[TypeName.BOOL,  OpCode.BOOL_CONST],
			[TypeName.SYM,   OpCode.SYM_CONST],
			[TypeName.INT,   OpCode.INT_CONST],
			[TypeName.NAT,   OpCode.NAT_CONST],
			[TypeName.FLOAT, OpCode.FLOAT_CONST],
			[TypeName.STR,   OpCode.STR_CONST],
		]).get(ast_type_name(typ))!, typ);
	}

	@runOnceMethod
	public override validate(): void {
		return assert.ok(this.value.toType().isSubtypeOf(this.type));
	}

	public override toString(): string {
		return super.toString(this.value);
	}

	public override asTac(): Const {
		return this;
	}
}
