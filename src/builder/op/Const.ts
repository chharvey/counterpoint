import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {
	TypeName,
	ast_type_name,
} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {ValueTac} from './ValueTac.ts';



/** A constant primitive value. */
export class Const extends ValueTac {
	public constructor(private readonly interpreterValue: VALUE.Primitive) {
		const typ: TYPE.Unit = interpreterValue.toType();
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
		return super.toString(this.interpreterValue);
	}

	@runOnceMethod
	public override validate(): void {
		return assert.ok(this.interpreterValue.toType().isSubtypeOf(this.type));
	}

	public override interpret(): VALUE.Primitive {
		return this.interpreterValue;
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return this.interpreterValue.codegen(cg);
	}

	public override asTac(): this {
		return this;
	}
}
