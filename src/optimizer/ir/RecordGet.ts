import {
	assert_instanceof,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './utils-public.ts';
import {Value} from './Value.ts';



/** Read an entry of a record. */
export class RecordGet extends Value {
	public constructor(
		private readonly record:   Value,
		private readonly accessor: {readonly keyid: bigint, readonly keysrc?: string},
		entry_type: TYPE.Type,
	) {
		super(OpCode.RECORD_GET, entry_type);
	}

	@runOnceMethod
	public override validate(): void {
		this.record.validate();
		return assert_instanceof(this.record.type, TYPE.Record);
	}

	public override toString(): string {
		return super.toString(
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing --- keysrc may be empty string
			`@${ this.accessor.keysrc || `\\x${ this.accessor.keyid.toString(16) }` }`, // static accessor before collection
			this.record,
		);
	}
}
