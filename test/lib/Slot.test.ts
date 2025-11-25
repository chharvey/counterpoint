import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	assert_instanceof,
	Slot,
} from '../../src/index.ts';



test.suite('Slot', () => {
	test.suite('#fill', () => {
		test.test('sets value.', () => {
			const df = new Slot<number>();
			assert.ok(!df.isFilled);
			df.fill(10);
			return assert.ok(df.isFilled);
		});
		test.test('shunts #map callback.', () => {
			const df = new Slot<number>().map((x) => x + 5).map((x) => x * 2).fill(3);
			assert.ok(df.isFilled);
			return assert.strictEqual(df.unwrap(), 3);
		});
		test.test('filling after nesting.', () => {
			const inner = new Slot<number>();
			const outer: Slot<Slot<number>> = inner.map<Slot<number>>((x) => new Slot<number>(x + 3));
			assert.ok(!inner.isFilled);
			assert.ok(!outer.isFilled);
			inner.fill(2);
			assert.ok(outer.isFilled);
			const outer_value: Slot<number> = outer.unwrap();
			assert_instanceof(outer_value, Slot);
			assert.notStrictEqual(outer_value, inner);
			assert.ok(outer_value.isFilled);
			return assert.strictEqual(outer_value.unwrap(), 2 + 3);
		});
		test.test('outer Slot via constructor may be filled before inner fills.', () => {
			const inner = new Slot<number>();
			const outer = new Slot<Slot<number>>(inner.map((x) => x + 3));
			assert.ok(!inner.isFilled);
			assert.ok(outer.isFilled);
			const outer_value: Slot<number> = outer.unwrap();
			assert_instanceof(outer_value, Slot);
			assert.notStrictEqual(outer_value, inner);
			inner.fill(2);
			return assert.strictEqual(outer_value.unwrap(), 2 + 3);
		});
		test.test('forbids self-nesting.', () => {
			const self = new Slot<unknown>();
			return assert.throws(() => self.fill(self), /Cannot use self as value/);
		});
		test.test('performs callbacks in the same order #map is called.', () => {
			const calls: string[] = [];
			const source = new Slot<number>();
			source.map(() => {
				calls.push('a');
			});
			source.map(() => {
				calls.push('b');
			});
			source.fill(3);
			return assert.deepStrictEqual(calls, ['a', 'b']);
		});
	});


	test.suite('#map', () => {
		test.test('chaining after #fill.', () => {
			const source = new Slot<number>();
			source.fill(3);
			const chain: Slot<number> = source.map((x) => x + 5).map((x) => x * 2);
			assert.ok(chain.isFilled);
			return assert.strictEqual(chain.unwrap(), (3 + 5) * 2);
		});
		test.test('chaining before #fill.', () => {
			const source = new Slot<number>();
			const chain: Slot<number> = source.map((x) => x + 5).map((x) => x * 2);
			source.fill(3);
			assert.ok(chain.isFilled);
			return assert.strictEqual(chain.unwrap(), (3 + 5) * 2);
		});
		test.test('chaining with no fill.', () => {
			assert.ok(!new Slot<number>().map((x) => x + 5).map((x) => x * 2).isFilled);
		});
		test.test('multiple separate #map calls.', () => {
			const source = new Slot<number>();
			const a: Slot<number> = source.map((x) => x + 1);
			const b: Slot<number> = source.map((x) => x + 2);
			source.fill(3);
			assert.ok(a.isFilled);
			assert.ok(b.isFilled);
			assert.strictEqual(a.unwrap(), 3 + 1);
			assert.strictEqual(b.unwrap(), 3 + 2);
		});
		test.test('defers callback invocation until source is filled.', () => {
			const source = new Slot<number>();
			let called = false;
			source.map(() => {
				called = true;
			});
			assert.ok(!called);
			source.fill(3);
			return assert.ok(called);
		});
	});


	test.suite('#flatmap', () => {
		test.test('when already filled, returns the callback’s return value by reference (whether filled or not).', () => {
			const cb_return_filled = new Slot<string>('hello');
			const cb_return_empty  = new Slot<string>();
			assert.strictEqual(new Slot<number>(2).flatMap(() => cb_return_filled), cb_return_filled);
			assert.strictEqual(new Slot<number>(6).flatMap(() => cb_return_empty),  cb_return_empty);
		});
		test.test('when already empty, returns a new empty Slot.', () => {
			const cb_return = new Slot<number>(2);
			const result: Slot<number> = new Slot<string>().flatMap(() => cb_return);
			assert.ok(!result.isFilled);
			return assert.notStrictEqual(result, cb_return);
		});
		test.test('upon filling, forwards callback’s return’s filled value to result.', () => {
			let source = new Slot<string>();
			let result: Slot<number> = source.flatMap(() => new Slot<number>(2));
			assert.ok(!result.isFilled);
			source.fill('hello');
			assert.ok(result.isFilled);
			assert.strictEqual(result.unwrap(), 2);

			source = new Slot<string>();
			result = source.flatMap((text) => new Slot<number>(text.length));
			assert.ok(!result.isFilled);
			source.fill('hello');
			assert.ok(result.isFilled);
			return assert.strictEqual(result.unwrap(), 5);
		});
		test.test('upon filling, callback’s return is left unfilled.', () => {
			const source    = new Slot<string>();
			const cb_return = new Slot<number>();
			const result: Slot<number> = source.flatMap(() => cb_return);
			assert.ok(!result.isFilled);
			source.fill('hello');
			assert.ok(!result.isFilled);
			cb_return.fill(2);
			return assert.strictEqual(result.unwrap(), 2);
		});
		test.test('chains correctly; associativity holds.', () => {
			const f: (x: number) => Slot<number> = (x) => new Slot<number>(x / 2);
			const g: (x: number) => Slot<number> = (x) => new Slot<number>(x * 3 + 1);
			const source = new Slot<number>(2);
			const a: Slot<number> = source.flatMap(f).flatMap(g);
			const b: Slot<number> = source.flatMap((x) => f(x).flatMap(g));
			return assert.strictEqual(a.unwrap(), b.unwrap());
		});
		test.test('defers callback invocation until source is filled.', () => {
			const source = new Slot<string>();
			const dep    = new Slot<number>();
			let called   = false;
			source.flatMap((text) => {
				called = true;
				return dep.fill(text.length);
			});
			assert.ok(!called);
			assert.ok(!dep.isFilled);
			source.fill('hello');
			assert.ok(called);
			assert.ok(dep.isFilled);
			return assert.strictEqual(dep.unwrap(), 5);
		});
	});


	test.suite('#unwrap', () => {
		test.test('throws when Slot is empty.', () => {
			const ph = new Slot<number>();
			assert.ok(!ph.isFilled);
			return assert.throws(() => ph.unwrap(), /Slot is empty/);
		});
		test.test('nested Slots do not unwind on unwrap.', () => {
			const inner = new Slot<number>(2);
			const outer: Slot<Slot<number>> = inner.map<Slot<number>>((x) => new Slot<number>(x + 3));
			assert.ok(outer.isFilled);
			assert_instanceof(outer.unwrap(), Slot);
			return assert.strictEqual(outer.unwrap().unwrap(), 2 + 3);
		});
		test.test('can be called before and after filling.', () => {
			const ph = new Slot<number>();
			assert.throws(() => ph.unwrap(), /Slot is empty/);
			ph.fill(2);
			return assert.strictEqual(ph.unwrap(), 2);
		});
	});


	test.suite('#flatten', () => {
		test.test('returns a Slot that will hold the first non-Slot value in arbitrarily deep nesting.', () => {
			const inner = new Slot<number>(2);
			const outer: Slot<Slot<number>> = inner.map<Slot<number>>((x) => new Slot<number>(x + 3));
			const flat: Slot<number> = outer.flatten();
			assert_instanceof(flat, Slot);
			assert.notStrictEqual(flat, inner);
			assert.notStrictEqual(flat, outer.unwrap());
			return assert.strictEqual(flat.unwrap(), 2 + 3);
		});
		test.test('returns a new value even for already-flattened Slots.', () => {
			const flat = new Slot<number>(2);
			const flat_flattened: Slot<number> = flat.flatten();
			assert.notStrictEqual(flat_flattened, flat);
			return assert.strictEqual(flat_flattened.unwrap(), 2);
		});
		test.test('when unwrapped, throws when outer is filled but inner is not.', () => {
			const inner = new Slot<number>();
			const outer = new Slot<Slot<number>>(inner.map((x) => x + 3));
			assert.ok(!inner.isFilled);
			assert.ok(outer.isFilled);
			const flat: Slot<number> = outer.flatten();
			return assert.throws(() => flat.unwrap(), /Slot is empty/);
		});
		test.test('crashes with mutually-recursive Slots.', () => {
			const a = new Slot<unknown>();
			const b = new Slot<unknown>(a);
			a.fill(b);
			return assert.throws(() => a.flatten(), /Maximum call stack size exceeded/);
		});
	});


	test.suite('.unwrapAll', () => {
		test.test('never throws when called.', () => {
			Slot.unwrapAll([
				new Slot<number>(1),
				new Slot<number>(2),
			]); // all filled // assert does not throw
			Slot.unwrapAll([
				new Slot<number>(1),
				new Slot<number>(),
			]); // some filled // assert does not throw
			Slot.unwrapAll([
				new Slot<number>(),
				new Slot<number>(),
			]); // all empty // assert does not throw
		});
		test.test('returns an empty array when given an empty array.', () => {
			assert.deepStrictEqual(Slot.unwrapAll([]).unwrap(), []);
		});
		test.test('no Slots are ever filled.', () => {
			assert.ok(!Slot.unwrapAll([
				new Slot<number>(),
				new Slot<number>(),
				new Slot<number>(),
			]).isFilled);
		});
		test.test('all Slots are pre-filled.', () => {
			assert.deepStrictEqual(Slot.unwrapAll([
				new Slot<number>(1),
				new Slot<number>(2),
				new Slot<number>(3),
			]).unwrap(), [1, 2, 3]);
		});
		test.test('some Slots are filled later.', () => {
			const a = new Slot<number>();
			const b = new Slot<number>();
			const c = new Slot<number>();
			const result: Slot<number[]> = Slot.unwrapAll([a, b, c]);

			a.fill(1);
			assert.ok(!result.isFilled);
			b.fill(2);
			assert.ok(!result.isFilled);
			c.fill(3);
			assert.ok(result.isFilled);
			return assert.deepStrictEqual(result.unwrap(), [1, 2, 3]);
		});
		test.test('order is preserved when filling out of order.', () => {
			const a = new Slot<number>();
			const b = new Slot<number>();
			const c = new Slot<number>();
			const result: Slot<number[]> = Slot.unwrapAll([a, b, c]);

			a.fill(1);
			c.fill(3);
			b.fill(2);
			return assert.deepStrictEqual(result.unwrap(), [1, 2, 3]);
		});
	});


	test.suite('.unwrapAny', () => {
		test.test('never throws when given a nonempty array.', () => {
			Slot.unwrapAny([
				new Slot<number>(1),
				new Slot<number>(2),
			]); // all filled // assert does not throw
			Slot.unwrapAny([
				new Slot<number>(1),
				new Slot<number>(),
			]); // some filled // assert does not throw
			Slot.unwrapAny([
				new Slot<number>(),
				new Slot<number>(),
			]); // all empty // assert does not throw
		});
		test.test('returns an empty Slot when given an empty array.', () => {
			assert.ok(!Slot.unwrapAny([]).isFilled);
		});
		test.test('no Slots are ever filled.', () => {
			assert.ok(!Slot.unwrapAny([
				new Slot<number>(),
				new Slot<number>(),
				new Slot<number>(),
			]).isFilled);
		});
		test.test('some Slots are pre-filled.', () => {
			assert.deepStrictEqual(Slot.unwrapAny([
				new Slot<number>(),
				new Slot<number>(2),
				new Slot<number>(3),
			]).unwrap(), 2);
		});
		test.test('some Slots are filled later.', () => {
			const a = new Slot<number>();
			const b = new Slot<number>();
			const c = new Slot<number>();
			const result: Slot<number> = Slot.unwrapAny([a, b, c]);

			a.fill(1);
			assert.ok(result.isFilled);
			assert.deepStrictEqual(result.unwrap(), 1);
			b.fill(2);
			assert.deepStrictEqual(result.unwrap(), 1);
			c.fill(3);
			return assert.deepStrictEqual(result.unwrap(), 1);
		});
		test.test('takes first filled value, even out of order.', () => {
			const a = new Slot<number>();
			const b = new Slot<number>();
			const c = new Slot<number>();
			const result: Slot<number> = Slot.unwrapAny([a, b, c]);

			b.fill(2);
			a.fill(1);
			c.fill(3);
			return assert.deepStrictEqual(result.unwrap(), 2);
		});
	});
});
