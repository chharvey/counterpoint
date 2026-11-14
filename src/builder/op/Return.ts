import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import type {ValueTac} from './ValueTac.ts';
import {Instruction} from './Instruction.ts';



/** Return a value from a function. */
export class Return extends Instruction {
	public constructor(
		/** Whether this return completes normally or abruptly (a panic). */
		private readonly isReturn: boolean,
		private readonly value:    ValueTac,
	) {
		super(OpCode.RETURN);
	}

	public override toString(): string {
		return super.toString(...(this.isReturn ? [this.value, 'nil'] : ['nil', this.value]));
	}

	public override validate(builder: Builder): void {
		this.value.validate(builder);
		if (!this.isReturn) {
			assert.ok(this.value.type.isSubtypeOf(TYPE.EXCP));
		}
	}

	public override interpret(interp: Interpreter): void {
		interp;
		throw new Error('`Return#interpret` not yet supported.');
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {heaptype}, mod: {wasm}} = cg;
		const value: binaryen.ExpressionRef = this.value.codegen(cg);
		return cg.mod.wasm.return(wasm.tuple.make((this.isReturn
			? [value, wasm.ref.null(heaptype.Exception)]
			: [wasm.ref.null(heaptype.Value), value]
		)));
	}
}
