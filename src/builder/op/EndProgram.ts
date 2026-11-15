import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';



/** End the program. */
export class EndProgram extends Terminator {
	public constructor() {
		super(OpCode.ENDPROGRAM);
	}
}
