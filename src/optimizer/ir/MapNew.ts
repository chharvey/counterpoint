import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		private readonly cases: readonly (readonly [Value, Value])[],
		typ:       TYPE.Type,
		optimizer: Optimizer,
	) {
		super(typ);
		this.cases = cases.map(([ant, con]) => [as_unit(optimizer, ant), as_unit(optimizer, con)]);
	}

	public override toString(): string {
		return `(MAP.NEW ${ this.cases.flat().join(' ') })`;
	}
}
