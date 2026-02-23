import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Transfer control to the given label, but if and only if the given condition is falsy. */ // FIXME: should be the `false` value only!
export class GotoIfFalse extends Instruction {
	public constructor(
		private readonly condition:  Value,
		private readonly label_name: string,
	) {
		super();
	}

	public override toString(): string {
		return `if_false ${ this.condition }, goto "${ this.label_name }".`;
	}
}
