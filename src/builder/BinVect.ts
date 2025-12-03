import * as assert from 'node:assert';
import binaryen from 'binaryen';



/**
 * A Binaryen vector (`v128`) representing one of the following:
 * - one of three primitive special constants, the Counterpoint values `null`, `false`, or `true`, as a value on the stack
 * - a numeric value of Counterpoint type `int`, `nat`, `dec`, or `float`, as a value on the stack
 * - an address of a Counterpoint reference type, as a pointer to an object in the heap
 *
 * # Layout
 * The 128-bit vector has 8 lanes (indexed 0–7, left-to-right), 16 bits each.
 * - Lanes 0–1 are always zero (reserved for future use).
 * - Lane 2 stores the **scaling factor** for `dec` values, which are not yet supported.
 * - Lane 3, the **header lane**, indicates the vector’s representation.
 * - Lanes 4–7, the **data lanes** hold the vector’s data.
 * 	Data is always left-aligned, stored in little-endian format (by byte).
 * 	(E.g., an `i32` of value `\x05060708` would be stored as `\x0807 \x0605` in Lanes 4–5.)
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
 * `\x0012` | The vector holds an `i16` value, representing a signed integer.
 * `\x0014` | The vector holds an `i32` value, representing a signed integer.
 * `\x0018` | The vector holds an `i64` value, representing a signed integer.
 * `\x0022` | The vector holds an `i16` value, representing an unsigned integer.
 * `\x0024` | The vector holds an `i32` value, representing an unsigned integer.
 * `\x0028` | The vector holds an `i64` value, representing an unsigned integer.
 * `\x0032` | The vector holds an `i16` value, representing a fixed-precision decimal value (with a scaling factor).
 * `\x0034` | The vector holds an `i32` value, representing a fixed-precision decimal value (with a scaling factor).
 * `\x0038` | The vector holds an `i64` value, representing a fixed-precision decimal value (with a scaling factor).
 * `\x0042` | The vector holds an `f16` value, representing a floating-point binary value.
 * `\x0044` | The vector holds an `f32` value, representing a floating-point binary value.
 * `\x0048` | The vector holds an `f64` value, representing a floating-point binary value.
 * `\x0058` | The vector holds an `i64` value, representing an address.
 *
 * # Value Types
 * ## Special Constants
 * When the Header is `\x0000`–`\x0003`, it represents a special constant (or lack thereof).
 * The represented constant is indicated by the Header’s value, as described above.
 * For no value (header `\x0000`), behavior is undefined.
 * Lanes 4–7 are ignored.
 *
 * ## Signed Integer Values
 * When the Header is `\x0012`, `\x0014`, or `\x0018`, it represents an `i16`, `i32`, or `i64` value respectively,
 * which must be interpreted as signed.
 * Currently, only `i64` values are used.
 * Lanes 4–7 together form the `i64` value, stored in little-endian format.
 * Header values of `\x0012` and `\x0014` reserved for future use.
 * Lane 2, the scaling factor, will be applicable for this type. Currently it is unused.
 *
 * ## Unsigned Integer Values
 * When the Header is `\x0022`, `\x0024`, or `\x0028`, it represents an `i16`, `i32`, or `i64` value respectively,
 * which must be interpreted as unsigned.
 * Currently, only `i64` values are used.
 * Lanes 4–7 together form the `i64` value, stored in little-endian format.
 * Header values of `\x0022` and `\x0024` reserved for future use.

 * ## Decimal Values
 * Header values `\x0030`–`\x003f` are reserved. Decimal values are not yet supported.
 *
 * ## Float Values
 * When the Header is `\x0042`, `\x0044`, or `\x0048`, it represents an `f16`, `f32`, or `f64` value respectively.
 * Currently, only `f64` values are used.
 * Lanes 4–7 together form the `f64` value, stored in little-endian format.
 * Header values of `\x0042` and `\x0044` reserved for future use.
 *
 * ## Address Values
 * When the Header is `\x0058`, it represents an address of an object in the heap, indexed by an `i64`, held in Lanes 4–7.
 *
 * The following diagram may prove useful:
 * ```
 *                     Lane 0 Lane 1 Lane 2 Lane 3 | Lane 4 Lane 5 Lane 6 Lane 7
 *                       ----   ----   ----   ---- |   ----   ----   ----   ----
 * No value (default): \x0000 \x0000 \x0000 \x0000 | \x0000 \x0000 \x0000 \x0000
 * null:               \x0000 \x0000 \x0000 \x0001 | \x0000 \x0000 \x0000 \x0000
 * false:              \x0000 \x0000 \x0000 \x0002 | \x0000 \x0000 \x0000 \x0000
 * true:               \x0000 \x0000 \x0000 \x0003 | \x0000 \x0000 \x0000 \x0000
 * signed i16:         \x0000 \x0000 \x0000 \x0012 | \x???? \x0000 \x0000 \x0000
 * signed i32:         \x0000 \x0000 \x0000 \x0014 | \x???? \x???? \x0000 \x0000
 * signed i64:         \x0000 \x0000 \x0000 \x0018 | \x???? \x???? \x???? \x????
 * unsigned i16:       \x0000 \x0000 \x0000 \x0022 | \x???? \x0000 \x0000 \x0000
 * unsigned i32:       \x0000 \x0000 \x0000 \x0024 | \x???? \x???? \x0000 \x0000
 * unsigned i64:       \x0000 \x0000 \x0000 \x0028 | \x???? \x???? \x???? \x????
 * reserved:           \x0000 \x0000 \x???? \x0032 | \x???? \x0000 \x0000 \x0000
 * reserved:           \x0000 \x0000 \x???? \x0034 | \x???? \x???? \x0000 \x0000
 * reserved:           \x0000 \x0000 \x???? \x0038 | \x???? \x???? \x???? \x????
 * f16:                \x0000 \x0000 \x0000 \x0042 | \x???? \x0000 \x0000 \x0000
 * f32:                \x0000 \x0000 \x0000 \x0044 | \x???? \x???? \x0000 \x0000
 * f64:                \x0000 \x0000 \x0000 \x0048 | \x???? \x???? \x???? \x????
 * address:            \x0000 \x0000 \x0000 \x0058 | \x???? \x???? \x???? \x????
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
		if (binaryen.getExpressionType(condition) !== binaryen.i32) {
			throw new TypeError('Expected `i32`.');
		}
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
	 * @param opts an object:
	 * 	@property `unsigned` - if `arg` is an `i64`, should it be interpreted as unsigned? (default `false`)
	 * 	@property `scale`    - the scale factor for decimal values (default `undefined`) — currently not supported
	 * 	@property `address`  - if `arg` is an `i64`, should it be interpreted as an address? (default `false`)
	 */
	public constructor(
		private readonly mod: binaryen.Module,
		arg:  null | boolean | binaryen.ExpressionRef = null,
		opts: {unsigned?: boolean, scale?: bigint, address?: boolean} = {},
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
		} else if (typeof arg === 'number') {
			// the arg represents a dynamic Binaryen expression
			switch (binaryen.getExpressionType(arg)) {
				/*
				 * If the arg is an `i64`:
				 * - Set Lane 3 to `\x0018` if signed (Counterpoint type `int`), `\x0028` if unsigned (Counterpoint type `nat`), `\x0058` if address (heap offset).
				 * - Set Lane 4–7 (joined) to its `i64` value.
				 */
				case binaryen.i64: {
					this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(opts.unsigned ? 0x0028 : opts.address ? 0x0058 : 0x0018));
					this.#internal = this.mod.i64x2.replace_lane(this.#internal, 1, arg);
					break;
				}
				/*
				 * If the arg is an `f64` (Counterpoint type `float`), set Lane 3 to `\x0048` and set Lanes 4–7 (joined) to its `f64` value.
				 */
				case binaryen.f64: {
					this.#internal = this.mod.i16x8.replace_lane(this.#internal, 3, this.mod.i32.const(0x0048));
					this.#internal = this.mod.f64x2.replace_lane(this.#internal, 1, arg);
					break;
				}
				/*
				 * If the arg is a `v128` (unspecified type), set all lanes to those lanes.
				 */
				case binaryen.v128: {
					this.#internal = arg;
					break;
				}
				default: {
					throw new TypeError('Expected either `i64`, `f64`, or `v128`.');
				}
			}
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

	/** Whether the value is intended to be interpreted as a signed integer. */
	public get isInt(): binaryen.ExpressionRef {
		return this.#checkTypeRange(0x0010n, 0x001fn);
	}

	/** Whether the value is intended to be interpreted as an unsigned integer. */
	public get isNat(): binaryen.ExpressionRef {
		return this.#checkTypeRange(0x0020n, 0x002fn);
	}

	/** Whether the value is intended to be interpreted as a float. */
	public get isFloat(): binaryen.ExpressionRef {
		return this.#checkTypeRange(0x0040n, 0x004fn);
	}

	/** Whether the value is intended to be interpreted as an address. */
	public get isAddr(): binaryen.ExpressionRef {
		return this.#checkTypeRange(0x0050n, 0x005fn);
	}

	/** The value as interpreted as a special value: null, false, or true. */
	public get specialValue(): binaryen.ExpressionRef {
		return this.#type;
	}

	/** The value as interpreted as a signed integer. */
	public get intValue(): binaryen.ExpressionRef {
		return this.mod.i64x2.extract_lane(this.#internal, 1);
	}

	/** The value as interpreted as an unsigned integer. */
	public get natValue(): binaryen.ExpressionRef {
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
