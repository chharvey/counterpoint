import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	BinValue,
	BinConst,
	type Builder,
} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	type TYPE,
} from '../../typer/index.ts';
import {
	TypeName,
	ast_type_name,
} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
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
		switch (this.value) {
			case VALUE.NULL:  { return cg.getConst(BinConst.NULL); }
			case VALUE.FALSE: { return cg.getConst(BinConst.FALSE); }
			case VALUE.TRUE:  { return cg.getConst(BinConst.TRUE); }
		}
		return new BinValue(cg, this.value.codegen(cg.module)).value;
	}

	public override asTac(): Const {
		return this;
	}
}
