import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {TYPE} from '../typer/index.ts';
import {
	type Local,
	type Builder,
	BinVect,
} from './index.ts';



/**
 * Build a thing that looks like a tuple.
 * @typeparam T -  the type of items in the tuple-like. Could be `ASTNodeExpression`s, `Value`s, `Type`s, etc.
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
	/*
	 * Due to limitations of the runtime system, empty tuples cannot be compiled in the same manner as nonempty tuples,
	 * so we use a dummy address of \x0000_0000 instead.
	 */
	if (!items.length) {
		return new BinVect(builder.module, [0n]).vect;
	}

	/**
	 * If item is neither a tuple nor a record or is an empty tuple, return the original item build.
	 * FIXME: If item is a record, throw an error.
	 * If item is tuple of length 1, return a single extract.
	 * If item length is > 1, return an array of extracts whose first entry is a `tee` and the rest are `get`s.
	 */
	const builds: readonly binaryen.ExpressionRef[] = items.flatMap<binaryen.ExpressionRef>((item) => {
		const item_type:  TYPE.Type              = type_fn.call(null, item);
		const item_build: binaryen.ExpressionRef = build_fn.call(null, item);

		if (
			!(item_type instanceof TYPE.Tuple) && !(item_type instanceof TYPE.Record) ||
			item_type instanceof TYPE.Tuple && item_type.invariants.length === 0
		) {
			return item_build;
		} else if (item_type instanceof TYPE.Record) {
			throw new Error('Records within tuples not yet supported.');
		} else if (item_type.invariants.length === 1) {
			return builder.module.tuple.extract(item_build, 0);
		} else {
			assert.ok(item_type.invariants.length > 1, 'Tuple should be nonempty.');

			const bintype:  binaryen.Type            = binaryen.getExpressionType(item_build);
			const expanded: readonly binaryen.Type[] = binaryen.expandType(bintype);
			assert.ok(expanded.length > 1, 'Tuple should be nonempty.');

			const expr_info = binaryen.getExpressionInfo(item_build);
			if (expr_info.id === binaryen.ExpressionIds.LocalGet) {
				return expanded.map((_, i) => builder.module.tuple.extract(item_build, i));
			}

			const local: Local = builder.addLocal(item_build)[1];
			return [
				                                   builder.module.tuple.extract(local.tee(), 0), // eslint-disable-line @stylistic/indent
				...expanded.slice(1).map((_, i) => builder.module.tuple.extract(local.get(), i + 1)),
			];
		}
	});

	// Binaryen does not allow `module.tuple.make` to be called with only 1 argument,
	// so if there is only 1 item then we add an additional unused item.
	return builder.module.tuple.make((builds.length === 1
		? [builds[0], new BinVect(builder.module).vect]
		: [...builds]
	));
}



/**
 * Build a thing that looks like a record.
 * @typeparam T -    the type of items in the record-like. Could be `ASTNodeExpression`s, `Value`s, `Type`s, etc.
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

	/**
	 * If value is neither a tuple nor a record or is an empty tuple, return the original value build.
	 * FIXME: If value is a nonempty tuple, throw an error.
	 * If value is record of size 1, return a single extract.
	 * If value size is > 1, return an array of extracts whose first entry is a `tee` and the rest are `get`s.
	 */
	const builds: readonly {readonly id: bigint, readonly expr: binaryen.ExpressionRef}[] = [...properties].flatMap(([id, value]) => {
		const value_type:  TYPE.Type              = type_fn.call(null, value);
		const value_build: binaryen.ExpressionRef = build_fn.call(null, value);

		if (
			!(value_type instanceof TYPE.Tuple) && !(value_type instanceof TYPE.Record) ||
			value_type instanceof TYPE.Tuple && value_type.invariants.length === 0
		) {
			return {id, expr: value_build};
		} else if (value_type instanceof TYPE.Tuple) {
			throw new Error('Tuples within records not yet supported.');
		} else if (value_type.invariants.size === 1) {
			return {id, expr: builder.module.tuple.extract(value_build, 0)};
		} else {
			assert.ok(value_type.invariants.size > 1, 'Record should be nonempty.');

			const bintype:  binaryen.Type            = binaryen.getExpressionType(value_build);
			const expanded: readonly binaryen.Type[] = binaryen.expandType(bintype);
			assert.ok(expanded.length > 1, 'Record should be nonempty.');

			const expr_info = binaryen.getExpressionInfo(value_build);
			if (expr_info.id === binaryen.ExpressionIds.LocalGet) {
				return expanded.map((_, i) => ({id, expr: builder.module.tuple.extract(value_build, i)}));
			}

			const local: Local = builder.addLocal(value_build)[1];
			return [
				                                    {id, expr: builder.module.tuple.extract(local.tee(), 0)}, // eslint-disable-line @stylistic/indent
				...expanded.slice(1).map((_, i) => ({id, expr: builder.module.tuple.extract(local.get(), i + 1)})),
			];
		}
	});

	if (
		properties.size === 1 ||
		builds.every(({id}, i) => id <= (builds[i + 1]?.id ?? Infinity)) // record keys are in order
	) {
		// Binaryen does not allow `module.tuple.make` to be called with only 1 argument,
		// so if there is only 1 item then we add an additional unused item.
		return builder.module.tuple.make((builds.length === 1
			? [builds[0].expr, new BinVect(builder.module).vect]
			: builds.map(({expr}) => expr)
		));
	}

	assert.ok(builds.length > 1, 'there are multiple built expressions.');
	const locals: Array<{
		readonly id:       bigint,
		readonly localSet: binaryen.ExpressionRef,
		readonly localGet: binaryen.ExpressionRef,
	}> = builds.map(({id, expr}) => {
		const set_local: Local = builder.addLocal(expr)[1];
		return {
			id,
			localSet: set_local.set(),
			localGet: set_local.get(),
		};
	});
	const sets: readonly binaryen.ExpressionRef[] = locals.map(({localSet}) => localSet);
	locals.sort((a, b) => Number(a.id - b.id));
	const make: binaryen.ExpressionRef = builder.module.tuple.make(locals.map(({localGet}) => localGet));
	return builder.module.block(null, [...sets, make], binaryen.getExpressionType(make));
}
