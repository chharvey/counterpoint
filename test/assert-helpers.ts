import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {TYPE} from '../src/index.js';



type Class = Function; // eslint-disable-line @typescript-eslint/ban-types --- alias `Function` to mean “any class object”



/**
 * Assert an object is an instance of a class,
 * using the `instanceof` operator.
 * @param obj  - the object
 * @param cons - the class or constructor function
 * @throws {AssertionError} if false
 */
export function assert_instanceof(obj: object, cons: Class): void {
	assert.ok(obj instanceof cons, `${ obj } should be an instance of ${ cons }.`);
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
export function assertEqualTypes(actual: readonly TYPE.Type[], expected: readonly TYPE.Type[]): void;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param types a map of keys and values to compare
 * @throws {AssertionError} if one of the pairs fails equality
 */
export function assertEqualTypes(types: ReadonlyMap<TYPE.Type, TYPE.Type>): void;
export function assertEqualTypes(param1: TYPE.Type | readonly TYPE.Type[] | ReadonlyMap<TYPE.Type, TYPE.Type>, param2?: TYPE.Type | readonly TYPE.Type[]): void {
	if (param1 instanceof Map) {
		return assertEqualTypes([...param1.keys()], [...param1.values()]);
	} else if (Array.isArray(param1)) {
		try {
			return assert.deepStrictEqual(param1, param2);
		} catch {
			return xjs.Array.forEachAggregated(param1, (act, i) => assertEqualTypes(act, (param2 as TYPE.Type[])[i]));
		}
	} else {
		try {
			return assert.deepStrictEqual(param1, param2);
		} catch {
			return assert.ok((param1 as TYPE.Type).equals(param2 as TYPE.Type), `${ param1 } == ${ param2 }`);
		}
	}
}



export function assertEqualBins<Ref extends binaryen.ExpressionRef | binaryen.GlobalRef | binaryen.FunctionRef | binaryen.Module>(actual: Ref, expected: Ref): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef | binaryen.GlobalRef | binaryen.FunctionRef | binaryen.Module>(actual: readonly Ref[], expected: readonly Ref[]): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef | binaryen.GlobalRef | binaryen.FunctionRef | binaryen.Module>(bins: ReadonlyMap<Ref, Ref>): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef | binaryen.GlobalRef | binaryen.FunctionRef | binaryen.Module>(actual: Ref | readonly Ref[] | ReadonlyMap<Ref, Ref>, expected?: Ref | readonly Ref[]): void {
	if (actual instanceof Map) {
		return assertEqualBins([...actual.keys()], [...actual.values()]);
	} if (Array.isArray(actual)) {
		try {
			return assert.deepStrictEqual(actual, expected);
		} catch {
			return xjs.Array.forEachAggregated(actual, (act, i) => assertEqualBins(act, (expected as Ref[])[i]));
		}
	} else {
		try {
			return assert.deepStrictEqual(actual, expected);
		} catch {
			return assert.strictEqual(binaryen.emitText(actual as Ref), binaryen.emitText(expected as Ref));
		}
	}
}



type ValidationObject = {cons: Class} & (
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
			'Number of actual sub-errors should equal number of validation sub-errors.',
		);
		return validation.errors.forEach((subvalidation, i) => {
			assertAssignable((actual as AggregateError).errors[i], subvalidation);
		});
	}
}
