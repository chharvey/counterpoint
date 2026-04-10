import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
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

	public override toString(): string {
		return super.toString(this.value);
	}

	@runOnceMethod
	public override validate(): void {
		return assert.ok(this.value.toType().isSubtypeOf(this.type));
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return this.value.codegen(cg);
	}

	public override asTac(): Const {
		return this;
	}
}
