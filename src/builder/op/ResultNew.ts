import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Result. */
export class ResultNew extends Value {
	public constructor(
		public readonly isOk: boolean,
		success_type: TYPE.Type,
		failure_type: TYPE.Type,
		public readonly argument: ValueTac,
	) {
		super(OpCode.RESULT_NEW, new TYPE.Result(success_type, failure_type));
	}


	public override toString(): string {
		return super.toString(...(this.isOk ? [this.argument, 'nil'] : ['nil', this.argument]));
	}
}
