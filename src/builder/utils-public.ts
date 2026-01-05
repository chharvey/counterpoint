import binaryen from 'binaryen';
import type {
	Local,
	Builder,
} from './index.ts';



/**
 * Build a thing that looks like a tuple.
 * @typeparam T -  the type of items in the tuple-like. Could be `ASTNodeExpression`s, `Value`s, `Type`s, etc.
 * @param items    the tuple-like, an array of items
 * @param builder  the builder to use to build the expression
 * @param build_fn the lambda to call on each item that builds it to binaryen
 */
export function build_tuple_like<T>(
	items:    readonly T[],
	builder:  Builder,
	build_fn: (item: T) => binaryen.ExpressionRef,
): binaryen.ExpressionRef {
	builder.typeBuilder.grow(1);
	const idx: number = Number(builder.nextTypeIndex());
	if (!items.length) {
		builder.typeBuilder.setStructType(idx, []);
		return builder.module.struct.new_default(builder.typeBuilder.getTempHeapType(idx));
	}
	const builds: readonly (readonly [binaryen.ExpressionRef, binaryen.Type])[] = items.map((item) => {
		const item_build: binaryen.ExpressionRef = build_fn.call(null, item);
		return [item_build, binaryen.getExpressionType(item_build)];
	});
	builder.typeBuilder.setStructType(idx, builds.map(([_, bintype]) => ({
		type:       bintype,
		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		// eslint-disable-next-line
		packedType: binaryen.notPacked,
		mutable:    false,
	})));
	return builder.module.struct.new(builds.map(([binval]) => binval), builder.typeBuilder.getTempHeapType(idx));
}



/**
 * Build a thing that looks like a record.
 * @typeparam T -    the type of items in the record-like. Could be `ASTNodeExpression`s, `Value`s, `Type`s, etc.
 * @param properties the record-like, a map of key–value pairs
 * @param builder    the builder to use to build the expression
 * @param build_fn   the lambda to call on each value that builds it to binaryen
 */
export function build_record_like<T>(
	properties: ReadonlyMap<bigint, T>,
	builder:    Builder,
	build_fn:   (value: T) => binaryen.ExpressionRef,
): binaryen.ExpressionRef {
	builder.typeBuilder.grow(1);
	const idx: number = Number(builder.nextTypeIndex());
	if (!properties.size) {
		builder.typeBuilder.setStructType(idx, []);
		return builder.module.struct.new_default(builder.typeBuilder.getTempHeapType(idx));
	}
	const builds: ReadonlyMap<bigint, readonly [binaryen.ExpressionRef, binaryen.Type]> = new Map([...properties.entries()].map(([key, item]) => {
		const item_build: binaryen.ExpressionRef = build_fn.call(null, item);
		return [key, [item_build, binaryen.getExpressionType(item_build)]];
	}));
	if (
		properties.size <= 1 ||
		[...builds.keys()].every((key, i, src) => key <= (src[i + 1] ?? Infinity)) // record keys are in order
	) {
		builder.typeBuilder.setStructType(idx, [...builds.values()].map(([_, bintype]) => ({
			type:       bintype,
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			packedType: binaryen.notPacked,
			mutable:    false,
		})));
		return builder.module.struct.new([...builds.values()].map(([binval]) => binval), builder.typeBuilder.getTempHeapType(idx));
	} else {
		const locals: Array<{
			readonly id:       bigint,
			readonly type:     binaryen.Type,
			readonly localSet: binaryen.ExpressionRef,
			readonly localGet: binaryen.ExpressionRef,
		}> = [...builds.entries()].map(([id, [binval, bintype]]) => {
			const set_local: Local = builder.addLocal(binval)[1];
			return {
				id,
				type:     bintype,
				localSet: set_local.set(),
				localGet: set_local.get(),
			};
		});
		// create the `(set)`s before sorting
		const sets: readonly binaryen.ExpressionRef[] = locals.map(({localSet}) => localSet);
		locals.sort((a, b) => Number(a.id - b.id));
		// after sorting, create the struct type; its items are the `(get)`s
		builder.typeBuilder.setStructType(idx, locals.map(({type}) => ({
			type,
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			packedType: binaryen.notPacked,
			mutable:    false,
		})));
		return builder.module.block(null, [
			...sets,
			builder.module.struct.new(locals.map(({localGet}) => localGet), builder.typeBuilder.getTempHeapType(idx)),
		], builder.typeBuilder.getTempHeapType(idx));
	}
}
