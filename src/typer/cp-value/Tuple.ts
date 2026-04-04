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
import {CollectionIndexed} from './CollectionIndexed.ts';



/**
 * A static ordered sequence of values.
 * @final
 */
class ValueTuple<T extends Value = Value> extends CollectionIndexed<T> {
	public override toString(): string {
		return `(${ super.toString() }${ this.items.length === 1 ? ',' : '' })`;
	}

	@strictEqual
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueTuple)
	public override identical(value: Value): boolean {
		return CollectionIndexed.samenessDfn<T>(this, value as ValueTuple<T>, language_values_identical);
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueTuple)
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
}
export {ValueTuple as Tuple};
