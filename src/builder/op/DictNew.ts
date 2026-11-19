import type {
	TYPE,
} from '../../typer/index.ts';
import {Validator} from '../../validator/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Dict. */
export class DictNew extends Value {
	public constructor(
		public readonly props: ReadonlyMap<bigint, ValueTac>,
		typ: TYPE.Type,
	) {
		super(OpCode.DICT_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.props].map(([keyid, value]) => `@${Validator.unhashIdentifierId(keyid)}->${value}`));
	}
}
