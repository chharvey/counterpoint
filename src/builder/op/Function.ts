import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {
	VALUE,
	type TYPE,
} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** A Counterpoint function value. */
class OpFunction extends Value {
	public constructor(
		public override readonly type: TYPE.Function,
		private readonly tempName: string,
		private readonly source: string,
		_instrs: () => void,
	) {
		super(OpCode.LAMBDA, type);
	}

	public override toString(): string {
		return super.toString(this.tempName, this.source);
	}

	public override interpret(): VALUE.Value {
		return new VALUE.Function(this.type, this.source);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newComposite(cg.codegenFunction(this.type.minArity));
	}
}
export {OpFunction as Function};
