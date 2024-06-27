import * as assert from 'assert';
import binaryen from 'binaryen';
import {TYPE} from '../typer/index.js';
import {
	type LocalInfo,
	type Builder,
	BinVect,
} from './index.js';



/**
 * Build a thing that looks like a tuple.
 * @typeparam T -  the type of items in the tuple-like. Could be `ASTNodeExpression`s, `CPObject`s, `Type`s, etc.
 * @param items    the tuple-like, an array of items
 * @param builder  the builder to use to build the expression
 * @param type_fn  the lambda to call on each item that gives its type
 * @param build_fn the lambda to call on each item that builds it to binaryen
 */
export function build_tuple_like<T>(
	items:    readonly T[],
	builder:  Builder,
	type_fn:  (item: T) => TYPE.Type,
	build_fn: (item: T) => binaryen.ExpressionRef,
): binaryen.ExpressionRef {
	if (!items.length) {
		return new BinVect(builder.module, 'tuple').vect;
	}
	return builder.module.tuple.make(items.flatMap<binaryen.ExpressionRef>((item) => {
		const item_type:  TYPE.Type              = type_fn.call(null, item);
		const item_build: binaryen.ExpressionRef = build_fn.call(null, item);

		/*
		 * If item is not a tuple or is an empty tuple, return original item build.
		 * If item is tuple of length 1, return a single extract.
		 * If item length is > 1, return an array of extracts whose first entry is a `tee` and the rest are `get`s.
		 */
		if (!(item_type instanceof TYPE.TypeTuple) || item_type.invariants.length === 0) {
			return item_build;
		} else if (item_type.invariants.length === 1) {
			return builder.module.tuple.extract(item_build, 0);
		} else {
			assert.ok(item_type.invariants.length > 1, 'Tuple should be nonempty.');

			const bintype:  binaryen.Type            = binaryen.getExpressionType(item_build);
			const expanded: readonly binaryen.Type[] = binaryen.expandType(bintype);
			assert.ok(expanded.length > 1, 'Tuple should be nonempty.');

			const temp_id: bigint    = builder.varCount;
			const local:   LocalInfo = builder.addLocal(temp_id, bintype)[0].getLocalInfo(temp_id)!;
			return [
				                                   builder.module.tuple.extract(builder.module.local.tee(local.index, item_build, local.type), 0),
				...expanded.slice(1).map((_, i) => builder.module.tuple.extract(builder.module.local.get(local.index,             local.type), i + 1)),
			];
		}
	}));
}



/**
 * Build a thing that looks like a record.
 * @typeparam T -    the type of items in the record-like. Could be `ASTNodeExpression`s, `CPObject`s, `Type`s, etc.
 * @param properties the record-like, a map of key–value pairs
 * @param builder    the builder to use to build the expression
 * @param type_fn    the lambda to call on each value that gives its type
 * @param build_fn   the lambda to call on each value that builds it to binaryen
 */
export function build_record_like<T>(
	properties: ReadonlyMap<bigint, T>,
	builder:    Builder,
	type_fn:    (value: T) => TYPE.Type,
	build_fn:   (value: T) => binaryen.ExpressionRef,
): binaryen.ExpressionRef {
	assert.ok(properties.size, 'Record should be nonempty.');

	const builds: readonly {readonly id: bigint, readonly expr: binaryen.ExpressionRef}[] = [...properties].flatMap(([id, value]) => {
		const value_build: binaryen.ExpressionRef = build_fn.call(null, value);
		const item_type:   TYPE.Type              = type_fn.call(null, value);

		/*
		 * If value is not a record, return original value build.
		 * If value is record of size 1, return a single extract.
		 * If value size is > 1, return an array of extracts whose first entry is a `tee` and the rest are `get`s.
		 */
		if (!(item_type instanceof TYPE.TypeRecord)) {
			return {id, expr: value_build};
		} else if (item_type.invariants.size === 1) {
			return {id, expr: builder.module.tuple.extract(value_build, 0)};
		} else {
			assert.ok(item_type.invariants.size > 1, 'Record should be nonempty.');

			const bintype:  binaryen.Type            = binaryen.getExpressionType(value_build);
			const expanded: readonly binaryen.Type[] = binaryen.expandType(bintype);
			assert.ok(expanded.length > 1, 'Record should be nonempty.');

			const temp_id: bigint    = builder.varCount;
			const local:   LocalInfo = builder.addLocal(temp_id, bintype)[0].getLocalInfo(temp_id)!;
			return [
				                                    {id, expr: builder.module.tuple.extract(builder.module.local.tee(local.index, value_build, local.type), 0)},
				...expanded.slice(1).map((_, i) => ({id, expr: builder.module.tuple.extract(builder.module.local.get(local.index, local.type),              i + 1)})),
			];
		}
	});

	if (properties.size === 1) {
		return builder.module.tuple.make((builds.map(({expr}) => expr)));
	} else {
		const locals: Array<{
			readonly id:        bigint,
			readonly localSet: binaryen.ExpressionRef,
			readonly localGet: binaryen.ExpressionRef,
		}> = builds.map(({id, expr}) => {
			const expr_bintype: binaryen.Type = binaryen.getExpressionType(expr);
			const set_temp_id:  bigint        = builder.varCount;
			const set_local:    LocalInfo     = builder.addLocal(set_temp_id, expr_bintype)[0].getLocalInfo(set_temp_id)!;
			return {
				id,
				localSet: builder.module.local.set(set_local.index, expr),
				localGet: builder.module.local.get(set_local.index, set_local.type),
			};
		});
		const sets: readonly binaryen.ExpressionRef[] = locals.map(({localSet}) => localSet);
		locals.sort((a, b) => Number(a.id - b.id));
		const make: binaryen.ExpressionRef = builder.module.tuple.make((locals.map(({localGet}) => localGet)));
		return builder.module.block(null, [...sets, make], binaryen.getExpressionType(make));
	}
}
