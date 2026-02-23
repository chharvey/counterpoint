import binaryen from 'binaryen';
import {
	type IR,
	build_tuple_like,
	type Builder,
} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
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
	@instanceOf(() => ValueTuple)
	@memoizeBinOp(true, true)
	public override identical(value: Value): boolean {
		return CollectionIndexed.samenessDfn<T>(this, value as ValueTuple<T>, language_values_identical);
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

	@memoizeMethod
	public override lower(): IR.Value {
		throw new Error('`ValueTuple#lower` not yet supported.');
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return build_tuple_like(builder, this.items.map((item) => {
			const item_build: binaryen.ExpressionRef = item.build(builder);
			return [item_build, binaryen.getExpressionType(item_build)];
		}));
	}
}
export {ValueTuple as Tuple};
