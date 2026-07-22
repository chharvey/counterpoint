import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	type VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {SymbolSchemaVar} from '../../validator/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** A Counterpoint function value. */
class OpFunction extends Value {
	public constructor(
		private readonly target: SymbolSchemaVar,
		arity: bigint,
	) {
		super(OpCode.LAMBDA, TYPE.NOTHING);
		arity;
	}

	public override toString(): string {
		return super.toString(this.target.source);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		return builder.setLocalStatus(this.target, 'set');
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
