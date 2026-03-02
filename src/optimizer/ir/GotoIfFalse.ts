import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';
import type {Label} from './Label.ts';



/** Transfer control to the given label, but if and only if the given condition is false. */
export class GotoIfFalse extends Instruction {
	public constructor(
		private readonly condition: Value,
		private readonly label:     Label,
	) {
		super();
	}

	public override toString(): string {
		return `if_false ${ this.condition }, goto "${ this.label.name }".`;
	}
}
