import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Read an entry of a tuple. */
export class TupleGet extends Value {
	public constructor(
		private readonly tuple:    Value,
		private readonly accessor: bigint,
		entry_type: TYPE.Type,
	) {
		super(entry_type);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.TUPLE] }.GET ${ this.accessor } ${ this.tuple })`; // accessor is static so it comes first
	}

	@runOnceMethod
	public override validate(): void {
		this.tuple.validate();
		return assert_instanceof(this.tuple.type, TYPE.Tuple);
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
