import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create an Exception. */
export class ExcpNew extends Value {
	public constructor(
		public readonly message: ValueTac,
		public readonly cause?:  ValueTac,
	) {
		super(OpCode.EXCP_NEW, TYPE.EXCP);
	}


	public override toString(): string {
		return super.toString(this.message, this.cause ?? '');
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.codegenException(
			cg.vm.mod.wasm.ref.cast(this.message.codegen(cg), cg.vm.reftype.CplString),
			this.cause ? cg.vm.mod.wasm.ref.cast(this.cause.codegen(cg), cg.vm.reftype.Exception) : undefined,
		);
	}
}
