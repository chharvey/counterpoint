import {Instruction} from './Instruction.ts';



export class Goto extends Instruction {
	public constructor(private readonly label_name: string) {
		super();
	}

	public override toString(): string {
		return `goto "${ this.label_name }".`;
	}
}
