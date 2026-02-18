import binaryen from 'binaryen';
import type {
	Local,
	Builder,
} from './index.ts';



type BuildPair = readonly [binaryen.ExpressionRef, binaryen.Type];



/**
 * Build a thing that looks like a tuple.
 * @param builder the builder to use to build the expression
 * @param builds  an array of built value–type pairs
 */
export function build_tuple_like(builder: Builder, builds: readonly BuildPair[]): binaryen.ExpressionRef {
	builder.typeBuilder.grow(1);
	const idx: number = Number(builder.nextTypeIndex());
	if (!builds.length) {
		builder.typeBuilder.setStructType(idx, []);
		return builder.module.struct.new_default(builder.typeBuilder.getTempHeapType(idx));
	}
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
 * @param builder the builder to use to build the expression
 * @param builds  an array of objects containing a key and built value–type pairs
 */
export function build_record_like(builder: Builder, builds: readonly {readonly key: bigint, readonly pair: BuildPair}[]): binaryen.ExpressionRef {
	builder.typeBuilder.grow(1);
	const idx: number = Number(builder.nextTypeIndex());
	if (!builds.length) {
		builder.typeBuilder.setStructType(idx, []);
		return builder.module.struct.new_default(builder.typeBuilder.getTempHeapType(idx));
	}
	if (
		builds.length <= 1 ||
		builds.slice(0, -1).every(({key}, i) => key <= (builds[i + 1].key)) // record keys are in order
	) {
		builder.typeBuilder.setStructType(idx, builds.map(({pair: [_, bintype]}) => ({
			type:       bintype,
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			packedType: binaryen.notPacked,
			mutable:    false,
		})));
		return builder.module.struct.new(builds.map(({pair: [binval]}) => binval), builder.typeBuilder.getTempHeapType(idx));
	} else {
		const locals: Array<{
			readonly id:       bigint,
			readonly type:     binaryen.Type,
			readonly localSet: binaryen.ExpressionRef,
			readonly localGet: binaryen.ExpressionRef,
		}> = builds.map(({key: id, pair: [binval, bintype]}) => {
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
