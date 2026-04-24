import binaryen from 'binaryen';
import {BinVect} from './index.ts';



const MASK32 = 0xffff_ffffn;
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
