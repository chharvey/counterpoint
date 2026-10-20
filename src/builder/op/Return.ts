import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import type {ValueTac} from './ValueTac.ts';
import {Instruction} from './Instruction.ts';



/** Return a value from a function. */
export class Return extends Instruction {
	public constructor(private readonly value: ValueTac) {
		super(OpCode.RETURN);
	}

	public override toString(): string {
		return super.toString(this.value);
	}

	public override interpret(interp: Interpreter): void {
		interp;
		throw new Error('`Return#interpret` not yet supported.');
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.mod.wasm.return(this.value.codegen(cg));
	}
}
