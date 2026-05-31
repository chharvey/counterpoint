import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	assert_instanceof,
	Result,
} from '../../src/index.ts';



test.suite('Result', () => {
	const {Ok, Fail} = Result;
	test.suite('.allOk', () => {
		test.test('returns an empty array when given an empty array.', () => {
			const all: Result<unknown[]> = Result.allOk([]);
			assert_instanceof(all, Ok);
			return assert.deepStrictEqual(all.value, []);
		});
		test.test('returns an array of values if no given items are Fails.', () => {
			const all: Result<unknown[]> = Result.allOk<unknown>([
				new Ok<null>(null),
				new Ok<boolean>(false),
				new Ok<number>(42),
				new Ok<string>('hi'),
			]);
			assert_instanceof(all, Ok);
			return assert.deepStrictEqual(all.value, [null, false, 42, 'hi']);
		});
		test.test('treats non-Result values as successes.', () => {
			const all: Result<unknown[]> = Result.allOk<unknown>([
				new Ok<null>(null),
				false,
				new Ok<number>(42),
				'hi',
			]);
			assert_instanceof(all, Ok);
			return assert.deepStrictEqual(all.value, [null, false, 42, 'hi']);
		});
		test.test('returns a new Fail containing the reason of the first Fail in the array.', () => {
			const determiner = new Fail<boolean>(new TypeError('false'));
			const all: Result<unknown[]> = Result.allOk<unknown>([
				new Ok<null>(null),
				determiner,
				new Ok<number>(42),
				new Fail<string>(new RangeError('hi')),
			]);
			assert_instanceof(all, Fail);
			assert.notStrictEqual(all, determiner);
			return assert.strictEqual(all.reason, determiner.reason);
		});
	});


	test.suite('.anyOk', () => {
		test.test('returns Fail when given an empty array.', () => {
			const any: Result<never> = Result.anyOk([]);
			assert_instanceof(any, Fail);
			assert_instanceof(any.reason, Error);
			return assert.strictEqual(any.reason.message, 'All results in given empty array were failures.');
		});
		test.test('returns an AggregateError of reasons if no given items are Oks.', () => {
			const any = Result.anyOk<unknown>([
				new Fail<null>(new Error('null')),
				new Fail<boolean>(new Error('false')),
				new Fail<number>(new Error('42')),
				new Fail<string>(new Error('hi')),
			]) as Result<unknown, AggregateError>;
			assert_instanceof(any, Fail, 'expected test value to be Fail');
			assert_instanceof(any.reason, AggregateError, 'expected reason to be AggregateError');
			return assert.deepStrictEqual(any.reason.errors, [
				new Error('null'),
				new Error('false'),
				new Error('42'),
				new Error('hi'),
			]);
		});
		test.test('returns an Ok containing the value of the first Ok in the array.', () => {
			const determiner = new Ok<boolean>(false);
			const any = Result.anyOk<unknown>([
				new Fail<null>(new TypeError('null')),
				determiner,
				new Fail<number>(new RangeError('42')),
				new Ok<string>('hi'),
			]) as Result<unknown, AggregateError>;
			assert_instanceof(any, Ok);
			assert.notStrictEqual(any, determiner);
			return assert.strictEqual(any.value, determiner.value);
		});
		test.test('treats non-Result values as successes.', () => {
			const any = Result.anyOk<unknown>([
				new Fail<null>(new TypeError('null')),
				false,
				new Fail<number>(new RangeError('42')),
				new Ok<string>('hi'),
			]) as Result<unknown, AggregateError>;
			assert_instanceof(any, Ok);
			return assert.strictEqual(any.value, false);
		});
	});


	test.suite('#map', () => {
		test.test('[this: Ok] returns new `Ok` object whose value is the value returned by callback.', () => {
			const ok: Result<number> = new Ok<number>(42);
			const mapped: Result<string> = ok.map((value) => {
				assert.strictEqual(value, 42);
				return 'done';
			});
			assert_instanceof(mapped, Ok);
			assert.notStrictEqual(mapped, ok);
			return assert.strictEqual(mapped.value, 'done');
		});
		test.test('[this: Fail] returns new `Fail` object with the same reason.', () => {
			const reason = new Error('message');
			const fail: Result<number> = new Fail<number>(reason);
			const mapped: Result<never> = fail.map(() => {
				assert.fail('does not execute callback.');
			});
			assert_instanceof(mapped, Fail);
			assert.notStrictEqual(mapped, fail);
			return assert.strictEqual(mapped.reason, reason);
		});
	});


	test.suite('#catch', () => {
		test.test('[this: Ok] returns new `Ok` object with same value.', () => {
			const ok: Result<number> = new Ok<number>(42);
			const caught: Result<number> = ok.catch(() => {
				assert.fail('does not execute callback.');
			});
			assert_instanceof(caught, Ok);
			assert.notStrictEqual(caught, ok);
			return assert.strictEqual(caught.value, 42);
		});
		test.test('[this: Fail] returns new `Fail` object whose reason is the value returned by callback.', () => {
			const err = new Error('message');
			const done = new Error('done');
			const fail: Result<number> = new Fail<number>(err);
			const mapped: Result<number> = fail.catch((reason) => {
				assert.strictEqual(reason, err);
				return done;
			});
			assert_instanceof(mapped, Fail);
			assert.notStrictEqual(mapped, fail);
			return assert.strictEqual(mapped.reason, done);
		});
	});


	test.suite('#flatMap', () => {
		test.test('[this: Ok] returns the result of calling callback.', () => {
			const ok: Result<number> = new Ok<number>(42);
			const returned_ok = new Ok<string>('done');
			const returned_fail = new Fail<string>(new Error('done'));
			const mapped_to_ok: Result<string> = ok.flatMap((value) => {
				assert.strictEqual(value, 42);
				return returned_ok;
			});
			const mapped_to_fail: Result<string> = ok.flatMap((value) => {
				assert.strictEqual(value, 42);
				return returned_fail;
			});
			assert.strictEqual(mapped_to_ok, returned_ok);
			return assert.strictEqual(mapped_to_fail, returned_fail);
		});
		test.test('[this: Fail] returns new `Fail` object with the same reason.', () => {
			const err = new Error('message');
			const fail: Result<number> = new Fail<number>(err);
			const mapped: Result<never> = fail.flatMap(() => {
				assert.fail('does not execute callback.');
			});
			assert_instanceof(mapped, Fail);
			assert.notStrictEqual(mapped, fail);
			return assert.strictEqual(mapped.reason, err);
		});
	});


	test.suite('#flatCatch', () => {
		test.test('[this: Ok] returns new `Ok` object with same value.', () => {
			const ok: Result<number> = new Ok<number>(42);
			const caught: Result<number> = ok.flatCatch(() => {
				assert.fail('does not execute callback.');
			});
			assert_instanceof(caught, Ok);
			assert.notStrictEqual(caught, ok);
			return assert.strictEqual(caught.value, 42);
		});
		test.test('[this: Fail] returns the result of calling callback.', () => {
			const err = new Error('message');
			const fail: Result<number> = new Fail<number>(err);
			const returned_ok = new Ok<number>(42);
			const returned_fail = new Fail<number>(new Error('done'));
			const mapped_to_ok: Result<number> = fail.flatCatch((reason) => {
				assert.strictEqual(reason, err);
				return returned_ok;
			});
			const mapped_to_fail: Result<number> = fail.flatCatch((reason) => {
				assert.strictEqual(reason, err);
				return returned_fail;
			});
			assert.strictEqual(mapped_to_ok, returned_ok);
			return assert.strictEqual(mapped_to_fail, returned_fail);
		});
	});


	test.suite('#unwrapOrPanic', () => {
		test.test('[this: Ok] returns the success value.', () => {
			const ok: Result<number> = new Ok<number>(42);
			return assert.strictEqual(ok.unwrapOrPanic(), 42);
		});
		test.test('[this: Fail] throws the failure reason.', () => {
			const err = new Error('message');
			const fail: Result<number> = new Fail<number>(err);
			assert.throws(() => fail.unwrapOrPanic(), (thrown) => {
				assert.strictEqual(thrown, err);
				return true;
			});
		});
	});
});
