import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	type Builder,
	BinVect,
} from './index.js';



/**
 * Build a thing that looks like a tuple.
 * @typeparam T -        the type of items in the tuple-like. Could be `ASTNodeExpression`s, `CPObject`s, `Type`s, etc.
 * @param items          the tuple-like, an array of items
 * @param builder        the builder to use to build the expression
 * @param build_fn       the lambda to call on each item that builds it to binaryen
 * @param item_length_fn the lambda to call on each item to determine if it is tuple-like;
 *                       returns a number (its length) if it is tuple-like, otherwise returns `null`
 */
export function build_tuple_like<T>(
	items:          readonly T[],
	builder:        Builder,
	build_fn:       (item: T) => binaryen.ExpressionRef,
	item_length_fn: (item: T) => number | null,
): binaryen.ExpressionRef {
	if (!items.length) {
		return new BinVect(builder.module, 'tuple').vect;
	}
	return builder.module.tuple.make(items.flatMap<binaryen.ExpressionRef>((item) => {
		const item_build:   binaryen.ExpressionRef = build_fn.call(null, item);
		const maybe_length: number | null          = item_length_fn.call(null, item);

		/*
		 * If item is not a tuple or is an empty tuple, return original item build.
		 * If item is tuple of length 1, return a single extract.
		 * If item length is > 1, return an array of extracts whose first entry is a `tee` and the rest are `get`s.
		 */
		if (!maybe_length) {
			return item_build;
		} else if (maybe_length === 1) {
			return builder.module.tuple.extract(item_build, 0);
		} else {
			assert.ok(maybe_length > 1, 'Tuple should be nonempty.');

			const bintype:  binaryen.Type            = binaryen.getExpressionType(item_build);
			const expanded: readonly binaryen.Type[] = binaryen.expandType(bintype);
			assert.ok(expanded.length > 1, 'Tuple should be nonempty.');

			const temp_id: bigint = builder.varCount;
			const local           = builder.addLocal(temp_id, bintype)[0].getLocalInfo(temp_id)!;
			return [
				                                   builder.module.tuple.extract(builder.module.local.tee(local.index, item_build, local.type), 0),
				...expanded.slice(1).map((_, i) => builder.module.tuple.extract(builder.module.local.get(local.index,             local.type), i + 1)),
			];
		}
	}));
}
