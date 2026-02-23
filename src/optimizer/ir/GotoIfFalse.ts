import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



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
