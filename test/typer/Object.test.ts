import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	OBJ,
	Builder,
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
				const builder = new Builder();
				return assertEqualBins(
					OBJ.Null.NULL.build(builder),
					new BinVect(builder.module, null).vect,
				);
			});
		});

		specify('Boolean', () => {
			const builder = new Builder();
			return assertEqualBins(
				[OBJ.Boolean.FALSE.build(builder), OBJ.Boolean.TRUE.build(builder)],
				[new BinVect(builder.module, false).vect, new BinVect(builder.module, true).vect],
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
				const builder = new Builder();
				return assertEqualBins(
					data.map((x) => new OBJ.Integer(x).build(builder)),
					data.map((x) => new BinVect(builder.module, builder.module.i32.const(Number(x))).vect),
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
				const builder = new Builder();
				return assertEqualBins(
					data.map((x) => new OBJ.Float(x).build(builder)),
					data.map((x) => new BinVect(builder.module, builder.module.f64.const(x)).vect),
				);
			});
			it('builds `0.0` and `-0.0` differently.', () => {
				const builder = new Builder();
				const mod: binaryen.Module = builder.module;
				return assertEqualBins(
					[0.0, -0.0].map((x) => new OBJ.Float(x).build(builder)),
					[mod.f64.const(0.0), mod.f64.ceil(mod.f64.const(-0.5))].map((c) => new BinVect(mod, c).vect),
				);
			});
		});

		describe.skip('String', () => {
			specify('#build', () => {
				const builder = new Builder();
				return assertEqualBins(
					new OBJ.String('hello world').build(builder),
					buildConst(builder, 0n),
				);
			});
		});

		describe('Tuple', () => {
			let builder:    Builder       = new Builder();
			const bintype2: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128]);
			const bintype3: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128, binaryen.v128]);

			beforeEach(() => {
				builder = new Builder();
			});

			it('returns (tuple.make).', () => {
				assertEqualBins(
					new OBJ.Tuple([OBJ.Integer.UNIT, new OBJ.Float(2.0)]).build(builder),
					builder.module.tuple.make([buildConst(builder, 1n), buildConst(builder, 2.0)]),
					// '[1, 2.0]',
				);
			});
			it('empty tuple returns unique BinVect representation.', () => {
				assertEqualBins(
					new OBJ.Tuple().build(builder),
					new BinVect(builder.module, 'tuple').vect,
					// '[]',
				);
			});
			it('tuple of length 1 returns a (tuple.make) with 1 item.', () => {
				assertEqualBins(
					new OBJ.Tuple([new OBJ.Float(3.4)]).build(builder),
					builder.module.tuple.make([buildConst(builder, 3.4)]),
					// '[3.4]',
				);
			});
			it('boxed empty tuple returns (tuple.make) containing a BinVect.', () => {
				assertEqualBins(
					new OBJ.Tuple([new OBJ.Tuple()]).build(builder),
					builder.module.tuple.make([new BinVect(builder.module, 'tuple').vect]),
					// '[[]]',
				);
			});
			it('boxed tuple with 1 item.', () => {
				const mod: binaryen.Module = builder.module;
				return assertEqualBins(
					new OBJ.Tuple([new OBJ.Tuple([new OBJ.Float(3.4)])]).build(builder),
					mod.tuple.make([mod.tuple.extract(mod.tuple.make([buildConst(builder, 3.4)]), 0)]),
					// '[[3.4]]',
				);
			});
			it('boxed tuple with many items.', () => {
				const mod:   binaryen.Module        = builder.module;
				const inner: binaryen.ExpressionRef = mod.tuple.make([
					buildConst(builder, 1n),
					buildConst(builder, 2.0),
					buildConst(builder, true),
				]);
				return assertEqualBins(
					new OBJ.Tuple([new OBJ.Tuple([
						OBJ.Integer.UNIT,
						new OBJ.Float(2.0),
						OBJ.Boolean.TRUE,
					])]).build(builder),
					mod.tuple.make([
						mod.tuple.extract(mod.local.tee(0, inner, bintype3), 0),
						mod.tuple.extract(mod.local.get(0, bintype3), 1),
						mod.tuple.extract(mod.local.get(0, bintype3), 2),
					]),
					// '[[1, 2.0, true]]',
				);
			});
			it('nested tuples.', () => {
				const mod:    binaryen.Module        = builder.module;
				const inner2: binaryen.ExpressionRef = mod.tuple.make([
					buildConst(builder, 3n),
					mod.tuple.extract(mod.tuple.make([buildConst(builder, 4.0)]), 0),
				]);
				return assertEqualBins(
					new OBJ.Tuple([
						OBJ.Integer.UNIT,
						new OBJ.Tuple([new OBJ.Float(2.0)]),
						new OBJ.Tuple([
							new OBJ.Integer(3n),
							new OBJ.Tuple([new OBJ.Float(4.0)]),
						]),
					]).build(builder),
					mod.tuple.make([
						buildConst(builder, 1n),
						mod.tuple.extract(mod.tuple.make([buildConst(builder, 2.0)]), 0),
						mod.tuple.extract(mod.local.tee(0, inner2, bintype2), 0),
						mod.tuple.extract(mod.local.get(0, bintype2), 1),
					]),
					// '[1, [2.0], [3, [4.0]]]',
				);
			});
			it('multiple entries.', () => {
				const mod:     binaryen.Module        = builder.module;
				const inner01: binaryen.ExpressionRef = mod.tuple.make([
					buildConst(builder, 2.0),
					buildConst(builder, 3n),
				]);
				const inner11: binaryen.ExpressionRef = mod.tuple.make([
					buildConst(builder, 5n),
					buildConst(builder, 6.0),
				]);
				const inner0: binaryen.ExpressionRef = mod.tuple.make([
					buildConst(builder, 1n),
					mod.tuple.extract(mod.local.tee(0, inner01, bintype2), 0),
					mod.tuple.extract(mod.local.get(0, bintype2), 1),
				]);
				const inner1: binaryen.ExpressionRef = mod.tuple.make([
					buildConst(builder, 4.0),
					mod.tuple.extract(mod.local.tee(2, inner11, bintype2), 0),
					mod.tuple.extract(mod.local.get(2, bintype2), 1),
				]);
				const inner2: binaryen.ExpressionRef = mod.tuple.make([
					buildConst(builder, 7n),
					new BinVect(mod, 'tuple').vect,
				]);
				return assertEqualBins(
					new OBJ.Tuple([
						new OBJ.Tuple([
							OBJ.Integer.UNIT,
							new OBJ.Tuple([
								new OBJ.Float(2.0),
								new OBJ.Integer(3n),
							]),
						]),
						new OBJ.Tuple([
							new OBJ.Float(4.0),
							new OBJ.Tuple([
								new OBJ.Integer(5n),
								new OBJ.Float(6.0),
							]),
						]),
						new OBJ.Tuple([
							new OBJ.Integer(7n),
							new OBJ.Tuple(),
						]),
					]).build(builder),
					mod.tuple.make([
						mod.tuple.extract(mod.local.tee(1, inner0, bintype3), 0),
						mod.tuple.extract(mod.local.get(1, bintype3), 1),
						mod.tuple.extract(mod.local.get(1, bintype3), 2),
						mod.tuple.extract(mod.local.tee(3, inner1, bintype3), 0),
						mod.tuple.extract(mod.local.get(3, bintype3), 1),
						mod.tuple.extract(mod.local.get(3, bintype3), 2),
						mod.tuple.extract(mod.local.tee(4, inner2, bintype2), 0),
						mod.tuple.extract(mod.local.get(4, bintype2), 1),
					]),
					// '[[1, [2.0, 3]], [4.0, [5, 6.0]], [7, []]]',
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
