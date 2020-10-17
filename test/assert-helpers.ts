import * as assert from 'assert'



/**
 * Assert the length of an array or tuple.
 * Useful helper for determining types of items in heterogeneous tuples.
 * @param array the array or tuple to test
 * @param length the length to assert
 * @param message the message to send into {@link assert.strictEqual}
 */
export function assert_arrayLength(array: readonly unknown[], length: 0      , message?: string | Error): asserts array is readonly [                                                                      ];
export function assert_arrayLength(array: readonly unknown[], length: 1      , message?: string | Error): asserts array is readonly [unknown,                                                              ];
export function assert_arrayLength(array: readonly unknown[], length: 2      , message?: string | Error): asserts array is readonly [unknown, unknown,                                                     ];
export function assert_arrayLength(array: readonly unknown[], length: 3      , message?: string | Error): asserts array is readonly [unknown, unknown, unknown,                                            ];
export function assert_arrayLength(array: readonly unknown[], length: 4      , message?: string | Error): asserts array is readonly [unknown, unknown, unknown, unknown,                                   ];
export function assert_arrayLength(array: readonly unknown[], length: 5      , message?: string | Error): asserts array is readonly [unknown, unknown, unknown, unknown, unknown,                          ];
export function assert_arrayLength(array: readonly unknown[], length: 6      , message?: string | Error): asserts array is readonly [unknown, unknown, unknown, unknown, unknown, unknown,                 ];
export function assert_arrayLength(array: readonly unknown[], length: 7      , message?: string | Error): asserts array is readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown,        ];
export function assert_arrayLength(array: readonly unknown[], length: 8      , message?: string | Error): asserts array is readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown];
export function assert_arrayLength(array: readonly unknown[], length: number , message?: string | Error): void;
export function assert_arrayLength(array: readonly unknown[], length: number , message?: string | Error): void {
	return assert.strictEqual(array.length, length, message)
}
