import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	VALUE,
	bigint_to_i64,
	CodeGenerator,
} from '../../src/index.ts';
import {assertEqualBins} from '../utils.ts';



test.suite('Value', () => {
	test.suite('#identical', () => {
		test.suite('Tuple', () => {
			test.test('Tuples with the same items are identical.', () => {
				assert.ok(new VALUE.Tuple<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				]).identical(new VALUE.Tuple<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				])), '("earth", "wind", "fire") === ("earth", "wind", "fire")');
			});
		});

		test.suite('Record', () => {
			test.test('Records with the same items are identical.', () => {
				assert.ok(new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				])).identical(new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				]))), '(a= "earth", b= "wind", c= "fire") === (a= "earth", b= "wind", c= "fire")');
			});
		});

		test.suite('List', () => {
			test.test('Lists with the same items are not identical.', () => {
				assert.ok(!new VALUE.List<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				]).identical(new VALUE.List<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				])), '["earth", "wind", "fire"] !== ["earth", "wind", "fire"]');
			});
		});

		test.suite('Dict', () => {
			test.test('Dicts with the same items are not identical.', () => {
				assert.ok(!new VALUE.Dict<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				])).identical(new VALUE.Dict<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				]))), '[a= "earth", b= "wind", c= "fire"] !== [a= "earth", b= "wind", c= "fire"]');
			});
		});
	});


	test.suite('#equal', () => {
		test.suite('CollectionIndexed', () => {
			test.test('Tuples and Lists are not equal even if they have the same items.', () => {
				const tuple = new VALUE.Tuple<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				]);
				const list = new VALUE.List<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				]);
				assert.ok(!tuple.equal(list), '("earth", "wind", "fire") != ["earth", "wind", "fire"]');
				assert.ok(!list.equal(tuple), '["earth", "wind", "fire"] != ("earth", "wind", "fire")');
			});
		});
		test.suite('CollectionKeyed', () => {
			test.test('Records and Dicts are not equal even if they have the same properties.', () => {
				const record = new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				]));
				const dict = new VALUE.Dict<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x102n, new VALUE.String('fire')],
					[0x101n, new VALUE.String('wind')],
				]));
				assert.ok(!record.equal(dict), '(a= "earth", b= "wind", c= "fire") != [a= "earth", c= "fire", b= "wind"]');
				assert.ok(!dict.equal(record), '[a= "earth", c= "fire", b= "wind"] != (a= "earth", b= "wind", c= "fire")');
			});
		});

		test.suite('Tuple', () => {
			test.test('Tuples are equal if they have the same items.', () => {
				assert.ok(new VALUE.Tuple<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				]).equal(new VALUE.Tuple<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				])), '("earth", "wind", "fire") == ("earth", "wind", "fire")');
			});
		});

		test.suite('Record', () => {
			test.test('Records are equal if they have the same properties.', () => {
				assert.ok(new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				])).equal(new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x102n, new VALUE.String('fire')],
					[0x101n, new VALUE.String('wind')],
				]))), '(a= "earth", b= "wind", c= "fire") == (a= "earth", c= "fire", b= "wind")');
			});
		});

		test.suite('List', () => {
			test.test('Lists are equal if they have the same items.', () => {
				assert.ok(new VALUE.List<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				]).equal(new VALUE.List<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				])), '["earth", "wind", "fire"] == ["earth", "wind", "fire"]');
			});
			test.test.todo('Lists may contain circular references.', () => {
				// TODO: need an interpreter to test this
				`
					val a: mut List.<List.<Object>> = List.<List.<Object>>(());
					val b: mut List.<List.<Object>> = List.<List.<Object>>(());
					a.append.(b);
					b.append.(a);
					assert.equal.(a, b);
					assert.equal.(b, a);
				`;
			});
		});

		test.suite('Dict', () => {
			test.test('Dicts are equal if they have the same properties.', () => {
				assert.ok(new VALUE.Dict<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				])).equal(new VALUE.Dict<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x102n, new VALUE.String('fire')],
					[0x101n, new VALUE.String('wind')],
				]))), '[a= "earth", b= "wind", c= "fire"] == [a= "earth", c= "fire", b= "wind"]');
			});
			test.test.todo('Dicts may contain circular references.', () => {
				// TODO: need an interpreter to test this
				`
					val a: mut Dict.<anything> = [x= null];
					val b: mut Dict.<anything> = [x= null];
					a.set.(@x, b);
					b.set.(@x, a);
					assert.equal.(a, b);
					assert.equal.(b, a);
				`;
			});
		});

		test.suite('Set', () => {
			test.test('return false if sets have different counts.', () => {
				assert.ok(!new VALUE.Set<VALUE.String>(new Set([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				])).equal(new VALUE.Set<VALUE.String>(new Set([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
					new VALUE.String('water'),
				]))));
			});
			test.test('returns true if sets contain equal elements.', () => {
				assert.ok(new VALUE.Set<VALUE.String>(new Set([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				])).equal(new VALUE.Set<VALUE.String>(new Set([
					new VALUE.String('earth'),
					new VALUE.String('fire'),
					new VALUE.String('wind'),
				]))));
			});
		});
	});


	test.suite('#codegen', () => {
		test.test('Null', () => {
			const cg = new CodeGenerator();
			return assertEqualBins(
				VALUE.NULL.codegen(cg),
				cg.vm.Value.newPrimitive(cg.vm.Vect.NULL),
			);
		});

		test.test('Boolean', () => {
			const cg = new CodeGenerator();
			return assertEqualBins([
				VALUE.FALSE.codegen(cg),
				VALUE.TRUE .codegen(cg),
			], [
				cg.vm.Value.newPrimitive(cg.vm.Vect.FALSE),
				cg.vm.Value.newPrimitive(cg.vm.Vect.TRUE),
			]);
		});

		test.test('Symbol', () => {
			const cg = new CodeGenerator();
			const {vm: {Vect, Value}, mod} = cg;
			return assertEqualBins([
				VALUE.SYM_NOTHING.codegen(cg),
				new VALUE.Symbol(0x100n, 'hello').codegen(cg),
			], [
				Value.newPrimitive(Vect.newNat(bigint_to_i64(mod, 0x80n))),
				Value.newPrimitive(Vect.newNat(bigint_to_i64(mod, 0x100n))),
			]);
		});

		test.test('Integer', () => {
			const data: bigint[] = [
				42n + -420n,
				...[
					+126 /  3,
					-126 /  3,
					+126 / -3,
					-126 / -3,
					+200 /  3,
					+200 / -3,
					-200 /  3,
					-200 / -3,
				].map((x) => BigInt(Math.trunc(x))),
				(42n ** 2n * 420n) % (2n ** 63n),
				(-5n) ** (2n * 3n),
			];
			const cg = new CodeGenerator();
			const {vm: {Vect, Value}, mod} = cg;
			return assertEqualBins(
				data.map((x) => new VALUE.Integer(x).codegen(cg)),
				data.map((x) => Value.newPrimitive(Vect.newInt(bigint_to_i64(mod, x)))),
			);
		});

		test.test('Natural', () => {
			const data: bigint[] = [
				...[
					+126 / +3,
					+200 / +3,
				].map((x) => BigInt(Math.trunc(x))),
				(42n ** 2n * 420n) % (2n ** 64n),
			];
			const cg = new CodeGenerator();
			const {vm: {Vect, Value}, mod} = cg;
			return assertEqualBins(
				data.map((x) => new VALUE.Natural(x).codegen(cg)),
				data.map((x) => Value.newPrimitive(Vect.newNat(bigint_to_i64(mod, x, true)))),
			);
		});

		test.suite('Float', () => {
			test.test('generates `(f64.const)`.', () => {
				/* eslint-disable @stylistic/array-element-newline */
				const data: number[] = [
					55, -55, 33, -33, 2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					6.8, 6.8,
					3.0 - 2.7,
				];
				/* eslint-enable @stylistic/array-element-newline */
				const cg = new CodeGenerator();
				const {vm: {Vect, Value}, mod} = cg;
				return assertEqualBins(
					data.map((x) => new VALUE.Float(x).codegen(cg)),
					data.map((x) => Value.newPrimitive(Vect.newFloat(mod.f64.const(x)))),
				);
			});
			test.test('builds `0.0` and `-0.0` differently.', () => {
				const cg = new CodeGenerator();
				const {vm: {Vect, Value}, mod} = cg;
				return assertEqualBins(
					[0.0, -0.0].map((x) => new VALUE.Float(x).codegen(cg)),
					[mod.f64.const(0.0), mod.f64.ceil(mod.f64.const(-0.5))].map((c) => Value.newPrimitive(Vect.newFloat(c))),
				);
			});
		});

		test.test('String', () => {
			const cg = new CodeGenerator();
			const {vm: {Value}, mod} = cg;
			return assertEqualBins(
				new VALUE.String('hello').codegen(cg),
				Value.newComposite(cg.codegenString([0x68, 0x65, 0x6c, 0x6c, 0x6f].map((c) => mod.i32.const(c)))),
			);
		});
	});


	test.suite('Set', () => {
		test.suite('.constructor', () => {
			test.test('overwrites identical elements.', () => {
				assert.deepStrictEqual(
					new VALUE.Set(new Set([
						new VALUE.String('a'),
						VALUE.INT_0,
						new VALUE.Integer(-0n),
					])),
					new VALUE.Set(new Set([
						new VALUE.String('a'),
						VALUE.INT_0,
					])),
				);
			});
			test.test('does not overwrite non-identical (even if equal) elements.', () => {
				assert.strictEqual(new VALUE.Set(new Set([
					VALUE.FLOAT_0,
					VALUE.FLOAT_N0,
				])).count, 2n);
			});
		});

		test.suite('#get', () => {
			test.test('compares by identity, not equality', () => {
				const tuples = new VALUE.Set(new Set([new VALUE.Tuple()]));
				assert.strictEqual(tuples.get(new VALUE.Tuple()), VALUE.TRUE, 'returns true when testing identical value types.');

				const lists = new VALUE.Set(new Set([new VALUE.List()]));
				assert.strictEqual(lists.get(new VALUE.List()), VALUE.FALSE, 'returns false when testing non-identical, even if equal, reference types.');

				const floats = new VALUE.Set(new Set([VALUE.FLOAT_0]));
				assert.strictEqual(floats.get(VALUE.FLOAT_N0), VALUE.FALSE, 'returns false when testing non-identical, even if equal, value types (floating zeros are the only case of this).');
			});
		});
	});


	test.suite('Number', () => {
		test.suite('#toInt', () => {
			test.test('Integer', () => {
				const i = new VALUE.Integer(42n);
				assert.strictEqual(i.toInt(), i, 'should return self.');
			});
			test.test('Natural', () => {
				assert.deepStrictEqual(new VALUE.Natural(42n).toInt(), new VALUE.Integer(42n), 'for values less than *2 ^ 63 - 1*, should return equal value.');
				assert.deepStrictEqual(new VALUE.Natural(2n ** 63n + 1n).toInt(), new VALUE.Integer(-(2n ** 63n) + 1n), 'for values *2 ^ 63* or greater, should overflow.');
			});
			test.test('Float', () => {
				assert.deepStrictEqual(new VALUE.Float(42.69).toInt(), new VALUE.Integer(42n), 'should truncate (round-to-zero).');
			});
		});

		test.suite('#toNat', () => {
			test.test('Integer', () => {
				assert.deepStrictEqual(new VALUE.Integer(42n).toNat(), new VALUE.Natural(42n), 'for positive values, should return equal value.');
				assert.deepStrictEqual(new VALUE.Integer(-69n).toNat(), new VALUE.Natural(-69n + 2n ** 64n), 'for negative values, should underflow.');
			});
			test.test('Natural', () => {
				const n = new VALUE.Natural(42n);
				assert.strictEqual(n.toNat(), n, 'should return self.');
			});
			test.test('Float', () => {
				assert.deepStrictEqual(new VALUE.Float(42.69).toNat(), new VALUE.Natural(42n), 'for positive values, should truncate (round-to-zero).');
				assert.deepStrictEqual(new VALUE.Float(-42.69).toNat(), new VALUE.Natural(0n), 'for negative values, should return zero.');
			});
		});

		test.suite('#toFloat', () => {
			test.test('Integer', () => {
				assert.deepStrictEqual(new VALUE.Integer(42n).toFloat(), new VALUE.Float(42), 'should return an equal value.');
			});
			test.test('Natural', () => {
				assert.deepStrictEqual(new VALUE.Natural(42n).toFloat(), new VALUE.Float(42), 'should return an equal value.');
			});
			test.test('Float', () => {
				const f = new VALUE.Float(42.69);
				assert.strictEqual(f.toFloat(), f, 'should return self.');
			});
		});
	});


	test.suite('Natural', () => {
		test.suite('.constructor', () => {
			test.test('underflows when argument is negative.', () => {
				assert.strictEqual(new VALUE.Natural(-3n).toBigInt(), 2n ** 64n - 3n);
			});
		});
	});


	test.suite('Map', () => {
		test.suite('.constructor', () => {
			test.test('overwrites identical antecedents.', () => {
				assert.deepStrictEqual(
					new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
						[new VALUE.String('a'),  VALUE.INT_1],
						[VALUE.INT_0,            new VALUE.Float(2.0)],
						[new VALUE.Integer(-0n), new VALUE.String('three')],
					])),
					new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
						[new VALUE.String('a'), VALUE.INT_1],
						[VALUE.INT_0,           new VALUE.String('three')],
					])),
				);
			});
			test.test('does not overwrite non-identical (even if equal) antecedents.', () => {
				assert.deepStrictEqual(
					new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
						[new VALUE.String('a'), VALUE.INT_1],
						[new VALUE.Float(0.0),  new VALUE.Float(2.0)],
						[new VALUE.Float(-0.0), new VALUE.String('three')],
					])),
					new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
						[new VALUE.String('a'), new VALUE.Integer(1n)],
						[new VALUE.Float(0.0),  new VALUE.Float(2.0)],
						[new VALUE.Float(-0.0), new VALUE.String('three')],
					])),
				);
			});
		});
	});
});
