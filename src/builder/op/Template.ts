import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a string template. */
export class Template extends Value {
	public constructor(public readonly items: readonly ValueTac[]) {
		super(OpCode.STR_TEMPLATE, TYPE.STR);
	}

	public override toString(): string {
		return super.toString(...this.items);
	}
}
