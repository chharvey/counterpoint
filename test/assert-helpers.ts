import * as assert from 'assert'
import type {
	SolidType,
} from '../src/typer/index.js'



/**
 * Assert an object is an instance of a class,
 * using the `instanceof` operator.
 * @param obj  - the object
 * @param cons - the class or constructor function
 * @throws {AssertionError} if false
 */
export function assert_instanceof(obj: object, cons: Function): void {
	assert.ok(obj instanceof cons, `${ obj } should be an instance of ${ cons }.`);
}



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
export function assert_wasCalled<Func extends (...args: any[]) => any, Return>(orig: Func, times: number, callback: ExpectCallback<Func, Return>): Return {
	const tracker: assert.CallTracker = new assert.CallTracker();
	try {
		return callback.call(null, orig, tracker.calls(orig, times));
	} finally {
		try {
			tracker.verify();
		} catch {
			throw new AggregateError(tracker.report().map((info) => new assert.AssertionError(info)));
		};
	};
}


/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `SolidType#equals`.
 * @param types a map of keys and values to compare
 * @throws {AssertionError} if one of the pairs fails equality
 */
export function assertEqualTypes(types: ReadonlyMap<SolidType, SolidType>): void;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `SolidType#equals`.
 * @param actual   an array of actual types
 * @param expected an array of what `actual` is expected to equal
 * @throws {AssertionError} if a corresponding type fails equality
 */
export function assertEqualTypes(actual: SolidType[], expected: SolidType[]): void;
export function assertEqualTypes(actual: SolidType[] | ReadonlyMap<SolidType, SolidType>, expected?: SolidType[]): void {
	return (actual instanceof Map)
		? (actual as ReadonlyMap<SolidType, SolidType>).forEach((exp, act) => {
			try {
				return assert.deepStrictEqual(act, exp);
			} catch {
				return assert.ok(act.equals(exp), `${ act } == ${ exp }`);
			}
		})
		: (actual as SolidType[]).forEach((act, i) => {
			try {
				return assert.deepStrictEqual(act, expected![i]);
			} catch {
				return assert.ok(act.equals(expected![i]), `${ act } == ${ expected![i] }`);
			}
		});
}



type ValidationObject = {cons: Function} & (
	| {message: string}
	| {errors: ValidationObject[]}
);
export function assertAssignable(actual: Error, validation: ValidationObject): void {
	assert_instanceof(actual, validation.cons);
	if ('message' in validation) {
		return assert.strictEqual(actual.message, validation.message);
	} else if ('errors' in validation) {
		assert.ok(actual instanceof AggregateError);
		return validation.errors.forEach((subvalidation, i) => {
			assertAssignable(actual.errors[i], subvalidation);
		});
	}
}
