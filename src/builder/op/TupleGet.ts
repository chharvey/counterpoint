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



/** Read an entry of a tuple. */
export class TupleGet extends Value {
	public constructor(
		private readonly tuple:    ValueTac,
		private readonly accessor: bigint,
		entry_type: TYPE.Type,
	) {
		super(OpCode.TUPLE_GET, entry_type);
	}

	public override toString(): string {
		return super.toString(this.accessor, this.tuple); // static accessor before collection
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		this.tuple.validate(builder);
		return assert_instanceof(this.tuple.type, TYPE.Tuple);
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		const base: VALUE.Value = this.tuple.interpret(interp);
		assert_instanceof(base, VALUE.Tuple);
		return base.get(this.accessor);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.mod.wasm.array.get(
			cg.vm.Value.cast(this.tuple.codegen(cg), cg.vm.reftype.Tuple),
			cg.mod.wasm.i32.const(Number(this.accessor)),
			cg.vm.reftype.Value,
		);
	}
}
