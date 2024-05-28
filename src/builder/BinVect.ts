import * as assert from 'assert';
import binaryen from 'binaryen';



/**
 * A Binaryen vector (`v128`) representing either:
 * - one of four possible types: an `i32`, `i64`, `f32`, or `f64`, or
 * - an address in the heap, defined by two or four `i16`.
 *
 * As option A, this implements the Counterpoint union type `int | float`, as a value on the stack.
 * As option B, this implements a Counterpoint reference type, as a pointer to an object in the heap.
 *
 * The 128-bit vector has 8 lanes (indexed 0–7), 16 bits each.
 * - Lanes 0–1 are always zero (reserved for future use).
 * - Lane 2 is always an `i16` with a value of either `0` or `1`,
 *   indicating the vector’s representation:
 * 	- **`0`:** The vector represents a value on the stack.
 * 	- **`1`:** The vector represents a pointer to an object in the heap.
 *
 * As a stack value:
 * - Lane 2 is always an `i16` with a value of `0`.
 * - Lane 3 is always an `i16` with a value of either `0`, `1`, `2`, or `3`,
 *   indicating how to interpret the next four lanes:
 *   - **`0`:** Lanes 4–5 are ignored, and Lanes 6–7 together form an `i32` representing a Counterpoint `int` value.
 *   - **`1`:** Lanes 4–7 together form an `i64`. This option is reserved but not currently used.
 *   - **`2`:** Lanes 4–5 are ignored, and Lanes 6–7 together form an `f32`. This option is reserved but not currently used.
 *   - **`3`:** Lanes 4–7 together form an `f64` representing a Counterpoint `float` value.
 *
 * As a heap pointer:
 * - Lane 2 is always an `i16` with a value of `1`.
 * - Lane 3 is always an `i16` with a value of either `0` or `1`,
 *   indicating how to interpret the next four lanes:
 *   - **`0`:** Lanes 4–5, corresponding to two `i16` components, are the first 2 components of the address. Lanes 6–7 are ignored.
 *   - **`1`:** Lanes 4–7, corresponding to four `i16` components, are all 4 components of the address.
 */
export class BinVect {
	/** Internal implementation of the v128. */
	readonly #internal: binaryen.ExpressionRef;

	/**
	 * Construct a new BinVect object given a value.
	 * @param  mod a module to create the instance in
	 * @param  arg either a hard-coded value tagged with `'int'` or `'float'`,
	 *             or a Binaryen expression tagged with `'int_float'` representing an already-made v128,
	 *             or a Binaryen expression to make into a v128,
	 *             or a two-valued or four-valued address
	 */
	public constructor(
		private readonly mod: binaryen.Module,
		arg: (
			| {int: bigint} | {float: number}
			| {int_float: number}
			| binaryen.ExpressionRef
			| [bigint, bigint]                 | [binaryen.ExpressionRef, binaryen.ExpressionRef]
			| [bigint, bigint, bigint, bigint] | [binaryen.ExpressionRef, binaryen.ExpressionRef, binaryen.ExpressionRef, binaryen.ExpressionRef]
		) = {int: 0n},
	) {
		this.#internal = this.mod.v128.const(new Uint8Array(16)); // HACK: TypeScript bug where native-private fields are not emitted in constructor when `useDefineForClassFields` compiler option is off
		if (typeof arg === 'object' && 'int' in arg) {
			// the arg represents a hard-coded int
			return new BinVect(mod, {float: Number(arg.int)}); // HACK: `this()`
		} else if (typeof arg === 'object' && 'float' in arg) {
			// the arg represents a hard-coded float
			return new BinVect(mod, mod.i32.const(arg.float)); // HACK: `this()`
		} else if (typeof arg === 'object' && 'int_float' in arg) {
			// the arg represents a hard-coded v128
			this.#internal = arg.int_float;
		} else if (typeof arg === 'number') {
			// the arg represents a dynamic Binaryen expression
			/*
			 * Set Lane 2 to `0`.
			 * If the arg represents an `int`, set Lane 3 to `0` and set Lane 6–7 (joined) to its `i32` value;
			 * else, if the arg represents a `float`, set Lane 3 to `3` and set Lanes 4–7 (joined) to its `f64` value.
			 */
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 2, this.mod.i32.const(0));
			switch (binaryen.getExpressionType(arg)) {
				case binaryen.i32: {
					this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0));
					this.#internal = this.mod.i32x4.replace_lane(this.#internal, 3, arg);
					break;
				}
				case binaryen.f64: {
					this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(3));
					this.#internal = this.mod.f64x2.replace_lane(this.#internal, 1, arg);
					break;
				}
				default: {
					assert.fail('Expected either i32 or f64.');
				}
			}
		} else if (typeof arg[0] === 'bigint') {
			// the arg represents a hard-coded 2- or 4-length address
			arg.forEach((bi) => assert.ok(0 <= bi && bi < 2n ** 16n, `Expected ${ bi } to be between 0 and ${ 2 ** 16 - 1 }`));
			return new BinVect(mod, arg.map((bi) => mod.i32.const(Number(bi))) as (
				[binaryen.ExpressionRef, binaryen.ExpressionRef] | [binaryen.ExpressionRef, binaryen.ExpressionRef, binaryen.ExpressionRef, binaryen.ExpressionRef]
			)); // HACK: `this()`
		} else {
			// the arg represents a dynamic 2- or 4-length address
			/*
			 * Set Lane 2 to `1`.
			 * If the arg represents a 2-length address, set Lane 3 to `0`,
			 * and set Lanes 4 and 5 to the respective `i16` values;
			 * else, if the arg represents a 4-length address, Lane 3 to `1`,
			 * and set Lanes 4 thru 7 to the respective `i16` values.
			 */
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 2, this.mod.i32.const(1));
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 4, arg[0]);
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 5, arg[1] as binaryen.ExpressionRef);
			if (arg.length === 2) {
				this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0));
			} else {
				assert.strictEqual(arg.length, 4);
				this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(1));
				this.#internal = this.mod.i16x8.replace_lane(this.#internal, 6, arg[2] as binaryen.ExpressionRef);
				this.#internal = this.mod.i16x8.replace_lane(this.#internal, 7, arg[3] as binaryen.ExpressionRef);
			}
		}
	}

	/** The `v128` implementation. */
	public get vect(): binaryen.ExpressionRef {
		return this.#internal;
	}

	/** Whether Lanes 2–3 together are `0`. */
	public get isInt(): binaryen.ExpressionRef {
		return this.mod.i32.eqz(this.mod.i32x4.extract_lane(this.#internal, 1));
	}

	/** Whether Lanes 2–3 together are `3`. */
	public get isFloat(): binaryen.ExpressionRef {
		return this.mod.i32.eq(this.mod.i32x4.extract_lane(this.#internal, 1), this.mod.i32.const(3));
	}

	/** Whether Lane 2 is `1`. */
	public get isAddr(): binaryen.ExpressionRef {
		return this.mod.i32.eq(this.mod.i16x8.extract_lane_u(this.#internal, 2), this.mod.i32.const(1));
	}

	/** The value as interpreted as an int. */
	public get intValue(): binaryen.ExpressionRef {
		return this.mod.i32x4.extract_lane(this.#internal, 3);
	}

	/** The value as interpreted as a float. */
	public get floatValue(): binaryen.ExpressionRef {
		return this.mod.f64x2.extract_lane(this.#internal, 1);
	}
}
