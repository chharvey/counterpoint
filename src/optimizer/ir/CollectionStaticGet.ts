import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



export enum CollectionStaticName {
	TUPLE,
	RECORD,
}



/** Read an entry of a static collection (tuple/record). */
export class CollectionStaticGet extends Value {
	public constructor(
		private readonly name:       CollectionStaticName,
		private readonly collection: Value,
		private readonly accessor:   bigint,
		entry_type: TYPE.Type,
		optimizer:  Optimizer,
	) {
		super(entry_type);
		this.collection = as_unit(optimizer, collection);
	}

	public override toString(): string {
		const index_or_keyid: string = this.name === CollectionStaticName.TUPLE ? this.accessor.toString() : `#x${ this.accessor.toString(16) }`;
		return `(${ CollectionStaticName[this.name] }.GET ${ index_or_keyid } ${ this.collection })`; // acessor is static so it comes first
	}
}
