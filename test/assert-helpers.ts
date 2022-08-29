import * as assert from 'assert';
import * as xjs from 'extrajs';
import type {TYPE} from '../src/index.js';



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
 * but if that fails, compares by `Type#equals`.
 * @param actual   the actual type
 * @param expected what `actual` is expected to equal
 * @throws {AssertionError} actual and expected fail equality
 */
export function assertEqualTypes(actual: TYPE.Type, expected: TYPE.Type): void;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param actual   an array of actual types
 * @param expected an array of what `actual` is expected to equal
 * @throws {AssertionError} if a corresponding type fails equality
 */
export function assertEqualTypes(actual: TYPE.Type[], expected: TYPE.Type[]): void;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param types a map of keys and values to compare
 * @throws {AssertionError} if one of the pairs fails equality
 */
export function assertEqualTypes(types: ReadonlyMap<TYPE.Type, TYPE.Type>): void;
export function assertEqualTypes(param1: TYPE.Type | TYPE.Type[] | ReadonlyMap<TYPE.Type, TYPE.Type>, param2?: TYPE.Type | TYPE.Type[]): void {
	if (param1 instanceof Map) {
		return assertEqualTypes([...param1.keys()], [...param1.values()]);
	} else if (param1 instanceof Array) {
		try {
			return assert.deepStrictEqual(param1, param2);
		} catch {
			return xjs.Array.forEachAggregated(param1, (act, i) => assertEqualTypes(act, (param2 as TYPE.Type[])[i]));
		};
	} else {
		try {
			return assert.deepStrictEqual(param1, param2);
		} catch {
			return assert.ok((param1 as TYPE.Type).equals(param2 as TYPE.Type), `${ param1 } == ${ param2 }`);
		}
	}
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
		assert.ok(
			validation.cons === AggregateError || validation.cons.prototype instanceof AggregateError, // validation.cons extends AggregateError
			`The \`cons\` value of validation object ${ validation } with an \`errors\` property must be \`AggregateError\` or a subclass of it.`,
		);
		assert.strictEqual(
			(actual as AggregateError).errors.length,
			validation.errors.length,
			'The number of sub-error validations does not equal the number of actual sub-errors.',
		);
		return validation.errors.forEach((subvalidation, i) => {
			assertAssignable((actual as AggregateError).errors[i], subvalidation);
		});
	}
}
