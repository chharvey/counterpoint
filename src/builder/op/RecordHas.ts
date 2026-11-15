import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Determine whether a record has an entry. */
export class RecordHas extends Value {
	public constructor(
		public readonly record:   ValueTac,
		public readonly accessor: {readonly keyid: bigint, readonly keysrc?: string},
	) {
		super(OpCode.RECORD_HAS, TYPE.BOOL);
	}

	public override toString(): string {
		return super.toString(
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing --- keysrc may be empty string
			`@${this.accessor.keysrc || `\\x${this.accessor.keyid.toString(16)}`}`, // static accessor before collection
			this.record,
		);
	}
}
