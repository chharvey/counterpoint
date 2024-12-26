import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	VALUE,
	Builder,
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
				const builder = new Builder();
				return assertEqualBins(
					VALUE.Null.NULL.build(builder),
					new BinVect(builder.module, null).vect,
				);
			});
		});

		specify('Boolean', () => {
			const builder = new Builder();
			return assertEqualBins(
				[VALUE.Boolean.FALSE.build(builder), VALUE.Boolean.TRUE.build(builder)],
				[new BinVect(builder.module, false).vect, new BinVect(builder.module, true).vect],
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

		describe('Collection', () => {
			const bintype2: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128]);
			const bintype3: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128, binaryen.v128]);

			describe('Tuple', () => {
				let builder: Builder = new Builder();
				beforeEach(() => {
					builder = new Builder();
				});
				it('returns `(tuple.make)`.', () => {
					assertEqualBins(
						new VALUE.Tuple([VALUE.Integer.UNIT, new VALUE.Float(2.0)]).build(builder),
						builder.module.tuple.make([buildConst(builder, 1n), buildConst(builder, 2.0)]),
						'[1, 2.0]',
					);
				});
				it('empty tuple returns unique BinVect representation.', () => {
					assertEqualBins(
						new VALUE.Tuple().build(builder),
						new BinVect(builder.module, 'tuple').vect,
						'[]',
					);
				});
				it('tuple of length 1 returns a `(tuple.make)` with 1 item.', () => {
					assertEqualBins(
						new VALUE.Tuple([new VALUE.Float(3.4)]).build(builder),
						builder.module.tuple.make([buildConst(builder, 3.4)]),
						'[3.4]',
					);
				});
				it('boxed empty tuple returns `(tuple.make)` containing a BinVect.', () => {
					assertEqualBins(
						new VALUE.Tuple([new VALUE.Tuple()]).build(builder),
						builder.module.tuple.make([new BinVect(builder.module, 'tuple').vect]),
						'[[]]',
					);
				});
				it('boxed tuple with 1 item.', () => {
					const mod: binaryen.Module = builder.module;
					return assertEqualBins(
						new VALUE.Tuple([new VALUE.Tuple([new VALUE.Float(3.4)])]).build(builder),
						mod.tuple.make([mod.tuple.extract(mod.tuple.make([buildConst(builder, 3.4)]), 0)]),
						'[[3.4]]',
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
						new VALUE.Tuple([new VALUE.Tuple([
							VALUE.Integer.UNIT,
							new VALUE.Float(2.0),
							VALUE.Boolean.TRUE,
						])]).build(builder),
						mod.tuple.make([
							mod.tuple.extract(mod.local.tee(0, inner, bintype3), 0),
							mod.tuple.extract(mod.local.get(0, bintype3), 1),
							mod.tuple.extract(mod.local.get(0, bintype3), 2),
						]),
						'[[1, 2.0, true]]',
					);
				});
				it('nested tuples.', () => {
					const mod:    binaryen.Module        = builder.module;
					const inner2: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(builder, 3n),
						mod.tuple.extract(mod.tuple.make([buildConst(builder, 4.0)]), 0),
					]);
					return assertEqualBins(
						new VALUE.Tuple([
							VALUE.Integer.UNIT,
							new VALUE.Tuple([new VALUE.Float(2.0)]),
							new VALUE.Tuple([
								new VALUE.Integer(3n),
								new VALUE.Tuple([new VALUE.Float(4.0)]),
							]),
						]).build(builder),
						mod.tuple.make([
							buildConst(builder, 1n),
							mod.tuple.extract(mod.tuple.make([buildConst(builder, 2.0)]), 0),
							mod.tuple.extract(mod.local.tee(0, inner2, bintype2), 0),
							mod.tuple.extract(mod.local.get(0, bintype2), 1),
						]),
						'[1, [2.0], [3, [4.0]]]',
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
						new VALUE.Tuple([
							new VALUE.Tuple([
								VALUE.Integer.UNIT,
								new VALUE.Tuple([
									new VALUE.Float(2.0),
									new VALUE.Integer(3n),
								]),
							]),
							new VALUE.Tuple([
								new VALUE.Float(4.0),
								new VALUE.Tuple([
									new VALUE.Integer(5n),
									new VALUE.Float(6.0),
								]),
							]),
							new VALUE.Tuple([
								new VALUE.Integer(7n),
								new VALUE.Tuple(),
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
						'[[1, [2.0, 3]], [4.0, [5, 6.0]], [7, []]]',
					);
				});
			});

			describe('Record', () => {
				let builder: Builder = new Builder();
				beforeEach(() => {
					builder = new Builder();
				});
				it('returns `(tuple.make)`.', () => {
					assertEqualBins(
						new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x100n, VALUE.Integer.UNIT],
							[0x101n, new VALUE.Float(2.0)],
						])).build(builder),
						builder.module.tuple.make([buildConst(builder, 1n), buildConst(builder, 2.0)]),
						'[a= 1, b= 2.0]',
					);
				});
				it('record of size 1 returns a `(tuple.make)` with 1 item.', () => {
					assertEqualBins(
						new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Float(3.4)]])).build(builder),
						builder.module.tuple.make([buildConst(builder, 3.4)]),
						'[a= 3.4]',
					);
				});
				it('boxed record with 1 prop.', () => {
					const mod: binaryen.Module = builder.module;
					return assertEqualBins(
						new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Float(3.4)]]))]])).build(builder),
						mod.tuple.make([mod.tuple.extract(mod.tuple.make([buildConst(builder, 3.4)]), 0)]),
						'[a= [a= 3.4]]',
					);
				});
				it('boxed record with many props.', () => {
					const mod:   binaryen.Module        = builder.module;
					const inner: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(builder, 1n),
						buildConst(builder, 2.0),
						buildConst(builder, true),
					]);
					return assertEqualBins(
						new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x100n, VALUE.Integer.UNIT],
							[0x101n, new VALUE.Float(2.0)],
							[0x102n, VALUE.Boolean.TRUE],
						]))]])).build(builder),
						mod.tuple.make([
							mod.tuple.extract(mod.local.tee(0, inner, bintype3), 0),
							mod.tuple.extract(mod.local.get(0, bintype3), 1),
							mod.tuple.extract(mod.local.get(0, bintype3), 2),
						]),
						'[a= [a= 1, b= 2.0, c= true]]',
					);
				});
				it('nested records.', () => {
					const mod:    binaryen.Module        = builder.module;
					const inner2: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(builder, 3n),
						mod.tuple.extract(mod.tuple.make([buildConst(builder, 4.0)]), 0),
					]);
					return assertEqualBins(
						new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x100n, VALUE.Integer.UNIT],
							[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Float(2.0)]]))],
							[0x102n, new VALUE.Record(new Map<bigint, VALUE.Value>([
								[0x100n, new VALUE.Integer(3n)],
								[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Float(4.0)]]))],
							]))],
						])).build(builder),
						mod.tuple.make([
							buildConst(builder, 1n),
							mod.tuple.extract(mod.tuple.make([buildConst(builder, 2.0)]), 0),
							mod.tuple.extract(mod.local.tee(0, inner2, bintype2), 0),
							mod.tuple.extract(mod.local.get(0, bintype2), 1),
						]),
						`[
							a= 1,
							b= [a= 2.0],
							c= [a= 3, b= [a= 4.0]],
						]`,
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
					const inner2: binaryen.ExpressionRef = mod.block(null, [
						mod.local.set(4, buildConst(builder, 7n)),
						mod.local.set(5, new BinVect(mod, true).vect),
						mod.tuple.make([
							mod.local.get(5, binaryen.v128),
							mod.local.get(4, binaryen.v128),
						]),
					], bintype2);
					return assertEqualBins(
						new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x100n, new VALUE.Record(new Map<bigint, VALUE.Value>([
								[0x100n, VALUE.Integer.UNIT],
								[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([
									[0x100n, new VALUE.Float(2.0)],
									[0x101n, new VALUE.Integer(3n)],
								]))],
							]))],
							[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([
								[0x100n, new VALUE.Float(4.0)],
								[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([
									[0x100n, new VALUE.Integer(5n)],
									[0x101n, new VALUE.Float(6.0)],
								]))],
							]))],
							[0x102n, new VALUE.Record(new Map<bigint, VALUE.Value>([
								[0x101n, new VALUE.Integer(7n)],
								[0x100n, VALUE.Boolean.TRUE],
							]))],
						])).build(builder),
						mod.tuple.make([
							mod.tuple.extract(mod.local.tee(1, inner0, bintype3), 0),
							mod.tuple.extract(mod.local.get(1, bintype3), 1),
							mod.tuple.extract(mod.local.get(1, bintype3), 2),
							mod.tuple.extract(mod.local.tee(3, inner1, bintype3), 0),
							mod.tuple.extract(mod.local.get(3, bintype3), 1),
							mod.tuple.extract(mod.local.get(3, bintype3), 2),
							mod.tuple.extract(mod.local.tee(6, inner2, bintype2), 0),
							mod.tuple.extract(mod.local.get(6, bintype2), 1),
						]),
						`[
							a= [a= 1,   b= [a= 2.0, b= 3]],
							b= [a= 4.0, b= [a= 5, b= 6.0]],
							c= [b= 7,   a= true],
						]`,
					);
				});
			});
		});
	});


	describe('Set', () => {
		describe('.constructor', () => {
			it('overwrites identical elements.', () => {
				assert.deepStrictEqual(
					new VALUE.Set(new Set([
						new VALUE.String('a'),
						VALUE.Integer.ZERO,
						new VALUE.Integer(-0n),
					])),
					new VALUE.Set(new Set([
						new VALUE.String('a'),
						VALUE.Integer.ZERO,
					])),
				);
			});
			it('does not overwrite non-identical (even if equal) elements.', () => {
				assert.deepStrictEqual(
					new VALUE.Set(new Set([
						new VALUE.String('a'),
						new VALUE.Float(0.0),
						new VALUE.Float(-0.0),
					])),
					new VALUE.Set(new Set([
						new VALUE.String('a'),
						new VALUE.Float(0.0),
						new VALUE.Float(-0.0),
					])),
				);
			});
		});
	});


	describe('Map', () => {
		describe('.constructor', () => {
			it('overwrites identical antecedents.', () => {
				assert.deepStrictEqual(
					new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
						[new VALUE.String('a'),  VALUE.Integer.UNIT],
						[VALUE.Integer.ZERO,     new VALUE.Float(2.0)],
						[new VALUE.Integer(-0n), new VALUE.String('three')],
					])),
					new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
						[new VALUE.String('a'), VALUE.Integer.UNIT],
						[VALUE.Integer.ZERO,    new VALUE.String('three')],
					])),
				);
			});
			it('does not overwrite non-identical (even if equal) antecedents.', () => {
				assert.deepStrictEqual(
					new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
						[new VALUE.String('a'), VALUE.Integer.UNIT],
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
