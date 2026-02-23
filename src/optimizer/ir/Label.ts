import {Instruction} from './Instruction.ts';



/** A label to mark a location in the instruction list. */
export class Label extends Instruction {
	public constructor(private readonly name: string) {
		super();
	}

	public override toString(): string {
		return `"${ this.name }":`;
	}
}
