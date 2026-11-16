import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Dict. */
export class DictNew extends Value {
	public constructor(
		public readonly props: ReadonlyMap<VALUE.Symbol, ValueTac>,
		typ: TYPE.Type,
	) {
		super(OpCode.DICT_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.props].map(([sym, value]) => `${sym}->${value}`));
	}
}
