import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	build_tuple_like,
	type Builder,
} from '../../index.js';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import {TYPE} from '../index.js';
import {languageValuesIdentical} from '../utils-private.js';
import type {Value} from './Value.js';
import {CollectionIndexed} from './CollectionIndexed.js';



/**
 * A static ordered sequence of values.
 * @final
 */
class ValueTuple<T extends Value = Value> extends CollectionIndexed<T> {
	@strictEqual
	@instanceOf(() => ValueTuple)
	@memoizeBinOp(true, true)
	public override identical(value: Value): boolean {
		return xjs.Array.is<Value>(this.items, (value as ValueTuple).items, languageValuesIdentical);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Tuple whose entries are the types of this ValueTuple’s items.
	 */
	public override toType(): TYPE.Tuple {
		return TYPE.Tuple.fromTypes(this.items.map((it) => it.toType()));
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
