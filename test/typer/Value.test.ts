import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	VALUE,
	BinVect,
} from '../../src/index.js';
import {assertEqualBins} from '../assert-helpers.js';
import {buildConst} from '../helpers.js';



describe('Value', () => {
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
				])), '["earth", "wind", "fire"] === ["earth", "wind", "fire"]');
			});
		});

		describe('Record', () => {
			it('Records with the same itesm are identical.', () => {
				assert.ok(new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				])).identical(new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				]))), '[a= "earth", b= "wind", c= "fire"] === [a= "earth", b= "wind", c= "fire"]');
			});
		});
	});


	describe('#equal', () => {
		describe('Tuple', () => {
			it('Tuples are equal if they have the same items.', () => {
				const t = new VALUE.Tuple<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				]);
				assert.ok(t.equal(new VALUE.Tuple<VALUE.String>([
					new VALUE.String('earth'),
					new VALUE.String('wind'),
					new VALUE.String('fire'),
				])), 't == ["earth", "wind", "fire"]');
			});
		});

		describe('Record', () => {
			it('Records are equal if they have the same properties.', () => {
				const r = new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				]));
				assert.ok(r.equal(new VALUE.Record<VALUE.String>(new Map<bigint, VALUE.String>([
					[0x100n, new VALUE.String('earth')],
					[0x101n, new VALUE.String('wind')],
					[0x102n, new VALUE.String('fire')],
				]))), 'r == [a= "earth", b= "wind", c= "fire"]');
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
				const mod = new binaryen.Module();
				return assertEqualBins(
					VALUE.NULL.build(mod),
					new BinVect(mod, null).vect,
				);
			});
		});

		specify('Boolean', () => {
			const mod = new binaryen.Module();
			return assertEqualBins(
				[VALUE.FALSE.build(mod),       VALUE.TRUE.build(mod)],
				[new BinVect(mod, false).vect, new BinVect(mod, true).vect],
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
				const mod = new binaryen.Module();
				return assertEqualBins(
					data.map((x) => new VALUE.Integer(x).build(mod)),
					data.map((x) => new BinVect(mod, mod.i32.const(Number(x))).vect),
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
				const mod = new binaryen.Module();
				return assertEqualBins(
					data.map((x) => new VALUE.Float(x).build(mod)),
					data.map((x) => new BinVect(mod, mod.f64.const(x)).vect),
				);
			});
			it('builds `0.0` and `-0.0` differently.', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					[0.0, -0.0].map((x) => new VALUE.Float(x).build(mod)),
					[mod.f64.const(0.0), mod.f64.ceil(mod.f64.const(-0.5))].map((c) => new BinVect(mod, c).vect),
				);
			});
		});

		describe.skip('String', () => {
			specify('#build', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					new VALUE.String('hello world').build(mod),
					buildConst(mod, 0n),
				);
			});
		});

		describe('Tuple', () => {
			it('returns `(tuple.make)`.', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					new VALUE.Tuple([VALUE.INT_1,        new VALUE.Float(2.0)]).build(mod),
					mod.tuple.make([buildConst(mod, 1n), buildConst(mod, 2.0)]),
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
