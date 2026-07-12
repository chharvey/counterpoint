import * as assert from 'node:assert';
import * as test from 'node:test';
import {assert_shallowStrictEqual} from './utils.ts';



test.suite('assert_shallowStrictEqual', () => {
	test.test('reference-equal arrays.', () => {
		const arr = [true, 42, 'hello'];
		return assert_shallowStrictEqual(arr, arr); // assert does not throw
	});
	test.test('shallow-equal arrays with value types.', () => {
		assert_shallowStrictEqual(
			[true, 42, 'hello'],
			[true, 42, 'hello'],
		); // assert does not throw
	});
	test.test('shallow-equal arrays with reference types.', () => {
		const arr = [11, 22, 33];
		const obj = {a: 11, b: 22, c: 33};
		return assert_shallowStrictEqual(
			[arr, obj],
			[arr, obj],
		); // assert does not throw
	});
	test.test('throws when arrays are deep-equal but not shallow-equal.', () => {
		assert.throws(() => assert_shallowStrictEqual(
			[true, [11, 22, 33], {a: 11, b: 22, c: 33}],
			[true, [11, 22, 33], {a: 11, b: 22, c: 33}],
			'some message',
		), /some message/);
	});
	test.test('throws when arrays are not deep-equal.', () => {
		assert.throws(() => assert_shallowStrictEqual(
			[true, 'hello'],
			[true, 'world'],
			'some message',
		), /some message/);
	});
	test.test('throws the given Error object.', () => {
		const err = new Error('not shallow-equal');
		// @ts-expect-error --- DefinitelyTyped is incomplete
		assert.throws(() => assert_shallowStrictEqual([], [null], err), (e) => {
			assert.strictEqual(e, err);
			return true;
		});
	});
});
