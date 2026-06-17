import {memoizeMethod} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';



/** Transfer control to the given label, conditionally if specified. */
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
