import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Determine whether a tuple has an entry. */
export class TupleHas extends Value {
	public constructor(
		public readonly tuple:    ValueTac,
		public readonly accessor: bigint,
	) {
		super(OpCode.TUPLE_HAS, TYPE.BOOL);
	}

	public override toString(): string {
		return super.toString(this.accessor, this.tuple); // static accessor before collection
	}
}
