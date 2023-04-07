import * as assert from 'assert';
import binaryen from 'binaryen';



/**
 * A structure containing one of two possible values: a “left” and a “right” value.
 */
export class BinEither {
	/**
	 * Create a structure containing one of many possible types.
	 * @param  left  the first  possible type, the “left”  side
	 * @param  right the second possible type, the “right” side
	 * @return       a Binaryen n-tuple type of `[i32, left, right]`
	 */
	public static createType(left: binaryen.Type, right: binaryen.Type): binaryen.Type {
		return binaryen.createType([binaryen.i32, left, right]);
		//                          ^ index of current type
	}


	/**
	 * A runtime constant indicating the active side.
	 * The value is `i32.const(0)` for the “left” side / `i32.const(1)` for the “right” side.
	 */
	public readonly side!: binaryen.ExpressionRef;
	/** The “left” side. */
	public readonly left!: binaryen.ExpressionRef;
	/** The “right” side. */
	public readonly right!: binaryen.ExpressionRef;

	/**
	 * Construct a new BinEither object given a Binaryen tuple value.
	 * @param  mod   a module to create the instance in
	 * @param  tuple a Binaryen tuple of type `[i32, ‹left›, ‹right›]`
	 */
	public constructor(mod: binaryen.Module, tuple: binaryen.ExpressionRef);
	/**
	 * Construct a new BinEither object given its constituent components.
	 * @param  mod   a module to create the instance in
	 * @param  index the index of the current value at runtime
	 * @param  left  the first  possible value, the “left”  side
	 * @param  right the second possible value, the “right” side
	 * @return       a Binaryen n-tuple value of `[index, left, right]`
	 */
	public constructor(
		mod:   binaryen.Module,
		index: bigint | binaryen.ExpressionRef,
		left:  binaryen.ExpressionRef,
		right: binaryen.ExpressionRef,
	);
	public constructor(
		private readonly mod: binaryen.Module,
		side_or_tuple:        bigint | binaryen.ExpressionRef,
		left?:                binaryen.ExpressionRef,
		right?:               binaryen.ExpressionRef,
	) {
		if (left === undefined && right === undefined) {
			// overload: `constructor(mod: binaryen.Module, tuple: binaryen.ExpressionRef)`
			assert.ok(typeof side_or_tuple === 'number'); // better type guard than `assert.strictEqual`
			return new BinEither( // HACK: `this()`
				mod,
				mod.tuple.extract(side_or_tuple, 0),
				mod.tuple.extract(side_or_tuple, 1),
				mod.tuple.extract(side_or_tuple, 2),
			);
		} else {
			// overload: `constructor(mod: binaryen.Module, index: bigint | binaryen.ExpressionRef, left: binaryen.ExpressionRef, right: binaryen.ExpressionRef)`
			assert.ok(typeof left  === 'number'); // better type guard than `assert.strictEqual`
			assert.ok(typeof right === 'number'); // better type guard than `assert.strictEqual`
			this.side  = (typeof side_or_tuple === 'bigint') ? mod.i32.const(Number(side_or_tuple)) : side_or_tuple;
			this.left  = left;
			this.right = right;
		}
	}

	public make(): binaryen.ExpressionRef {
		return this.mod.tuple.make([this.side, this.left, this.right]);
	}
}
