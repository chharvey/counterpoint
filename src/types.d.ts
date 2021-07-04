/**
 * A code point is a number within [0, 0x10_ffff] that represents
 * the index of a character in the Unicode Universal Character Set.
 */
export type CodePoint = number;

/**
 * A code unit is a number within [0, 0xff] that represents
 * a byte of an encoded Unicode code point.
 */
export type CodeUnit = number;

/**
 * An encoded character is a sequence of code units
 * that corresponds to a single code point in the UTF-8 encoding.
 */
export type EncodedChar =
	| [CodeUnit]
	| [CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit]
;

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
