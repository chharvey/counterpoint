import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



export enum CollectionIndexedName {
	TUPLE,
	LIST,
}



export class CollectionIndexedNew extends Value {
	private readonly items: readonly Value[];

	public constructor(
		private readonly name: CollectionIndexedName,
		items:     readonly Value[],
		typ:       TYPE.Type,
		optimizer: Optimizer,
	) {
		super(typ);
		this.items = items.map((item) => as_unit(optimizer, item));
	}

	public override toString(): string {
		return `(${ CollectionIndexedName[this.name] }.NEW ${ this.items.join(' ') })`;
	}
}
