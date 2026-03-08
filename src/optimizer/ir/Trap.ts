import {TYPE} from '../../typer/index.ts';
import {OpCode} from './utils-public.ts';
import {Value} from './Value.ts';



/** Immediately halt the runtime program. */
export class Trap extends Value {
	public constructor() {
		super(OpCode.TRAP, TYPE.UNKNOWN);
	}

	public override asTac(): Trap {
		return this;
	}
}
