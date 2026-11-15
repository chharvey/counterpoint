import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Result. */
export class ResultNew extends Value {
	public constructor(
		public readonly isOk: boolean,
		success_type: TYPE.Type,
		failure_type: TYPE.Type,
		public readonly argument: ValueTac,
	) {
		super(OpCode.RESULT_NEW, new TYPE.Result(success_type, failure_type));
	}


	public override toString(): string {
		return super.toString(...(this.isOk ? [this.argument, 'nil'] : ['nil', this.argument]));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		let argument: binaryen.ExpressionRef /* (ref $Value) */ = this.argument.codegen(cg);
		if (!this.isOk) {
			argument /* (ref $Exception) */ = cg.vm.mod.wasm.ref.cast(argument, cg.vm.reftype.Exception);
		}
		return cg.codegenResult(this.isOk, argument);
	}
}
