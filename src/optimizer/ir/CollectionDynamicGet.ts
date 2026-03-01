import {
	TypeName,
	type Type,
} from './Type.ts';
import {Value} from './Value.ts';



/** Read an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicGet extends Value {
	public constructor(
		private readonly name:       TypeName.LIST | TypeName.DICT | TypeName.SET | TypeName.MAP,
		private readonly collection: Value,
		private readonly accessor:   Value,
		entry_type: Type,
	) {
		super(entry_type);
	}

	public override toString(): string {
		return `(${ TypeName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
