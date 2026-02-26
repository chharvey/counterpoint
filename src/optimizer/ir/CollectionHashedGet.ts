import type {TYPE} from '../../typer/index.ts';
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
	) {
		super(entry_type);
	}

	public override toString(): string {
		return `(${ CollectionHashedName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
