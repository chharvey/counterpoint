import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './utils-public.ts';
import {Value} from './Value.ts';



/** Create a string template. */
export class Template extends Value {
	public constructor(private readonly items: readonly Value[]) {
		super(OpCode.STR_TEMPLATE, TYPE.STR);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated(this.items, (item) => item.validate());
	}

	public override toString(): string {
		return `(${ [this.opCodeString, ...this.items].join(' ') })`;
	}
}
