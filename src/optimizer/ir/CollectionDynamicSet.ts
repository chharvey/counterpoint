import type {CollectionDynamicName} from './utils-public.ts';
import {TypeName} from './TypeName.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Write to an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicSet extends Instruction {
	public constructor(
		private readonly name:       CollectionDynamicName,
		private readonly collection: Value,
		private readonly accessor:   Value,
		private readonly value:      Value,
	) {
		super();
	}

	public override toString(): string {
		return `(${ TypeName[this.name] }.SET ${ this.collection } ${ this.accessor } ${ this.value })`;
	}
}
