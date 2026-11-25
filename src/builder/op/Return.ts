import {OpCode} from './Opcode.ts';
import type {ValueTac} from './ValueTac.ts';
import {Instruction} from './Instruction.ts';



/** Return a value from a function. */
export class Return extends Instruction {
	public constructor(
		/** Whether this return completes normally or abruptly (a panic). */
		public readonly isReturn: boolean,
		public readonly value?:   ValueTac,
	) {
		super(OpCode.RETURN);
	}

	public override toString(): string {
		const return_str: string = this.value?.toString() ?? 'void';
		return super.toString(...(this.isReturn ? [return_str, 'nil'] : ['nil', return_str]));
	}
}
