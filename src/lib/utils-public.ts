import * as assert from 'assert';



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



export type SubclassOf<Class extends object> = abstract new (...args: any[]) => Class; // eslint-disable-line @typescript-eslint/no-explicit-any



/* The type of keys in a map or record. */
export type Keys<M> = (
	M extends ReadonlyMap<infer K, unknown> ? K :
	M extends WeakMap    <infer K, unknown> ? K :
	M extends Record     <infer K, unknown> ? K :
	never
);

/* The type of values in a map or record. */
export type Values<M> = (
	M extends ReadonlyMap<unknown,     infer V> ? V :
	M extends WeakMap    <object,      infer V> ? V :
	M extends Record     <PropertyKey, infer V> ? V :
	never
);



/**
 * Assert an object is an instance of a class,
 * using the `instanceof` operator.
 * @param obj  - the object
 * @param cons - the class or constructor function
 * @throws {AssertionError} if false
 */
export function assert_instanceof<Class extends object>(obj: unknown, cons: SubclassOf<Class>, err?: Parameters<typeof assert.ok>[1]): asserts obj is Class {
	return assert.ok(obj instanceof cons, err || `${ obj } should be an instance of ${ cons.name || cons }.`); // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing --- `err` could be the empty string
}



export function assert_context_name(context: ClassMethodDecoratorContext, name: string): void {
	return assert.strictEqual(context.name, name, `This decorator may only be used on methods named \`${ name }\`.`);
}
