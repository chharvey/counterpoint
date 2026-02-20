import type {Value} from './Value.ts';
import {Instruction} from './Instruction.ts';



export class Drop extends Instruction {
	public constructor(private readonly value: Value) {
		super();
	}

	public override toString(): string {
		return `(DROP ${ this.value.toString() })`;
	}
}
