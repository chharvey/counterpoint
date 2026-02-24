import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



export class TupleNew extends Value {
	public static new(optimizer: Optimizer, items: readonly Value[], typ: TYPE.Type): TupleNew {
		return new TupleNew(items.map((item) => as_unit(optimizer, item)), typ);
	}


	private constructor(
		private readonly items: readonly Value[],
		private readonly typ:   TYPE.Type,
	) {
		super();
	}

	public override get type(): TYPE.Type {
		return this.typ;
	}

	public override toString(): string {
		return `(TUPLE.NEW ${ this.items.map((item) => item.toString()).join(' ') })`;
	}
}
