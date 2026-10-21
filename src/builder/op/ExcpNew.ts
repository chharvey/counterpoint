import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	type VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Maybe. */
export class ExcpNew extends Value {
	public constructor(
		private readonly message: ValueTac,
		private readonly cause?:  ValueTac,
	) {
		super(OpCode.EXCP_NEW, TYPE.EXCP);
	}


	public override toString(): string {
		return super.toString(this.message.toString(), ...(this.cause ? [this.cause.toString()] : []));
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		assert.ok(this.type.equals(TYPE.EXCP));
		this.message.validate(builder);
		return this.cause?.validate(builder);
	}

	public override interpret(interp: Interpreter): VALUE.Exception {
		interp;
		throw new Error('interpret not yet supported.');
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		cg;
		throw new Error('codegen not yet supported.');
	}
}
