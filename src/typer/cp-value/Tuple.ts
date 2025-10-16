import type binaryen from 'binaryen';
import {TYPE} from '../index.ts';
import {
	build_tuple_like,
	type Builder,
} from '../../index.ts';
import {
	languageValuesIdentical,
	language_values_equal,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import {CollectionIndexed} from './CollectionIndexed.ts';



/**
 * A static ordered sequence of values.
 * @final
 */
class ValueTuple<T extends Value = Value> extends CollectionIndexed<T> {
	@strictEqual
	@instanceOf(() => ValueTuple)
	@memoizeBinOp(true, true)
	public override identical(value: Value): boolean {
		return CollectionIndexed.samenessDfn<T>(this, value as ValueTuple<T>, languageValuesIdentical);
	}

	@strictEqual
	@identical
	@instanceOf(() => ValueTuple)
	@memoizeBinOp(true, true)
	public override equal(value: Value): boolean {
		return CollectionIndexed.samenessDfn<T>(this, value as ValueTuple<T>, language_values_equal);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Tuple whose entries are the types of this ValueTuple’s items.
	 */
	public override toType(): TYPE.Tuple {
		return TYPE.Tuple.fromTypes(this.items.map<TYPE.Type>((it) => it.toType()));
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return build_tuple_like<T>(
			this.items,
			builder,
			(value) => value.toType(),
			(value) => value.build(builder),
		);
	}
}
export {ValueTuple as Tuple};
