import {runOnceMethod} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Read an entry of a record. */
export class RecordGet extends Value {
	public constructor(
		private readonly record:   Value,
		private readonly accessor: {readonly keyid: bigint, readonly keysrc?: string},
		entry_type: TYPE.Type,
	) {
		super(entry_type);
	}

	@runOnceMethod
	public override validate(): void {
		return this.record.validate();
	}

	public override toString(): string {
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing --- keysrc may be empty string
		return `(${ TypeName[TypeName.RECORD] }.GET @${ this.accessor.keysrc || `\\x${ this.accessor.keyid.toString(16) }` } ${ this.record })`; // accessor is static so it comes first
	}
}
