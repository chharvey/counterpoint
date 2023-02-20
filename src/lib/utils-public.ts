/** A non-empty array. */
export type NonemptyArray<T> = [T, ...T[]];

/**
 * A half-closed range of integers from min (inclusive) to max (exclusive).
 * @example
 * const r: IntRange = [3n, 7n]; % a range of integers including 3, 4, 5, and 6, but not 7.
 * @index 0 the minimum, inclusive
 * @index 1 the maximum, exclusive
 */
export type IntRange = [bigint, bigint];

/**
 * A code unit is an integer within the closed interval [0, 0xff] that represents
 * a byte of an encoded Unicode code point.
 */
export type CodeUnit = number;

/* The type of keys in a map or record. */
export type Keys<M> =
	M extends Map<infer K, unknown> ? K :
	M extends Record<infer K, unknown> ? K :
	never;

/* The type of values in a map or record. */
export type Values<M> =
	M extends Map<unknown, infer V> ? V :
	M extends Record<PropertyKey, infer V> ? V:
	never;



/** Implementation of `xjs.Array.forEachAggregated` until it is released. */
export function forEachAggregated<T>(array: readonly T[], callback: (item: T, i: number, src: readonly T[]) => void): void {
	const errors: readonly Error[] = array.map((it, i, src) => {
		try {
			callback(it, i, src);
			return null;
		} catch (err) {
			return (err instanceof Error) ? err : new Error(`${ err }`);
		}
	}).filter((e): e is Error => e instanceof Error);
	if (errors.length) {
		throw (errors.length === 1)
			? errors[0]
			: new AggregateError(errors, errors.map((err) => err.message).join('\n'));
	}
}
/** Implementation of `xjs.Array.mapAggregated` until it is released. */
export function mapAggregated<T, U>(array: readonly T[], callback: (item: T, i: number, src: readonly T[]) => U): U[] {
	const results: ([true, U] | [false, Error])[] = array.map((it, i, src) => {
		try {
			return [true, callback(it, i, src)];
		} catch (err) {
			return [false, (err instanceof Error) ? err : new Error(`${ err }`)];
		}
	});
	const errors: Error[] = results.filter((pair): pair is [false, Error] => !pair[0]).map((pair) => pair[1]);
	if (errors.length) {
		throw (errors.length === 1)
			? errors[0]
			: new AggregateError(errors, errors.map((err) => err.message).join('\n'));
	} else {
		return results.filter((pair): pair is [true, U] => pair[0]).map((pair) => pair[1]);
	}
}
