import * as assert from 'assert'
import {
	OBJ,
} from '../../src/index.js';



describe('Object', () => {
	describe('#equal', () => {
		describe('SolidSet', () => {
			it('return false if sets have different counts.', () => {
				assert.ok(!new OBJ.SolidSet<OBJ.SolidString>(new Set([
					new OBJ.SolidString('earth'),
					new OBJ.SolidString('wind'),
					new OBJ.SolidString('fire'),
				])).equal(new OBJ.SolidSet<OBJ.SolidString>(new Set([
					new OBJ.SolidString('earth'),
					new OBJ.SolidString('wind'),
					new OBJ.SolidString('fire'),
					new OBJ.SolidString('water'),
				]))));
			});
			it('returns true if sets contain equal elements.', () => {
				assert.ok(new OBJ.SolidSet<OBJ.SolidString>(new Set([
					new OBJ.SolidString('earth'),
					new OBJ.SolidString('wind'),
					new OBJ.SolidString('fire'),
				])).equal(new OBJ.SolidSet<OBJ.SolidString>(new Set([
					new OBJ.SolidString('earth'),
					new OBJ.SolidString('fire'),
					new OBJ.SolidString('wind'),
				]))));
			});
		});
	});


	describe('SolidSet', () => {
		describe('.constructor', () => {
			it('overwrites identical elements.', () => {
				assert.deepStrictEqual(
					new OBJ.SolidSet(new Set([
						new OBJ.SolidString('a'),
						OBJ.Int16.ZERO,
						new OBJ.Int16(-0n),
					])),
					new OBJ.SolidSet(new Set([
						new OBJ.SolidString('a'),
						OBJ.Int16.ZERO,
					])),
				);
			});
			it('does not overwrite non-identical (even if equal) elements.', () => {
				assert.deepStrictEqual(
					new OBJ.SolidSet(new Set([
						new OBJ.SolidString('a'),
						new OBJ.Float64(0.0),
						new OBJ.Float64(-0.0),
					])),
					new OBJ.SolidSet(new Set([
						new OBJ.SolidString('a'),
						new OBJ.Float64(0.0),
						new OBJ.Float64(-0.0),
					])),
				);
			});
		});
	});


	describe('SolidMap', () => {
		describe('.constructor', () => {
			it('overwrites identical antecedents.', () => {
				assert.deepStrictEqual(
					new OBJ.SolidMap(new Map<OBJ.Object, OBJ.Object>([
						[new OBJ.SolidString('a'), OBJ.Int16.UNIT],
						[OBJ.Int16.ZERO,           new OBJ.Float64(2.0)],
						[new OBJ.Int16(-0n),       new OBJ.SolidString('three')],
					])),
					new OBJ.SolidMap(new Map<OBJ.Object, OBJ.Object>([
						[new OBJ.SolidString('a'), OBJ.Int16.UNIT],
						[OBJ.Int16.ZERO,           new OBJ.SolidString('three')],
					])),
				);
			});
			it('does not overwrite non-identical (even if equal) antecedents.', () => {
				assert.deepStrictEqual(
					new OBJ.SolidMap(new Map<OBJ.Object, OBJ.Object>([
						[new OBJ.SolidString('a'), OBJ.Int16.UNIT],
						[new OBJ.Float64(0.0),     new OBJ.Float64(2.0)],
						[new OBJ.Float64(-0.0),    new OBJ.SolidString('three')],
					])),
					new OBJ.SolidMap(new Map<OBJ.Object, OBJ.Object>([
						[new OBJ.SolidString('a'), new OBJ.Int16(1n)],
						[new OBJ.Float64(0.0),     new OBJ.Float64(2.0)],
						[new OBJ.Float64(-0.0),    new OBJ.SolidString('three')],
					])),
				);
			});
		});
	});
});
