import * as assert from 'assert';
import {OBJ} from '../../src/index.js';



describe('Object', () => {
	describe('#identical', () => {
		describe('Tuple', () => {
			it('different Tuples are not identical even if they have the same items.', () => {
				const t = new OBJ.Tuple<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				]);
				assert.ok(t.identical(t), 't === t');
				assert.ok(!t.identical(new OBJ.Tuple<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])), 't !== [earth, wind, fire]');
				assert.ok(!t.identical(new OBJ.Vect<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])), 't !== \\[earth, wind, fire]');
			});
		});

		describe('Record', () => {
			it('different Records are not identical even if they have the same properties.', () => {
				const r = new OBJ.Record<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]));
				assert.ok(r.identical(r), 'r === r');
				assert.ok(!r.identical(new OBJ.Record<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]))), 'r !== [a= earth, b= wind, c= fire]');
				assert.ok(!r.identical(new OBJ.Struct<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]))), 'r !== \\[a= earth, b= wind, c= fire]');
			});
		});

		describe('Vect', () => {
			it('equal Vects are identical.', () => {
				assert.ok(new OBJ.Vect<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				]).identical(new OBJ.Vect<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])), '\\[earth, wind, fire] === \\[earth, wind, fire]');
			});
			it('Vectors are not identical to Tuples even if they have the same items.', () => {
				assert.ok(!new OBJ.Vect<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				]).identical(new OBJ.Tuple<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])), '\\[earth, wind, fire] !== [earth, wind, fire]');
			});
		});

		describe('Struct', () => {
			it('equal Structs are identical.', () => {
				assert.ok(new OBJ.Struct<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				])).identical(new OBJ.Struct<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]))), '\\[a= earth, b= wind, c= fire] === \\[a= earth, b= wind, c= fire]');
			});
			it('Structs are not identical to Records even if they have the same properties.', () => {
				assert.ok(!new OBJ.Struct<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				])).identical(new OBJ.Record<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]))), '\\[a= earth, b= wind, c= fire] !== [a= earth, b= wind, c= fire]');
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
				])), 't == [earth, wind, fire]');
				assert.ok(t.equal(new OBJ.Vect<OBJ.String>([
					new OBJ.String('earth'),
					new OBJ.String('wind'),
					new OBJ.String('fire'),
				])), 't == \\[earth, wind, fire]');
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
				]))), 'r == [a= earth, b= wind, c= fire]');
				assert.ok(r.equal(new OBJ.Struct<OBJ.String>(new Map<bigint, OBJ.String>([
					[0x100n, new OBJ.String('earth')],
					[0x101n, new OBJ.String('wind')],
					[0x102n, new OBJ.String('fire')],
				]))), 'r == \\[a= earth, b= wind, c= fire]');
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
