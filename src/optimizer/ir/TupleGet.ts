import type binaryen from 'binaryen';
import {
	BinValue,
	type Builder,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Read an entry of a tuple. */
export class TupleGet extends Value {
	public constructor(
		private readonly tuple:    Value,
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
		return cg.module.array.get(
			new BinValue(cg, this.tuple.codegen(cg)).cast(cg.reftype.Tuple),
			cg.module.i32.const(Number(this.accessor)),
			cg.reftype.Value,
		);
	}
}
