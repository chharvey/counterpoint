import type binaryen from 'binaryen';



/**
 * Convert a BigInt (signed 64-bit) to Binaryen `i64.const`.
 * @param    mod   a Binaryen module instance
 * @param    value a BigInt in the range [-2^63, 2^63 - 1] (if signed) or [0, 2^64 - 1] (if unsigned)
 * @param    u     Interpret as unsigned?
 * @returns        an `i64.const(low, high)` expression
 * @deprecated Binaryen.TS `i64.const()` now allows a single bigint argument
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

	// @ts-expect-error --- binaryen.js not typed yet
	return mod.i64.const(value);
}
