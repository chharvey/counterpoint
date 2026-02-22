import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



export class Drop extends Instruction {
	public constructor(private readonly value: Value) {
		super();
	}

	public override toString(): string {
		return `(DROP ${ this.value })`;
	}
}
