import {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Immediately halt the runtime program. */
export class Trap extends Value {
	public constructor() {
		super(TYPE.NEVER);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.TRAP] })`;
	}

	public override asTac(): Trap {
		return this;
	}
}
