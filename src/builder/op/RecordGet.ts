import type {TYPE} from '../../typer/index.ts';
import {Validator} from '../../validator/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Read an entry of a record. */
export class RecordGet extends Value {
	public constructor(
		public readonly record:   ValueTac,
		public readonly accessor: bigint,
		entry_type: TYPE.Type,
	) {
		super(OpCode.RECORD_GET, entry_type);
	}

	public override toString(): string {
		return super.toString(
			`@${Validator.unhashIdentifierId(this.accessor)}`, // static accessor before collection
			this.record,
		);
	}
}
