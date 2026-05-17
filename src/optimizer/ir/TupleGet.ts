import type * as binaryen from 'binaryen.ts';
import type {Builder} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
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
	public override validate(): void {
		this.tuple.validate();
		return assert_instanceof(this.tuple.type, TYPE.Tuple);
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const {mod: {wasm}, reftype, Value: VmValue} = cg.vm;
		return wasm.array.get(
			VmValue.cast(this.tuple.codegen(cg), reftype.Tuple),
			wasm.i32.const(Number(this.accessor)),
			reftype.Value,
		);
	}
}
