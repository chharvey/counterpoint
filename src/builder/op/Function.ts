import type {TYPE} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Create a Function. */
export class FuncNew extends Value {
	public constructor(
		public override readonly type:     TYPE.Function,
		public          readonly tempName: string,
		public          readonly source:   string,
		public          readonly builder:  Builder,
	) {
		super(OpCode.FUNC_NEW, type);
	}

	public override toString(): string {
		return super.toString(this.tempName, `{\n${this.builder.print()}\n}`);
	}
}
