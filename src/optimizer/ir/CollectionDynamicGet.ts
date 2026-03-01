import type {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



export type CollectionDynamicGetName = (
	| TypeName.LIST
	| TypeName.DICT
	| TypeName.SET
	| TypeName.MAP
);



/** Read an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicGet extends Value {
	public constructor(
		private readonly name:       CollectionDynamicGetName,
		private readonly collection: Value,
		private readonly accessor:   Value,
		entry_type: TYPE.Type,
	) {
		super(entry_type);
	}

	public override toString(): string {
		return `(${ TypeName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
