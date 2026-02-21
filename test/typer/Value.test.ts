import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	IR,
	Builder,
	BinVect,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {buildConst} from '../helpers.ts';



describe('Value', () => {
	describe('#lower', () => {
		it('Primitive returns an IR.Constant.', () => {
			xjs.Array.forEachAggregated<VALUE.Primitive>([
				VALUE.NULL,
				VALUE.FALSE,
				VALUE.SYM_NEVER,
				VALUE.INT_0,
				VALUE.FLOAT_0,
				VALUE.STR_EMPTY,
			], (value) => assert.deepStrictEqual(value.lower(), new IR.Constant(value), value.constructor.name));
		});

		xjs.Array.forEachAggregated<VALUE.Value>([
			new VALUE.Tuple([VALUE.NULL]),
			new VALUE.Record(new Map([[0x100n, VALUE.NULL]])),
			new VALUE.List([VALUE.NULL]),
			new VALUE.Dict(new Map([[0x100n, VALUE.NULL]])),
			new VALUE.Set(new Set([VALUE.NULL])),
			new VALUE.Map(new Map([[VALUE.FALSE, VALUE.TRUE]])),
		], (value) => {
			it(value.constructor.name, () => {
				assert.throws(() => value.lower(), /not yet supported/);
			});
		});
	});


	describe('#identical', () => {
		describe('Tuple', () => {
			it('Tuples with the same items are identical.', () => {
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

		describe('Record', () => {
			it('Records with the same items are identical.', () => {
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

		describe('List', () => {
			it('Lists with the same items are not identical.', () => {
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

		describe('Dict', () => {
			it('Dicts with the same items are not identical.', () => {
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


	describe('#equal', () => {
		describe('CollectionIndexed', () => {
			it('Tuples and Lists are not equal even if they have the same items.', () => {
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
		describe('CollectionKeyed', () => {
			it('Records and Dicts are not equal even if they have the same properties.', () => {
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

		describe('Tuple', () => {
			it('Tuples are equal if they have the same items.', () => {
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

		describe('Record', () => {
			it('Records are equal if they have the same properties.', () => {
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

		describe('List', () => {
			it('Lists are equal if they have the same items.', () => {
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
			it.skip('Lists may contain circular references.', () => {
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

		describe('Dict', () => {
			it('Dicts are equal if they have the same properties.', () => {
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
			it.skip('Dicts may contain circular references.', () => {
				`
					val a: mut Dict.<Dict.<unknown>> = Dict.<Dict.<unknown>>((x= null));
					val b: mut Dict.<Dict.<unknown>> = Dict.<Dict.<unknown>>((x= null));
					a.set.(@y, b);
					b.set.(@y, a);
					assert.equal.(a, b);
					assert.equal.(b, a);
				`;
			});
		});

		describe('Set', () => {
			it('return false if sets have different counts.', () => {
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
			it('returns true if sets contain equal elements.', () => {
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


	describe('#build', () => {
		describe('Null', () => {
			it('returns a v128 with `null` as an argument.', () => {
				const builder = new Builder();
				return assertEqualBins(
					VALUE.NULL.build(builder),
					new BinVect(builder.module).vect,
				);
			});
		});

		specify('Boolean', () => {
			const builder = new Builder();
			return assertEqualBins(
				[VALUE.FALSE.build(builder),              VALUE.TRUE.build(builder)],
				[new BinVect(builder.module, false).vect, new BinVect(builder.module, true).vect],
			);
		});

		specify('Symbol', () => {
			const builder = new Builder();
			const mod: binaryen.Module = builder.module;
			return assertEqualBins(
				[VALUE.SYM_NEVER.build(builder),             new VALUE.Symbol(0x100n, 'hello').build(builder)],
				[new BinVect(mod, mod.i32.const(0x80)).vect, new BinVect(mod, mod.i32.const(0x100)).vect],
			);
		});

		describe('Integer', () => {
			it('generates `(i32.const)`.', () => {
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
					(42n ** 2n * 420n) % (2n ** 16n),
					(-5n) ** (2n * 3n),
				];
				const builder = new Builder();
				return assertEqualBins(
					data.map((x) => new VALUE.Integer(x).build(builder)),
					data.map((x) => new BinVect(builder.module, builder.module.i32.const(Number(x))).vect),
				);
			});
		});

		describe('Float', () => {
			it('generates `(f64.const)`.', () => {
				/* eslint-disable @stylistic/array-element-newline */
				const data: number[] = [
					55, -55, 33, -33, 2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					6.8, 6.8,
					3.0 - 2.7,
				];
				/* eslint-enable @stylistic/array-element-newline */
				const builder = new Builder();
				return assertEqualBins(
					data.map((x) => new VALUE.Float(x).build(builder)),
					data.map((x) => new BinVect(builder.module, builder.module.f64.const(x)).vect),
				);
			});
			it('builds `0.0` and `-0.0` differently.', () => {
				const builder = new Builder();
				const mod: binaryen.Module = builder.module;
				return assertEqualBins(
					[0.0, -0.0].map((x) => new VALUE.Float(x).build(builder)),
					[mod.f64.const(0.0), mod.f64.ceil(mod.f64.const(-0.5))].map((c) => new BinVect(mod, c).vect),
				);
			});
		});

		describe.skip('String', () => {
			specify('#build', () => {
				const builder = new Builder();
				return assertEqualBins(
					new VALUE.String('hello world').build(builder),
					buildConst(builder, 0n),
				);
			});
		});
	});


	describe('Set', () => {
		describe('.constructor', () => {
			it('overwrites identical elements.', () => {
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
			it('does not overwrite non-identical (even if equal) elements.', () => {
				assert.strictEqual(new VALUE.Set(new Set([
					VALUE.FLOAT_0,
					VALUE.FLOAT_N0,
				])).count, 2n);
			});
		});

		describe('#get', () => {
			it('compares by identity, not equality', () => {
				const tuples = new VALUE.Set(new Set([new VALUE.Tuple()]));
				assert.strictEqual(tuples.get(new VALUE.Tuple()), VALUE.TRUE, 'returns true when testing identical value types.');

				const lists = new VALUE.Set(new Set([new VALUE.List()]));
				assert.strictEqual(lists.get(new VALUE.List()), VALUE.FALSE, 'returns false when testing non-identical, even if equal, reference types.');

				const floats = new VALUE.Set(new Set([VALUE.FLOAT_0]));
				assert.strictEqual(floats.get(VALUE.FLOAT_N0), VALUE.FALSE, 'returns false when testing non-identical, even if equal, value types (floating zeros are the only case of this).');
			});
		});
	});


	describe('Map', () => {
		describe('.constructor', () => {
			it('overwrites identical antecedents.', () => {
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
			it('does not overwrite non-identical (even if equal) antecedents.', () => {
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
