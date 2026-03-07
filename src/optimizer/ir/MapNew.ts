import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {OpCode} from './utils-public.ts';
import {Value} from './Value.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		private readonly cases: ReadonlyMap<Value, Value>,
		typ: TYPE.Type,
	) {
		super(OpCode.MAP_NEW, typ);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Map.forEachAggregated(this.cases, (con, ant) => xjs.Array.forEachAggregated([ant, con], (value) => value.validate()));
	}

	public override toString(): string {
		return `(${ [this.opCodeString, ...[...this.cases].map(([ant, con]) => `${ ant }->${ con }`)].join(' ') })`;
	}
}
