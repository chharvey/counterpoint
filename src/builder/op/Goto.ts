import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';



/** Transfer control to the given label. */
export class Goto extends Terminator {
	public constructor(public readonly label: string) {
		super(OpCode.GOTO);
	}

	public override toString(): string {
		return super.toString(`"${this.label}"`);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator, relooper: binaryen.Relooper): void {
		return relooper.addBranch(
			cg.getBlockRef(this._containerLabel!),
			cg.getBlockRef(this.label),
		); // unconditional
	}
}
