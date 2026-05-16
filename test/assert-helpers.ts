import * as assert from 'node:assert';
import * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	assert_instanceof,
	TYPE,
} from '../src/index.ts';



/**
 * Asserts that two arrays have the same item (by `assert.strictEqual`) at each index.
 */
export function assert_shallowStrictEqual<T>(actual: unknown[], expected: T[], message?: Parameters<typeof assert.strictEqual>[2]): asserts actual is T[] {
	if (actual === expected) {
		return;
	}
	assert.strictEqual(actual.length, expected.length, message);
	return xjs.Array.forEachAggregated(actual, (item, i) => assert.strictEqual(item, expected[i], message));
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
export function assertEqualTypes(arg0: TYPE.Type | readonly TYPE.Type[] | ReadonlyMap<TYPE.Type, TYPE.Type>, arg1?: TYPE.Type | readonly TYPE.Type[]): void {
	if (arg0 instanceof Map) {
		return assertEqualTypes([...arg0.keys()], [...arg0.values()]);
	} else if (Array.isArray(arg0)) {
		assert.strictEqual(arg0.length, (arg1 as TYPE.Type[]).length, 'Expected arrays to have the same length.');
		return xjs.Array.forEachAggregated(arg0, (act, i) => assertEqualTypes(act as TYPE.Type, (arg1 as TYPE.Type[])[i]));
	} else {
		if (TYPE.TYPE_CONSTANTS.includes(arg1 as TYPE.Type)) {
			return assert.strictEqual(arg0, arg1);
		} else {
			try {
				return assert.deepStrictEqual(arg0, arg1);
			} catch {
				return assert.ok((arg0 as TYPE.Type).equals(arg1 as TYPE.Type), `${ arg0 as TYPE.Type } == ${ arg1 }`);
			}
		};
	}
}



export function assertEqualBins<Ref extends binaryen.ExpressionRef>(actual: Ref, expected: Ref, message?: Parameters<typeof assert.strictEqual>[2]): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef>(actual: readonly Ref[], expected: readonly Ref[]): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef>(bins: ReadonlyMap<Ref, Ref>): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef>(arg0: Ref | readonly Ref[] | ReadonlyMap<Ref, Ref>, arg1?: Ref | readonly Ref[], message?: Parameters<typeof assert.strictEqual>[2]): void {
	if (arg0 instanceof Map) {
		return assertEqualBins([...arg0.keys()], [...arg0.values()]);
	} else if (Array.isArray(arg0)) {
		try {
			return assert.deepStrictEqual(arg0, arg1);
		} catch {
			assert.strictEqual(arg0.length, (arg1 as Ref[]).length, 'Expected arrays to have the same length.');
			return xjs.Array.forEachAggregated(arg0, (act, i) => assertEqualBins(act, (arg1 as Ref[])[i]));
		}
	} else {
		try {
			return assert.strictEqual(arg0, arg1, message);
		} catch {
			return assert.strictEqual(binaryen.emitText(arg0 as Ref), binaryen.emitText(arg1 as Ref), message);
		}
	}
}



type ValidationObject = {cons: ConstructorType<Error>} & (
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
			`The \`cons\` value of validation object ${ validation.cons } with an \`errors\` property must be \`AggregateError\` or a subclass of it.`,
		);
		assert.strictEqual(
			(actual as AggregateError).errors.length,
			validation.errors.length,
			'Number of actual sub-errors should equal number of validation sub-errors.',
		);
		return xjs.Array.forEachAggregated(
			validation.errors,
			(subvalidation, i) => assertAssignable((actual as AggregateError).errors[i] as Error, subvalidation),
		);
	}
}
