import type {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		public readonly cases: ReadonlyMap<ValueTac, ValueTac>,
		typ: TYPE.Type,
	) {
		super(OpCode.MAP_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.cases].map(([ant, con]) => `${ant}->${con}`));
	}
}
