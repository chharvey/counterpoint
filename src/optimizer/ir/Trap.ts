import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Immediately halt the runtime program. */
export class Trap extends Value {
	public constructor() {
		super(TypeName.TRAP);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.TRAP] })`;
	}

	public override asTac(): Trap {
		return this;
	}
}
