import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {Value} from './Value.ts';



export enum CollectionLinearName {
	TUPLE,
	LIST,
	SET,
}



/** Create an indexed collection (tuple/List/Set). */
export class CollectionLinearNew extends Value {
	public constructor(
		private readonly name:  CollectionLinearName,
		private readonly items: readonly Value[],
		typ:       TYPE.Type,
		optimizer: Optimizer,
	) {
		super(typ);
		this.items = items.map((item) => item.asTac(optimizer));
	}

	public override toString(): string {
		return `(${ CollectionLinearName[this.name] }.NEW ${ this.items.join(' ') })`;
	}
}
