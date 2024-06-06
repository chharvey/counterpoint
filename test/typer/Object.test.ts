import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	OBJ,
	BinVect,
} from '../../src/index.js';
import {assertEqualBins} from '../assert-helpers.js';
import {buildConst} from '../helpers.js';



describe('Object', () => {
	describe('#identical', () => {
		describe('Tuple', () => {
			it('Tuples with the same items are identical.', () => {
				assert.ok(new OBJ.Tuple<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				]).identical(new OBJ.Tuple<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])), '["earth", "wind", "fire"] === ["earth", "wind", "fire"]');
			});
		});

		describe('Record', () => {
			it('Records with the same itesm are identical.', () => {
				assert.ok(new OBJ.Record<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				])).identical(new OBJ.Record<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]))), '[a= "earth", b= "wind", c= "fire"] === [a= "earth", b= "wind", c= "fire"]');
			});
		});
	});


	describe('#equal', () => {
		describe('Tuple', () => {
			it('Tuples are equal if they have the same items.', () => {
				const t = new OBJ.Tuple<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				]);
				assert.ok(t.equal(new OBJ.Tuple<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])), 't == ["earth", "wind", "fire"]');
			});
		});

		describe('Record', () => {
			it('Records are equal if they have the same properties.', () => {
				const r = new OBJ.Record<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]));
				assert.ok(r.equal(new OBJ.Record<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]))), 'r == [a= "earth", b= "wind", c= "fire"]');
			});
		});

		describe('Set', () => {
			it('return false if sets have different counts.', () => {
				assert.ok(!new OBJ.Set<OBJ.String>(new Set([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])).equal(new OBJ.Set<OBJ.String>(new Set([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
					new OBJ.String('water'),
				]))));
			});
			it('returns true if sets contain equal elements.', () => {
				assert.ok(new OBJ.Set<OBJ.String>(new Set([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])).equal(new OBJ.Set<OBJ.String>(new Set([
					new OBJ.String('earth'),
					new OBJ.String('fire'),
					new OBJ.String('wind'),
				]))));
			});
		});
	});


	describe('#build', () => {
		describe('Null', () => {
			it('returns a v128 with `null` as an argument.', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					OBJ.Null.NULL.build(mod),
					new BinVect(mod, null).vect,
				);
			});
		});

		specify('Boolean', () => {
			const mod = new binaryen.Module();
			return assertEqualBins(
				[OBJ.Boolean.FALSE.build(mod), OBJ.Boolean.TRUE.build(mod)],
				[new BinVect(mod, false).vect, new BinVect(mod, true).vect],
			);
		});

		describe('Integer', () => {
			it('generates `(i32.const)`.', () => {
				const data: bigint[] = [
					42n + -420n,
					...[
						 126 /  3,
						-126 /  3,
						 126 / -3,
						-126 / -3,
						 200 /  3,
						 200 / -3,
						-200 /  3,
						-200 / -3,
					].map((x) => BigInt(Math.trunc(x))),
					(42n ** 2n * 420n) % (2n ** 16n),
					(-5n) ** (2n * 3n),
				];
				const mod = new binaryen.Module();
				return assertEqualBins(
					data.map((x) => new OBJ.Integer(x).build(mod)),
					data.map((x) => new BinVect(mod, mod.i32.const(Number(x))).vect),
				);
			});
		});

		describe('Float', () => {
			it('generates `(f64.const)`.', () => {
				/* eslint-disable array-element-newline */
				const data: number[] = [
					55, -55, 33, -33, 2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					6.8, 6.8,
					3.0 - 2.7,
				];
				/* eslint-enable array-element-newline */
				const mod = new binaryen.Module();
				return assertEqualBins(
					data.map((x) => new OBJ.Float(x).build(mod)),
					data.map((x) => new BinVect(mod, mod.f64.const(x)).vect),
				);
			});
			it('builds `0.0` and `-0.0` differently.', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					[0.0, -0.0].map((x) => new OBJ.Float(x).build(mod)),
					[mod.f64.const(0.0), mod.f64.ceil(mod.f64.const(-0.5))].map((c) => new BinVect(mod, c).vect),
				);
			});
		});

		describe.skip('String', () => {
			specify('#build', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					new OBJ.String('hello world').build(mod),
					buildConst(mod, 0n),
				);
			});
		});

		describe('SolidTuple', () => {
			it('returns `(tuple.make)`.', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					new OBJ.Tuple([OBJ.Integer.UNIT, new OBJ.Float(2.0)]).build(mod),
					mod.tuple.make([buildConst(mod, 1n), buildConst(mod, 2.0)]),
				);
			});
		});
	});


	describe('Set', () => {
		describe('.constructor', () => {
			it('overwrites identical elements.', () => {
				assert.deepStrictEqual(
					new OBJ.Set(new Set([
						new OBJ.String('a'),
						OBJ.Integer.ZERO,
						new OBJ.Integer(-0n),
					])),
					new OBJ.Set(new Set([
						new OBJ.String('a'),
						OBJ.Integer.ZERO,
					])),
				);
			});
			it('does not overwrite non-identical (even if equal) elements.', () => {
				assert.deepStrictEqual(
					new OBJ.Set(new Set([
						new OBJ.String('a'),
						new OBJ.Float(0.0),
						new OBJ.Float(-0.0),
					])),
					new OBJ.Set(new Set([
						new OBJ.String('a'),
						new OBJ.Float(0.0),
						new OBJ.Float(-0.0),
					])),
				);
			});
		});
	});


	describe('Map', () => {
		describe('.constructor', () => {
			it('overwrites identical antecedents.', () => {
				assert.deepStrictEqual(
					new OBJ.Map(new Map<OBJ.Object, OBJ.Object>([
						[new OBJ.String('a'),  OBJ.Integer.UNIT],
						[OBJ.Integer.ZERO,     new OBJ.Float(2.0)],
						[new OBJ.Integer(-0n), new OBJ.String('three')],
					])),
					new OBJ.Map(new Map<OBJ.Object, OBJ.Object>([
						[new OBJ.String('a'), OBJ.Integer.UNIT],
						[OBJ.Integer.ZERO,    new OBJ.String('three')],
					])),
				);
			});
			it('does not overwrite non-identical (even if equal) antecedents.', () => {
				assert.deepStrictEqual(
					new OBJ.Map(new Map<OBJ.Object, OBJ.Object>([
						[new OBJ.String('a'), OBJ.Integer.UNIT],
						[new OBJ.Float(0.0),  new OBJ.Float(2.0)],
						[new OBJ.Float(-0.0), new OBJ.String('three')],
					])),
					new OBJ.Map(new Map<OBJ.Object, OBJ.Object>([
						[new OBJ.String('a'), new OBJ.Integer(1n)],
						[new OBJ.Float(0.0),  new OBJ.Float(2.0)],
						[new OBJ.Float(-0.0), new OBJ.String('three')],
					])),
				);
			});
		});
	});
});
