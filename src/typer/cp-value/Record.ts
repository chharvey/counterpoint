import type binaryen from 'binaryen';
import {
	build_record_like,
	type Builder,
} from '../../index.ts';
import {TYPE} from '../index.ts';
import {
	language_values_identical,
	language_values_equal,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import {CollectionKeyed} from './CollectionKeyed.ts';



/**
 * A static structure of key–value pairs.
 * @final
 */
class ValueRecord<T extends Value = Value> extends CollectionKeyed<T> {
	@strictEqual
	@instanceOf(() => ValueRecord)
	@memoizeBinOp(true, true)
	public override identical(value: Value): boolean {
		return CollectionKeyed.samenessDfn<T>(this, value as ValueRecord<T>, language_values_identical);
	}

	@strictEqual
	@identical
	@instanceOf(() => ValueRecord)
	@memoizeBinOp(true, true)
	public override equal(value: Value): boolean {
		return CollectionKeyed.samenessDfn<T>(this, value as ValueRecord<T>, language_values_equal);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Record whose entries are the types of this ValueRecord’s values.
	 */
	public override toType(): TYPE.Record {
		return TYPE.Record.fromTypes(new Map([...this.properties].map<[bigint, TYPE.Type]>(([key, val]) => [key, val.toType()])));
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return build_record_like<T>(
			this.properties,
			builder,
			(value) => value.toType(),
			(value) => value.build(builder),
		);
	}
}
export {ValueRecord as Record};
