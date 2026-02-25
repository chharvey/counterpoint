import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



/** Read an entry of a tuple. */
export class TupleGet extends Value {
	public constructor(
		private readonly collection: Value,
		private readonly accessor:   bigint,
		entry_type: TYPE.Type,
		optimizer:  Optimizer,
	) {
		super(entry_type);
		this.collection = as_unit(optimizer, collection);
	}

	public override toString(): string {
		return `(TUPLE.GET ${ this.accessor.toString() } ${ this.collection })`; // accessor is static so it comes first
	}
}
