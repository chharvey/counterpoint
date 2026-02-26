import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {Value} from './Value.ts';



/** Read an entry of a tuple. */
export class TupleGet extends Value {
	public constructor(
		private readonly tuple:    Value,
		private readonly accessor: bigint,
		entry_type: TYPE.Type,
		optimizer:  Optimizer,
	) {
		super(entry_type);
		this.tuple = tuple.asTac(optimizer);
	}

	public override toString(): string {
		return `(TUPLE.GET ${ this.accessor } ${ this.tuple })`; // accessor is static so it comes first
	}
}
