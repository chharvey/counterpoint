import {runOnceMethod} from '../../lib/index.ts';
import {
	OpCode,
	Opcode,
} from './Opcode.ts';
import type {Value} from './Value.ts';



/** Evaluate an expression but then drop it. */
export class Drop extends Opcode {
	public constructor(private readonly value: Value) {
		super(OpCode.DROP);
	}

	@runOnceMethod
	public override validate(): void {
		return this.value.validate();
	}

	public override toString(): string {
		return super.toString(this.value);
	}
}
