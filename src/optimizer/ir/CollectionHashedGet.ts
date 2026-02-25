import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



export enum CollectionHashedName {
	SET,
	MAP,
}



/**
 * Read an entry of a hashed collection (Set/Map).
 * - Read the presence of an element in a Set.
 * - Read the consequent of an antecedent in a Map.
 */
export class CollectionHashedGet extends Value {
	public constructor(
		private readonly name:       CollectionHashedName,
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
		return `(${ CollectionHashedName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
