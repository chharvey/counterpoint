import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
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
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.mod.array.get(
			cg.vm.Value.cast(this.tuple.codegen(cg), cg.vm.reftype.Tuple),
			cg.mod.i32.const(Number(this.accessor)),
			cg.vm.reftype.Value,
		);
	}
}
