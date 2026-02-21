import {Instruction} from './Instruction.ts';



export class Drop extends Instruction {
	public constructor(private readonly value: Instruction) {
		super();
	}

	public override toString(): string {
		return `(DROP ${ this.value })`;
	}
}
