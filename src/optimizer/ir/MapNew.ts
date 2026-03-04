import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		private readonly cases: ReadonlyMap<Value, Value>,
		typ: TYPE.Type,
	) {
		super(typ);
	}

	public override toString(): string {
		return `(${ [`${ TypeName[TypeName.MAP] }.NEW`, ...[...this.cases].map(([ant, con]) => `${ ant }->${ con }`)].join(' ') })`;
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Map.forEachAggregated(this.cases, (con, ant) => xjs.Array.forEachAggregated([ant, con], (value) => value.validate()));
	}
}
