import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';



/** Transfer control to the given label, conditionally if specified. */
export class Goto extends Terminator {
	public constructor(private readonly label: string) {
		super(OpCode.GOTO);
	}

	public override toString(): string {
		return super.toString(`"${ this.label }"`);
	}

	@memoizeMethod
	public override codegen(_: CodeGenerator, relooper: binaryen.Relooper, blockrefs: ReadonlyMap<string, binaryen.RelooperBlockRef>): void {
		relooper.addBranch(
			blockrefs.get(this._containerLabel!)!,
			blockrefs.get(this.label)!,
		); // unconditional
	}
}
