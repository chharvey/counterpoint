import type {TYPE} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** A Counterpoint function value. */
class OpFunction extends Value {
	public constructor(
		public override readonly type: TYPE.Function,
		private readonly tempName: string,
		public  readonly source:   string,
		private readonly builder:  Builder,
	) {
		super(OpCode.FUNCTION, type);
	}

	public override toString(): string {
		return super.toString(this.tempName, `{\n${this.builder.print()}\n}`);
	}
}
export {OpFunction as Function};
