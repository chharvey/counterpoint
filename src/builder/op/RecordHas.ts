import {TYPE} from '../../typer/index.ts';
import {Validator} from '../../validator/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Determine whether a record has an entry. */
export class RecordHas extends Value {
	public constructor(
		public readonly record:   ValueTac,
		public readonly accessor: bigint,
	) {
		super(OpCode.RECORD_HAS, TYPE.BOOL);
	}

	public override toString(): string {
		return super.toString(
			`@${Validator.unhashIdentifierId(this.accessor)}`, // static accessor before collection
			this.record,
		);
	}
}
