import * as assert from 'node:assert';
import * as test from 'node:test';
import {assert_instanceof} from '../../src/index.ts';
import {Lazy} from '../../src/lib/Lazy.ts';



test.suite('Lazy', () => {
	test.suite('#force', () => {
		test.test('sets value.', () => {
			const lz = new Lazy<number>(() => 2);
			assert.ok(!lz.isEvald);
			const value: number = lz.force();
			assert.ok(lz.isEvald);
			return assert.strictEqual(value, 2);
		});
		test.test('defers callback invocation until forced.', () => {
			let called = false;
			let returned = 2;
			const lz = new Lazy<number>(() => {
				called = true;
				return returned;
			});
			assert.ok(!called);
			returned = 3;
			lz.force();
			assert.ok(called);
			return assert.strictEqual(lz.force(), 3);
		});
		test.test('forcing inner does not force outer.', () => {
			const inner = new Lazy<number>(() => 2);
			const outer = new Lazy<Lazy<number>>(() => inner);
			assert.ok(!inner.isEvald);
			assert.ok(!outer.isEvald);
			inner.force();
			assert.ok(inner.isEvald);
			assert.ok(!outer.isEvald);
		});
		test.test('forcing outer does not force inner.', () => {
			const inner = new Lazy<number>(() => 2);
			const outer = new Lazy<Lazy<number>>(() => inner);
			const outer_value: Lazy<number> = outer.force();
			assert.ok(outer.isEvald);
			assert.ok(!inner.isEvald);
			return assert.strictEqual(outer_value, inner);
		});
	});


	test.suite('#map', () => {
		test.test('maps source value.', () => {
			assert.strictEqual(new Lazy<number>(() => 2).map((x) => x + 3).force(), 2 + 3);
		});
		test.test('chaining.', () => {
			const chain: Lazy<number> = new Lazy<number>(() => 2).map((x) => x + 3).map((x) => x * 5);
			assert.ok(!chain.isEvald);
			return assert.strictEqual(chain.force(), (2 + 3) * 5);
		});
		test.test('mapping already-evald source does not force mapped.', () => {
			const source = new Lazy<number>(() => 2);
			assert.ok(!source.isEvald);
			source.force();
			assert.ok(source.isEvald);
			return assert.ok(!source.map<number>((x) => x + 3).isEvald);
		});
		test.test('forcing source does not force result.', () => {
			const source = new Lazy<number>(() => 2);
			const result: Lazy<number> = source.map<number>((x) => x + 3);
			assert.ok(!source.isEvald);
			assert.ok(!result.isEvald);
			source.force();
			assert.ok(source.isEvald);
			assert.ok(!result.isEvald);
		});
		test.test('forcing result does force source.', () => {
			const source = new Lazy<number>(() => 2);
			const result: Lazy<number> = source.map<number>((x) => x + 3);
			assert.ok(!source.isEvald);
			assert.ok(!result.isEvald);
			result.force();
			assert.ok(result.isEvald);
			assert.ok(source.isEvald);
		});
		test.test('multiple separate #map calls.', () => {
			const source = new Lazy<number>(() => 2);
			const a: Lazy<number> = source.map((x) => x + 3);
			const b: Lazy<number> = source.map((x) => x + 5);
			source.force();
			assert.ok(!a.isEvald);
			assert.ok(!b.isEvald);
			assert.strictEqual(a.force(), 2 + 3);
			assert.strictEqual(b.force(), 2 + 5);
		});
		test.test('already evald: invokes callback immediately.', () => {
			let called = false;
			const source = new Lazy<number>(() => 2);
			source.force();
			source.map(() => {
				called = true;
			});
			return assert.ok(called);
		});
		test.test('not yet evald: defers callback invocation until result is forced.', () => {
			let called = false;
			let returned = 'hello';
			const source = new Lazy<number>(() => 2);
			const result: Lazy<string> = source.map(() => {
				called = true;
				return returned;
			});
			assert.ok(!called);
			returned = 'world';
			source.force();
			assert.ok(!called);
			result.force();
			assert.ok(called);
			return assert.strictEqual(result.force(), 'world');
		});
		test.test('performs callbacks in the same order #force is called.', () => {
			const calls: string[] = [];
			const source = new Lazy<number>(() => 2);
			const a: Lazy<number> = source.map((x) => {
				calls.push('a');
				return x + 3;
			});
			const b: Lazy<number> = source.map((x) => {
				calls.push('b');
				return x + 5;
			});
			source.force();
			b.force();
			a.force();
			return assert.deepStrictEqual(calls, ['b', 'a']);
		});
	});


	test.suite('#flatmap', () => {
		test.test('is ‘associative’: `ma >>= λx . (f(x) >>= g) == (ma >>= f) >>= g`.', () => {
			const f: (x: number) => Lazy<number> = (x) => new Lazy<number>(() => x + 3);
			const g: (x: number) => Lazy<number> = (x) => new Lazy<number>(() => x * 5);
			assert.strictEqual(
				new Lazy(() => 2).flatMap((x) => f(x).flatMap(g)).force(),
				new Lazy(() => 2).flatMap(f).flatMap(g).force(),
			);
		});
		test.test('already evald: invokes callback immediately.', () => {
			let called = false;
			Lazy.of<number>(2).flatMap(() => {
				called = true;
				return new Lazy<void>(() => undefined);
			});
			return assert.ok(called);
		});
		test.test('not yet evald: defers callback invocation until result is forced.', () => {
			let called = false;
			let returned = 'hello';
			const source = new Lazy<number>(() => 2);
			const result: Lazy<string> = source.flatMap(() => {
				called = true;
				return new Lazy<string>(() => returned);
			});
			assert.ok(!called);
			returned = 'world';
			source.force();
			assert.ok(!called);
			result.force();
			assert.ok(called);
			return assert.strictEqual(result.force(), 'world');
		});
		test.test('when already evald, returns the callback’s return value by reference (whether evald or not).', () => {
			const cb_return_evald   = Lazy.of<string>('hello');
			const cb_return_unevald = new Lazy<string>(() => 'world');
			assert.strictEqual(Lazy.of<number>(2).flatMap<string>(() => cb_return_evald),   cb_return_evald);
			assert.strictEqual(Lazy.of<number>(2).flatMap<string>(() => cb_return_unevald), cb_return_unevald);
		});
		test.test('when not yet evald, forces the callback return, and returns a new unevald Lazy.', () => {
			const cb_return: Lazy<number> = Lazy.of<number>(2);
			const result:    Lazy<number> = new Lazy<string>(() => 'hello').flatMap(() => cb_return);
			assert.ok(cb_return.isEvald);
			assert.notStrictEqual(result, cb_return);
			assert.ok(!result.isEvald);
			return assert.strictEqual(result.force(), 2);
		});
		test.test('forcing source does not force result.', () => {
			const source = new Lazy<number>(() => 2);
			const result: Lazy<string> = source.flatMap<string>(() => new Lazy<string>(() => 'hello'));
			assert.ok(!source.isEvald);
			assert.ok(!result.isEvald);
			source.force();
			assert.ok(source.isEvald);
			assert.ok(!result.isEvald);
		});
		test.test('forcing result does force source.', () => {
			const source = new Lazy<number>(() => 2);
			const result: Lazy<string> = source.flatMap<string>(() => new Lazy<string>(() => 'hello'));
			assert.ok(!source.isEvald);
			assert.ok(!result.isEvald);
			result.force();
			assert.ok(result.isEvald);
			assert.ok(source.isEvald);
		});
		test.test('upon forcing, forwards callback return’s value to result.', () => {
			const source = new Lazy<string>(() => 'hello');
			const result: Lazy<number> = source.flatMap<number>((text) => new Lazy<number>(() => text.length));
			source.force();
			return assert.strictEqual(result.force(), 5);
		});
	});


	test.suite('#flatten', () => {
		test.test('nested Lazys do not unwind on force.', () => {
			const outer: Lazy<Lazy<number>> = new Lazy<number>(() => 2).map<Lazy<number>>((x) => new Lazy<number>(() => x + 3));
			assert_instanceof(outer.force(), Lazy);
			return assert.strictEqual(outer.force().force(), 2 + 3);
		});
		test.test('returns a Lazy that will hold the first non-Lazy value in arbitrarily deep nesting.', () => {
			const inner = new Lazy<number>(() => 2);
			const outer: Lazy<Lazy<number>> = inner.map<Lazy<number>>((x) => new Lazy<number>(() => x + 3));
			const flat: Lazy<number> = outer.flatten();
			assert_instanceof(flat, Lazy);
			assert.notStrictEqual(flat, inner);
			assert.notStrictEqual(flat, outer.force());
			return assert.strictEqual(flat.force(), 2 + 3);
		});
		test.test('for already-evald Lazys with non-Lazy value, returns same reference.', () => {
			const lz: Lazy<number> = Lazy.of<number>(2);
			return assert.strictEqual(lz.flatten(), lz);
		});
		test.test('for already-evald Lazys with already-evald Lazy value, returns inner Lazy by reference.', () => {
			const lz:    Lazy<number> = Lazy.of<number>(2);
			const outer: Lazy<Lazy<number>> = Lazy.of<Lazy<number>>(lz);
			return assert.strictEqual(outer.flatten(), lz);
		});
		test.test('for already-evald Lazys with non-evald Lazy value, returns new Lazy.', () => {
			const lz = new Lazy<number>(() => 2);
			const outer: Lazy<Lazy<number>> = Lazy.of<Lazy<number>>(lz);
			assert.notStrictEqual(outer.flatten(), lz);
			assert_instanceof(outer.flatten(), Lazy);
			return assert.strictEqual(outer.flatten().force(), 2);
		});
		test.test('for unevald Lazys, returns new Lazy.', () => {
			const lz = new Lazy<number>(() => 2);
			const outer: Lazy<Lazy<number>> = new Lazy<Lazy<number>>(() => lz);
			assert.notStrictEqual(outer.flatten(), lz);
			assert_instanceof(outer.flatten(), Lazy);
			return assert.strictEqual(outer.flatten().force(), 2);
		});
	});


	test.suite('.of', () => {
		test.test('returns an already-evald Lazy.', () => {
			const lz: Lazy<number> = Lazy.of<number>(2);
			assert.ok(lz.isEvald);
			return assert.strictEqual(lz.force(), 2);
		});
	});


	test.suite('.whenAll', () => {
		test.test('returns an empty array when given an empty array.', () => {
			assert.deepStrictEqual(Lazy.whenAll<unknown>([]).force(), []);
		});
		test.test('none pre-evald.', () => {
			const lz: Lazy<number[]> = Lazy.whenAll<number>([
				new Lazy<number>(() => 2),
				new Lazy<number>(() => 3),
			]);
			assert.ok(!lz.isEvald);
			return assert.deepStrictEqual(lz.force(), [2, 3]);
		});
		test.test('some pre-evald.', () => {
			const lz: Lazy<number[]> = Lazy.whenAll<number>([
				Lazy.of<number>(2),
				new Lazy<number>(() => 3),
			]);
			assert.ok(!lz.isEvald);
			return assert.deepStrictEqual(lz.force(), [2, 3]);
		});
		test.test('all pre-evald.', () => {
			const lz: Lazy<number[]> = Lazy.whenAll<number>([
				Lazy.of<number>(2),
				Lazy.of<number>(3),
			]);
			assert.ok(!lz.isEvald);
			return assert.deepStrictEqual(lz.force(), [2, 3]);
		});
		test.test('forcing sources does not force result.', () => {
			const a = new Lazy<number>(() => 2);
			const b = new Lazy<number>(() => 3);
			const result: Lazy<number[]> = Lazy.whenAll<number>([a, b]);
			assert.ok(!a.isEvald);
			assert.ok(!b.isEvald);
			assert.ok(!result.isEvald);
			a.force();
			assert.ok(!result.isEvald);
			b.force();
			assert.ok(!result.isEvald);
		});
		test.test('forcing result does force all sources.', () => {
			const a = new Lazy<number>(() => 2);
			const b = new Lazy<number>(() => 3);
			const result: Lazy<number[]> = Lazy.whenAll<number>([a, b]);
			assert.ok(!a.isEvald);
			assert.ok(!b.isEvald);
			assert.ok(!result.isEvald);
			result.force();
			assert.ok(a.isEvald);
			assert.ok(b.isEvald);
		});
		test.test('mutating the array after calling `.whenAll` affects the result.', () => {
			const a = new Lazy<number>(() => 2);
			const b = new Lazy<number>(() => 3);
			const all: Array<Lazy<number>> = [a, b];
			const result: Lazy<number[]> = Lazy.whenAll<number>(all);
			all.push(new Lazy<number>(() => 4));
			return assert.deepStrictEqual(result.force(), [2, 3, 4]);
		});
	});


	test.suite('.whenAny', () => {
		test.test('none pre-evald.', () => {
			const lz: Lazy<number> = Lazy.whenAny<number>([
				new Lazy<number>(() => 2),
				new Lazy<number>(() => 3),
			]);
			assert.ok(!lz.isEvald);
			return assert.deepStrictEqual(lz.force(), 2);
		});
		test.test('some pre-evald.', () => {
			const lz: Lazy<number> = Lazy.whenAny<number>([
				new Lazy<number>(() => 2),
				Lazy.of<number>(3),
			]);
			assert.ok(!lz.isEvald);
			return assert.deepStrictEqual(lz.force(), 3);
		});
		test.test('all pre-evald.', () => {
			const lz: Lazy<number> = Lazy.whenAny<number>([
				Lazy.of<number>(2),
				Lazy.of<number>(3),
			]);
			assert.ok(!lz.isEvald);
			return assert.deepStrictEqual(lz.force(), 2);
		});
		test.test('always returns new Lazy object.', () => {
			const source: Lazy<number> = Lazy.of<number>(2);
			const lz: Lazy<number> = Lazy.whenAny<number>([source]);
			return assert.notStrictEqual(lz.force(), source);
		});
		test.test('forcing sources does not force result.', () => {
			const a = new Lazy<number>(() => 2);
			const b = new Lazy<number>(() => 3);
			const result: Lazy<number> = Lazy.whenAny<number>([a, b]);
			assert.ok(!a.isEvald);
			assert.ok(!b.isEvald);
			assert.ok(!result.isEvald);
			a.force();
			assert.ok(!result.isEvald);
			b.force();
			assert.ok(!result.isEvald);
		});
		test.test('if no sources pre-evald, forcing result does force first source.', () => {
			const a = new Lazy<number>(() => 2);
			const b = new Lazy<number>(() => 3);
			const result: Lazy<number> = Lazy.whenAny<number>([a, b]);
			assert.ok(!a.isEvald);
			assert.ok(!b.isEvald);
			assert.ok(!result.isEvald);
			result.force();
			assert.ok(a.isEvald);
			assert.ok(!b.isEvald);
		});
		test.test('if some sources pre-evald, forcing result does not force any sources.', () => {
			const a = new Lazy<number>(() => 2);
			const b = Lazy.of<number>(2);
			const result: Lazy<number> = Lazy.whenAny<number>([a, b]);
			assert.ok(!a.isEvald);
			assert.ok(b.isEvald);
			assert.ok(!result.isEvald);
			result.force();
			assert.ok(!a.isEvald);
			assert.ok(b.isEvald);
		});
	});
});
