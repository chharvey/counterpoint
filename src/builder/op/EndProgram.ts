import {memoizeMethod} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';



/** End the program. */
export class EndProgram extends Terminator {
	public constructor() {
		super(OpCode.ENDPROGRAM);
	}

	public override interpret(): void {
		return; // no-op
	}

	@memoizeMethod
	public override codegen(): void {
		return; // no-op
	}
}
