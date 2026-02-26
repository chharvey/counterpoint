import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
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
		this.collection = collection.asTac(optimizer);
		this.accessor   = accessor  .asTac(optimizer);
	}

	public override toString(): string {
		return `(${ CollectionDynamicName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
