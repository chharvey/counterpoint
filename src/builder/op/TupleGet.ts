import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Read an entry of a tuple. */
export class TupleGet extends Value {
	public constructor(
		public readonly tuple:    ValueTac,
		public readonly accessor: bigint,
		entry_type: TYPE.Type,
	) {
		super(OpCode.TUPLE_GET, entry_type);
	}

	public override toString(): string {
		return super.toString(this.accessor, this.tuple); // static accessor before collection
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.mod.wasm.array.get(
			cg.vm.Value.asTuple(this.tuple.codegen(cg)),
			cg.mod.wasm.i32.const(Number(this.accessor)),
			cg.vm.reftype.Value,
		);
	}
}
