import type binaryen from 'binaryen';
import {
	bigint_to_i64,
	BinValue,
	type Builder,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
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

	public override toString(): string {
		return super.toString(
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing --- keysrc may be empty string
			`@${ this.accessor.keysrc || `\\x${ this.accessor.keyid.toString(16) }` }`, // static accessor before collection
			this.record,
		);
	}

	@runOnceMethod
	public override validate(): void {
		this.record.validate();
		return assert_instanceof(this.record.type, TYPE.Record);
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return cg.module.call('Record.get', [
			cg.module.ref.cast(new BinValue(cg, this.record.codegen(cg)).compositeValue, cg.getReftype('(ref $Record)')),
			bigint_to_i64(cg.module, this.accessor.keyid, true),
		], cg.getReftype('(ref $Value)'));
	}
}
