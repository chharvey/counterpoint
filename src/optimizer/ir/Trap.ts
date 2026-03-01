import {
	TypeName,
	Type,
} from './Type.ts';
import {Value} from './Value.ts';



/** Immediately halt the runtime program. */
export class Trap extends Value {
	public constructor() {
		super(Type.TRAP);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.TRAP] })`;
	}

	public override asTac(): Trap {
		return this;
	}
}
