import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Determine whether a tuple has an entry. */
export class TupleHas extends Value {
	public constructor(
		private readonly tuple:    ValueTac,
		private readonly accessor: bigint,
	) {
		super(OpCode.TUPLE_HAS, TYPE.BOOL);
	}

	public override toString(): string {
		return super.toString(this.accessor, this.tuple); // static accessor before collection
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		this.tuple.validate(builder);
		return assert_instanceof(this.tuple.type, TYPE.Tuple);
	}

	public override interpret(interp: Interpreter): VALUE.Boolean {
		const base: VALUE.Value = this.tuple.interpret(interp);
		assert_instanceof(base, VALUE.Tuple);
		return VALUE.Boolean.fromBoolean(base.has(this.accessor));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.boolFromI32(cg.mod.wasm.i32.lt_u(
			cg.mod.wasm.i32.const(Number(this.accessor)),
			cg.mod.wasm.array.len(cg.vm.Value.cast(this.tuple.codegen(cg), cg.vm.reftype.Tuple)),
		));
	}
}
