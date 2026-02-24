import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {is_unit} from './utils-private.ts';
import {Value} from './Value.ts';
import {Get} from './Get.ts';



export class TupleNew extends Value {
	public static new(optimizer: Optimizer, items: Value[], typ: TYPE.Type): TupleNew {
		items.forEach((item, i) => {
			if (!is_unit(item)) {
				items[i] = new Get(optimizer.newTempLocal(item.type, item));
			}
		});
		return new TupleNew(items, typ);
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
