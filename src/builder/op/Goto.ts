import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';



/** Transfer control to the given label. */
export class Goto extends Terminator {
	public constructor(private readonly label: string) {
		super(OpCode.GOTO);
	}

	public override toString(): string {
		return super.toString(`"${ this.label }"`);
	}

	public override interpret(interp: Interpreter): void {
		return interp.interpretNextBlock(this.label);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator, relooper: binaryen.Relooper): void {
		return relooper.addBranch(
			cg.getBlockRef(this._containerLabel!),
			cg.getBlockRef(this.label),
			0, // unconditional
			0,
		);
	}
}
