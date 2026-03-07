import {runOnceMethod} from '../../lib/index.ts';
import {OpCode} from './utils-public.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Evaluate an expression but then drop it. */
export class Drop extends Instruction {
	public constructor(private readonly value: Value) {
		super(OpCode.DROP);
	}

	@runOnceMethod
	public override validate(): void {
		return this.value.validate();
	}

	public override toString(): string {
		return `(${ this.opCodeString } ${ this.value })`;
	}
}
