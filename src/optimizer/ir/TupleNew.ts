import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



export class TupleNew extends Value {
	private readonly items: readonly Value[];

	public constructor(optimizer: Optimizer, items: readonly Value[], typ: TYPE.Type) {
		super(typ);
		this.items = items.map((item) => as_unit(optimizer, item));
	}

	public override toString(): string {
		return `(TUPLE.NEW ${ this.items.map((item) => item.toString()).join(' ') })`;
	}
}
