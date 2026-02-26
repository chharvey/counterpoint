import type {TYPE} from '../../typer/index.ts';
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
		typ: TYPE.Type,
	) {
		super(typ);
	}

	public override toString(): string {
		return `(${ CollectionLinearName[this.name] }.NEW ${ this.items.join(' ') })`;
	}
}
