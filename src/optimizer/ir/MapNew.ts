import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {Value} from './Value.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		private readonly cases: readonly (readonly [Value, Value])[],
		typ:       TYPE.Type,
		optimizer: Optimizer,
	) {
		super(typ);
		this.cases = cases.map(([ant, con]) => [
			ant.asTac(optimizer),
			con.asTac(optimizer),
		]);
	}

	public override toString(): string {
		return `(MAP.NEW ${ this.cases.flat().join(' ') })`;
	}
}
