import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



export enum CollectionDynamicName {
	LIST,
	DICT,
}



/** Read an entry of a dynamic collection (List/Dict). */
export class CollectionDynamicGet extends Value {
	public constructor(
		private readonly name:       CollectionDynamicName,
		private readonly collection: Value,
		private readonly accessor:   Value,
		entry_type: TYPE.Type,
		optimizer:  Optimizer,
	) {
		super(entry_type);
		this.collection = as_unit(optimizer, collection);
		this.accessor   = as_unit(optimizer, accessor);
	}

	public override toString(): string {
		return `(${ CollectionDynamicName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
