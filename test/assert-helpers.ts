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



/**
 * @param orig the original function; useful for setting & unsetting
 * @param spy  the wrapper function that is actually called during tests
 * @return     any return value
 */
type ExpectCallback<Func extends (...args: any[]) => any, Return> = (orig: Func, spy: Func) => Return;
/**
 * Assert that, while a callback is performed, the given function is called a specified number of times.
 * @param orig     the function, a copy of which is expected to actually be called
 * @param times    the number of times the function is expected to be called
 * @param callback the routine to perform while testing; {@see ExpectCallback}
 * @return         the return value of `callback`
 * @throw          if `orig` was not called the exact specified number of times
 * @throw          if `callback` itself throws
 */
export function expectToBeCalled<Func extends (...args: any[]) => any, Return>(orig: Func, times: number, callback: ExpectCallback<Func, Return>): Return {
	const tracker: assert.CallTracker = new assert.CallTracker();
	try {
		return callback(orig, tracker.calls(orig, times));
	} finally {
		try {
			tracker.verify();
		} catch {
			throw tracker.report().map((info) => new assert.AssertionError(info)); // TODO: use ES2021 `AggregateError`
		};
	};
}
