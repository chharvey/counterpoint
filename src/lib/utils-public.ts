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
