import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
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
		this.collection = collection.asTac(optimizer);
		this.accessor   = accessor  .asTac(optimizer);
	}

	public override toString(): string {
		return `(${ CollectionHashedName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
