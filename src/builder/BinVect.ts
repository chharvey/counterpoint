import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {bigint_to_i64} from './utils-public.ts';



/**
 * A Binaryen vector (`v128`) representing one of the following:
 * - one of three primitive special constants, the Counterpoint values `null`, `false`, or `true`, as a value on the stack
 * - a numeric value of Counterpoint type `int` or `float`, as a value on the stack
 * - an address of a Counterpoint reference type, as a pointer to an object in the heap
 * - an empty Tuple value
 *
 * # Layout
 * The 128-bit vector has 8 lanes (indexed 0–7), 16 bits each.
 * - Lanes 0–2 are always zero (reserved for future use).
 * - Lane 3, the **header lane**, indicates the vector’s representation.
 * - Lanes 4–7, the **data lanes** hold the vector’s data.
 *
 * # Header Lane
 * Lane 3 must be one of the following values:
 *
 * Value    | Description
 * -------- | -----------
 * `\x0000` | The vector is in its default state, having no value.
 * `\x0001` | The vector represents the `null`  primitive constant.
 * `\x0002` | The vector represents the `false` primitive constant.
 * `\x0003` | The vector represents the `true`  primitive constant.
 * `\x0012` | The vector holds an `i16` value.
 * `\x0014` | The vector holds an `i32` value.
 * `\x0018` | The vector holds an `i64` value.
 * `\x0022` | The vector holds an `f16` value.
 * `\x0024` | The vector holds an `f32` value.
 * `\x0028` | The vector holds an `f64` value.
 * `\x0038` | The vector holds an address (represented by an `i64`).
 * `\x0060` | The vector represents an empty Tuple object.
 *
 * # Value Types
 * ## Special Constants
 * When the Header is `\x0000`–`\x0003`, it represents a special constant (or lack thereof).
 * The represented constant is indicated by the Header’s value, as described above.
 * For no value (header `\x0000`), behavior is undefined.
 * Lanes 4–7 are ignored.
 *
 * ## Integer Values
 * When the Header is `\x0012`, `\x0014`, or `\x0018`, it represents an `i16`, `i32`, or `i64` value respectively.
 * The value may be interpreted as signed or unsigned.
 * Currently, only `i64` values are used.
 * Lanes 4–7 together form the `i64` representing a Counterpoint `int` value.
 * Header values of `\x0012` and `\x0014` reserved for future use. Data is always right-aligned.
 *
 * ## Float Values
 * When the Header is `\x0022`, `\x0024`, or `\x0028`, it represents an `f16`, `f32`, or `f64` value respectively.
 * Currently, only `f64` values are used.
 * Lanes 4–7 together form the `f64` representing a Counterpoint `float` value.
 * Header values of `\x0022` and `\x0024` reserved for future use. Data is always right-aligned.
 *
 * ## Address Values
 * When the Header is `\x0038`, it represents an address of an object in the heap, indexed by an `i64`, held in Lanes 4–7.
 *
 * ## The Empty Tuple Value
 * The Header value `\x0060` represents an empty Counterpoint Tuple object.
 * (Due to limitations of the runtime system, empty tuples cannot be compiled in the same manner as nonempty tuples.)
 *
 * The following diagram may prove useful:
 * ```
 *                     Lane 0 Lane 1 Lane 2 Lane 3 | Lane 4 Lane 5 Lane 6 Lane 7
 *                       ----   ----   ----   ---- |   ----   ----   ----   ----
 * No value (default): \x0000 \x0000 \x0000 \x0000 | \x0000 \x0000 \x0000 \x0000
 * null:               \x0000 \x0000 \x0000 \x0001 | \x0000 \x0000 \x0000 \x0000
 * false:              \x0000 \x0000 \x0000 \x0002 | \x0000 \x0000 \x0000 \x0000
 * true:               \x0000 \x0000 \x0000 \x0003 | \x0000 \x0000 \x0000 \x0000
 * i16:                \x0000 \x0000 \x0000 \x0012 | \x0000 \x0000 \x0000 \x????
 * i32:                \x0000 \x0000 \x0000 \x0014 | \x0000 \x0000 \x???? \x????
 * i64:                \x0000 \x0000 \x0000 \x0018 | \x???? \x???? \x???? \x????
 * f16:                \x0000 \x0000 \x0000 \x0022 | \x0000 \x0000 \x0000 \x????
 * f32:                \x0000 \x0000 \x0000 \x0024 | \x0000 \x0000 \x???? \x????
 * f64:                \x0000 \x0000 \x0000 \x0028 | \x???? \x???? \x???? \x????
 * address:            \x0000 \x0000 \x0000 \x0038 | \x???? \x???? \x???? \x????
 * empty tuple:        \x0000 \x0000 \x0000 \x0060 | \x0000 \x0000 \x0000 \x0000
 * ```
 */
export class BinVect {
	/**
	 * Re-interprets an `i32` as a `v128` storing a boolean value.
	 *
	 * Returns a Binaryen `if` expression with the given condition and
	 * branches containing `v128`s having Lane 3 of `\x0003` and `\x0002` respectively.
	 * @param mod       a module to create the instance in
	 * @param condition an `i32` that serves as the condition for the `if` expression
	 * @return          the `if` expression
	 */
	public static asBool(mod: binaryen.Module, condition: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return mod.if(
			condition,
			new BinVect(mod, true).vect,
			new BinVect(mod, false).vect,
		);
	}


	/** Internal implementation of the v128. */
	readonly #internal: binaryen.ExpressionRef;

	/** The Header Lane’s value, indicating the type of data stored. */
	readonly #type!: binaryen.ExpressionRef;

	/**
	 * Construct a new BinVect object given a value.
	 * @param  mod a module to create the instance in
	 * @param  arg one of the following:
	 *             - the native value `null`, `false`, or `true` (corresponding to its representation)
	 *             - a Binaryen `i64`, `f64`, or `v128` value to use in a `v128`
	 *             - an address, either hard-coded (native bigint) or dynamic (of type `i64`)
	 *             - the native string value `'tuple'`, indicating empty Counterpoint Tuple object
	 */
	public constructor(
		private readonly mod: binaryen.Module,
		arg: (
			| null | boolean
			| binaryen.ExpressionRef
			| readonly [bigint] | readonly [binaryen.ExpressionRef]
			| 'tuple'
		) = null,
	) {
		this.#internal = this.mod.v128.const(new Uint8Array(16)); // HACK: TypeScript bug where native-private fields are not emitted in constructor when `useDefineForClassFields` compiler option is off

		if (arg === null) {
			// the arg represents the Counterpoint `null` value
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0x0001));
		} else if (arg === false) {
			// the arg represents the Counterpoint `false` value
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0x0002));
		} else if (arg === true) {
			// the arg represents the Counterpoint `true` value
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0x0003));
		} else if (arg === 'tuple') {
			// the arg represents the an empty Counterpoint Tuple object
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0x0062));
		} else if (typeof arg === 'number') {
			// the arg represents a dynamic Binaryen expression
			/*
			 * If the arg represents an `int`, set Lane 3 to `\x0018` and set Lane 4–7 (joined) to its `i64` value;
			 * else, if the arg represents a `float`, set Lane 3 to `\x0028` and set Lanes 4–7 (joined) to its `f64` value;
			 * else, if the arg is any other `v128`, set all lanes to those lanes.
			 */
			switch (binaryen.getExpressionType(arg)) {
				case binaryen.i64: {
					this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0x0018));
					this.#internal = this.mod.i64x2.replace_lane(this.#internal, 1, arg);
					break;
				}
				case binaryen.f64: {
					this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0x0028));
					this.#internal = this.mod.f64x2.replace_lane(this.#internal, 1, arg);
					break;
				}
				case binaryen.v128: {
					this.#internal = arg;
					break;
				}
				default: {
					throw new TypeError('Expected either `i64`, `f64`, or `v128`.');
				}
			}
		} else if (typeof arg[0] === 'bigint') {
			// the arg represents a hard-coded address
			const address: bigint = arg[0];
			assert.ok(0 <= address && address < 2n ** 64n, new RangeError(`Expected ${ address } to be between 0 and ${ 2n ** 64n - 1n }`));
			return new BinVect(mod, [bigint_to_i64(mod, address)]); // HACK: `this()`
		} else {
			// the arg represents a dynamic address
			const address: binaryen.ExpressionRef = arg[0];
			assert.strictEqual(
				binaryen.getExpressionType(address),
				binaryen.i64,
				new TypeError('Expected address value to be an `i64`.'),
			);
			/*
			 * Set Lane 3 to `\x0038` and set Lanes 4–7 (joined) to its `i64` value.
			 */
			this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0x0038));
			this.#internal = this.mod.i64x2.replace_lane(this.#internal, 1, address);
		}

		this.#type = this.mod.i16x8.extract_lane_s(this.#internal, 3);
	}

	/** The `v128` implementation. */
	public get vect(): binaryen.ExpressionRef {
		return this.#internal;
	}

	/** Whether the Header Lane is within a given range (inclusive). */
	#checkTypeRange(min: bigint, max: bigint): binaryen.ExpressionRef {
		const lower: binaryen.ExpressionRef = this.mod.i32.const(Number(min));
		const upper: binaryen.ExpressionRef = this.mod.i32.const(Number(max));
		return this.mod.i32.and(this.mod.i32.le_s(lower, this.#type), this.mod.i32.le_s(this.#type, upper));
	}

	/** Whether the value does not exist. */
	public get isVoid(): binaryen.ExpressionRef {
		return this.mod.i32.eqz(this.#type);
	}

	/** Whether the value is intended to be interpreted as a special value: null, false, or true. */
	public isSpecial(value?: null | boolean): binaryen.ExpressionRef {
		return (
			value === null  ? this.mod.i32.eq(this.#type, this.mod.i32.const(0x0001)) :
			value === false ? this.mod.i32.eq(this.#type, this.mod.i32.const(0x0002)) :
			value === true  ? this.mod.i32.eq(this.#type, this.mod.i32.const(0x0003)) :
			(assert.strictEqual(value, undefined), this.#checkTypeRange(0x0001n, 0x000fn))
		);
	}

	/** Whether the value is intended to be interpreted as an int. */
	public get isInt(): binaryen.ExpressionRef {
		return this.#checkTypeRange(0x0010n, 0x001fn);
	}

	/** Whether the value is intended to be interpreted as a float. */
	public get isFloat(): binaryen.ExpressionRef {
		return this.#checkTypeRange(0x0020n, 0x002fn);
	}

	/** Whether the value is intended to be interpreted as an address. */
	public get isAddr(): binaryen.ExpressionRef {
		return this.#checkTypeRange(0x0030n, 0x003fn);
	}

	/** Whether the value is intended to be interpreted as a Tuple object. */
	public get isTuple(): binaryen.ExpressionRef {
		return this.#checkTypeRange(0x0060n, 0x006fn);
	}

	/** The value as interpreted as a special value: null, false, or true. */
	public get specialValue(): binaryen.ExpressionRef {
		return this.#type;
	}

	/** The value as interpreted as an int. */
	public get intValue(): binaryen.ExpressionRef {
		return this.mod.i64x2.extract_lane(this.#internal, 1);
	}

	/** The value as interpreted as a float. */
	public get floatValue(): binaryen.ExpressionRef {
		return this.mod.f64x2.extract_lane(this.#internal, 1);
	}

	/** The value as interpreted as an address. */
	public get addrValue(): binaryen.ExpressionRef {
		return this.mod.i64x2.extract_lane(this.#internal, 1);
	}
}
