import {Instruction} from './Instruction.ts';
import type {Label} from './Label.ts';



/** Transfer control to the given label. */
export class Goto extends Instruction {
	public constructor(private readonly label: Label) {
		super();
	}

	public override toString(): string {
		return `goto "${ this.label.name }".`;
	}
}
