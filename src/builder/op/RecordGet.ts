import type binaryen from 'binaryen';
import {
	bigint_to_i64,
	type CodeGenerator,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Read an entry of a record. */
export class RecordGet extends Value {
	public constructor(
		private readonly record:   ValueTac,
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
	public override validate(builder: Builder): void {
		this.record.validate(builder);
		return assert_instanceof(this.record.type, TYPE.Record);
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		const base: VALUE.Value = this.record.interpret(interp);
		assert_instanceof(base, VALUE.Record);
		return base.get(this.accessor.keyid);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Record.get(
			cg.vm.Value.cast(this.record.codegen(cg), cg.vm.reftype.Record),
			bigint_to_i64(cg.mod, this.accessor.keyid, true),
		);
	}
}
