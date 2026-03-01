import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Read an entry of a tuple. */
export class TupleGet extends Value {
	public constructor(
		private readonly tuple:    Value,
		private readonly accessor: bigint,
		entry_type: TypeName,
	) {
		super(entry_type);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.TUPLE] }.GET ${ this.accessor } ${ this.tuple })`; // accessor is static so it comes first
	}
}
