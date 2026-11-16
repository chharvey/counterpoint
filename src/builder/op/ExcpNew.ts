import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create an Exception. */
export class ExcpNew extends Value {
	public constructor(
		public readonly message: ValueTac,
		public readonly cause?:  ValueTac,
	) {
		super(OpCode.EXCP_NEW, TYPE.EXCP);
	}


	public override toString(): string {
		return super.toString(this.message, this.cause ?? '');
	}
}
