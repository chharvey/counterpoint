import binaryen from 'binaryen';
import type {NonemptyArray} from '../lib/index.js';



/**
 * A structure containing one of many possible values.
 *
 * The values are represented as leaves in a binary tree that is “perfect”
 * (i.e., all leaves are at the same depth level).
 * What this means is that the number of leaves is always a power of 2,
 * and each leaf can be accessed by traversing the tree.
 *
 * For example, a variable could be one of the following values: *1, 2.0, 3.3, 4.4*.
 * This data structure would be represented as a Binaryen tuple type with `n+2` entries,
 * where `n` is the number of possible values, preceeded by 2 entires:
 * the first of which indicates the “length”, or number of leaves, (in this case, 4), and
 * the second of which indicates the “selection”, the index of the current actual value at runtime.
 * If the current value is, say, *2.0* (with index 1), then this would be represented by the Binaryen tuple
 * `[4, 1, 1, 2.0, 3.3, 4.4]`.
 */
export class BinEither {
	public static lengthOf(mod: binaryen.Module, tuple: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return mod.tuple.extract(tuple, 0);
	}

	public static indexOf(mod: binaryen.Module, tuple: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return mod.tuple.extract(tuple, 1);
	}

	public static valueOf(mod: binaryen.Module, tuple: binaryen.ExpressionRef, index: bigint): binaryen.ExpressionRef {
		return mod.tuple.extract(tuple, Number(index + 2n));
	}

	/**
	 * Create a structure containing one of many possible types.
	 * @param  types        the binaryen types
	 * @return              a Binaryen n-tuple type of `[i32, i32, ...types]`
	 * @throws {RangeError} if the given array does not have a length of a power of 2
	 */
	public static createType(types: Readonly<NonemptyArray<binaryen.Type>>): binaryen.Type {
		if (Math.log2(types.length) % 1 !== 0) {
			throw new RangeError('The given array does not have a length of a power of 2.');
		}
		return binaryen.createType([binaryen.i32, binaryen.i32, ...types]);
		//                          ^             ^             ^ possible types
		//                          ^             ^ index of current type
		//                          ^ length of `types`
	}


	public readonly length: binaryen.ExpressionRef = this.mod.i32.const(this.values.length);
	public readonly index:  binaryen.ExpressionRef;

	/**
	 * Construct a new BinEither component.
	 * @param  mod          a module to create the instance in
	 * @param  index        the index of the current value at runtime
	 * @param  values       the possible values
	 * @return              a Binaryen n-tuple value of `[values.length, index, ...values]`
	 * @throws {RangeError} if the given array does not have a length of a power of 2
	 */
	public constructor(
		private readonly mod:    binaryen.Module,
		index:                   bigint | binaryen.ExpressionRef,
		private readonly values: Readonly<NonemptyArray<binaryen.ExpressionRef>>,
	) {
		if (Math.log2(values.length) % 1 !== 0) {
			throw new RangeError('The given array does not have a length of a power of 2.');
		}
		this.index = (typeof index === 'bigint') ? mod.i32.const(Number(index)) : index;
	}

	public make(): binaryen.ExpressionRef {
		return this.mod.tuple.make([this.length, this.index, ...this.values]);
	}

	public value(index: bigint): binaryen.ExpressionRef {
		return this.values[Number(index)];
	}
}
