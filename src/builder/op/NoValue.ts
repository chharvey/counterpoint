import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {ValueTac} from './ValueTac.ts';



/** Immediately halt the runtime program. */
export class NoValue extends ValueTac {
	public constructor(public readonly isVoid: boolean = false) {
		isVoid
			? super(OpCode.VOID, TYPE.NOTHING) // TODO: type native `null`
			: super(OpCode.TRAP, TYPE.NOTHING);
	}

	public override asTac(): this {
		return this;
	}
}
