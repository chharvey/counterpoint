import binaryen from 'binaryen';
import {
	type Local,
	type Builder,
	BinVect,
} from './index.ts';



type BuildPair = readonly [binaryen.ExpressionRef, binaryen.Type];



/**
 * Convert a BigInt (signed 64-bit) to Binaryen `i64.const`.
 * @param    mod   a Binaryen module instance
 * @param    value a BigInt in the range [-2^63, 2^63 - 1] (if signed) or [0, 2^64 - 1] (if unsigned)
 * @param    u     Interpret as unsigned?
 * @returns        an `i64.const(low, high)` expression
 */
export function bigint_to_i64(mod: binaryen.Module, value: bigint, u: boolean = false): binaryen.ExpressionRef {
	// signed integer bounds
	let MIN_I64 = -(1n << 63n);     // more performant than `-(2n ** 63n)`
	let MAX_I64 = (1n << 63n) - 1n; // more performant than `(2n ** 63n) - 1n`
	if (u) {
		// unsigned integer bounds
		MIN_I64 = 0n;
		MAX_I64 = (1n << 64n) - 1n; // more performant than `(2n ** 64n) - 1n`
	}
	if (value < MIN_I64 || value > MAX_I64) {
		throw new RangeError(`bigint value ${ value } is out of ${ u ? 'un' : '' }signed 64-bit range.`);
	}

	const MASK32 = 0xffff_ffffn;
	const low:  number = Number(value & MASK32);
	const high: number = Number((value >> 32n) & MASK32);

	return mod.i64.const(low, high);
}



/**
 * Return a block containing `(drop)` expressions for each of `args`, followed by a final expression.
 * If `final` is provided as an ExpressionRef, it is the final expression;
 * otherwise, a BinVect of boolean value is the final expression.
 * @param mod   the module to create the block
 * @param args  the args to drop first
 * @param final the final expression/statement
 */
export function drop_then(
	mod:   binaryen.Module,
	args:  readonly binaryen.ExpressionRef[],
	final: binaryen.ExpressionRef | boolean,
): binaryen.ExpressionRef {
	const last_item: binaryen.ExpressionRef = typeof final === 'number' ? final : new BinVect(mod, final).vect;
	return mod.block(null, [...args.map((arg) => mod.drop(arg)), last_item], binaryen.getExpressionType(last_item));
}



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
			const set_local: Local = builder.addLocal(binval);
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
