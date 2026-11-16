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
}
