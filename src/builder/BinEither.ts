import binaryen from 'binaryen';



/**
 * A structure containing one of two possible values: a “left” and a “right” value.
 */
export class BinEither {
	/**
	 * Return a runtime constant indicating the active side of the given tuple.
	 * @param  mod   the module of the tuple
	 * @param  tuple the tuple to get the side of
	 * @return       `i32.const(0)` for the “left” side / `i32.const(1)` for the “right” side
	 */
	public static sideOf(mod: binaryen.Module, tuple: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return mod.tuple.extract(tuple, 0);
	}

	/**
	 * Get the “left” side of the given tuple.
	 * @param  mod   the module of the tuple
	 * @param  tuple the tuple to get the “left” side of
	 * @return       the “left” side of the tuple
	 */
	public static leftOf(mod: binaryen.Module, tuple: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return mod.tuple.extract(tuple, 1);
	}

	/**
	 * Get the “right” side of the given tuple.
	 * @param  mod   the module of the tuple
	 * @param  tuple the tuple to get the “right” side of
	 * @return       the “right” side of the tuple
	 */
	public static rightOf(mod: binaryen.Module, tuple: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return mod.tuple.extract(tuple, 2);
	}

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
	public readonly side: binaryen.ExpressionRef;

	/**
	 * Construct a new BinEither component.
	 * @param  mod   a module to create the instance in
	 * @param  index the index of the current value at runtime
	 * @param  left  the first  possible value, the “left”  side
	 * @param  right the second possible value, the “right” side
	 * @return       a Binaryen n-tuple value of `[index, left, right]`
	 */
	public constructor(
		private readonly mod:  binaryen.Module,
		index:                 bigint | binaryen.ExpressionRef,
		public readonly left:  binaryen.ExpressionRef,
		public readonly right: binaryen.ExpressionRef,
	) {
		this.side = (typeof index === 'bigint') ? mod.i32.const(Number(index)) : index;
	}

	public make(): binaryen.ExpressionRef {
		return this.mod.tuple.make([this.side, this.left, this.right]);
	}
}
