import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Determine whether a tuple has an entry. */
export class TupleHas extends Value {
	public constructor(
		public readonly tuple:    ValueTac,
		public readonly accessor: bigint,
	) {
		super(OpCode.TUPLE_HAS, TYPE.BOOL);
	}

	public override toString(): string {
		return super.toString(this.accessor, this.tuple); // static accessor before collection
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.boolFromI32(cg.mod.wasm.i32.lt_u(
			cg.mod.wasm.i32.const(Number(this.accessor)),
			cg.mod.wasm.array.len(cg.vm.Value.asTuple(this.tuple.codegen(cg))),
		));
	}
}
