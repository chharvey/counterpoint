import * as xjs from 'extrajs';
import {TYPE} from '../index.js';
import {
	languageValuesIdentical,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.js';
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
}
export {ValueTuple as Tuple};
