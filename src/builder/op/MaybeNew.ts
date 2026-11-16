import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Maybe. */
export class MaybeNew extends Value {
	public constructor(
		typ: TYPE.Type,
		public readonly value?: ValueTac,
	) {
		super(OpCode.MAYBE_NEW, new TYPE.Maybe(typ));
	}


	public override toString(): string {
		return super.toString(this.value ?? '');
	}
}
