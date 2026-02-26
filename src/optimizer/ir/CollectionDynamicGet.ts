import type {TYPE} from '../../typer/index.ts';
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
	) {
		super(entry_type);
	}

	public override toString(): string {
		return `(${ CollectionDynamicName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
