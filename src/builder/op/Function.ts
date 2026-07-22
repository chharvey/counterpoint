import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** A Counterpoint function value. */
class OpFunction extends Value {
	public constructor(
		typ: TYPE.Function,
		private readonly tempName: string,
		private readonly source: string,
		_instrs: () => void,
	) {
		super(OpCode.LAMBDA, typ);
	}

	public override toString(): string {
		return super.toString(this.tempName, this.source);
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		interp;
		throw new Error('`OpFunction#interpret` not yet supported.');
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		cg;
		throw new Error('`OpFunction#codegen` not yet supported.');
	}
}
export {OpFunction as Function};
