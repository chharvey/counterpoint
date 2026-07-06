import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {SymbolSchemaVar} from '../../validator/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';



/** Declare a Counterpoint function. */
export class Func extends Instruction {
	public constructor(
		private readonly target: SymbolSchemaVar,
		arity: bigint,
	) {
		super(OpCode.FUNC);
		arity;
	}

	public override toString(): string {
		return super.toString(this.target.source);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		return builder.setLocalStatus(this.target, 'set');
	}

	public override interpret(interp: Interpreter): void {
		interp;
		throw new Error('`Func#interpret` not yet supported.');
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		cg;
		throw new Error('`Func#codegen` not yet supported.');
	}
}
