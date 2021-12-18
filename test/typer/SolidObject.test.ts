import * as assert from 'assert'
import {
	SolidObject,
	Int16,
	Float64,
	SolidString,
	SolidSet,
	SolidMap,
} from '../../src/typer/index.js';



describe('SolidObject', () => {
	describe('#equal', () => {
		describe('SolidSet', () => {
			it('return false if sets have different counts.', () => {
				assert.ok(!new SolidSet<SolidString>(new Set([
					new SolidString('earth'),
					new SolidString('wind'),
					new SolidString('fire'),
				])).equal(new SolidSet<SolidString>(new Set([
					new SolidString('earth'),
					new SolidString('wind'),
					new SolidString('fire'),
					new SolidString('water'),
				]))));
			});
			it('returns true if sets contain equal elements.', () => {
				assert.ok(new SolidSet<SolidString>(new Set([
					new SolidString('earth'),
					new SolidString('wind'),
					new SolidString('fire'),
				])).equal(new SolidSet<SolidString>(new Set([
					new SolidString('earth'),
					new SolidString('fire'),
					new SolidString('wind'),
				]))));
			});
		});
	});


	describe('SolidSet', () => {
		describe('.constructor', () => {
			it('overwrites identical elements.', () => {
				assert.deepStrictEqual(
					new SolidSet(new Set([
						new SolidString('a'),
						Int16.ZERO,
						new Int16(-0n),
					])),
					new SolidSet(new Set([
						new SolidString('a'),
						Int16.ZERO,
					])),
				);
			});
			it('does not overwrite non-identical (even if equal) elements.', () => {
				assert.deepStrictEqual(
					new SolidSet(new Set([
						new SolidString('a'),
						new Float64(0.0),
						new Float64(-0.0),
					])),
					new SolidSet(new Set([
						new SolidString('a'),
						new Float64(0.0),
						new Float64(-0.0),
					])),
				);
			});
		});
	});


	describe('SolidMap', () => {
		describe('.constructor', () => {
			it('overwrites identical antecedents.', () => {
				assert.deepStrictEqual(
					new SolidMap(new Map<SolidObject, SolidObject>([
						[new SolidString('a'), Int16.UNIT],
						[Int16.ZERO,           new Float64(2.0)],
						[new Int16(-0n),       new SolidString('three')],
					])),
					new SolidMap(new Map<SolidObject, SolidObject>([
						[new SolidString('a'), Int16.UNIT],
						[Int16.ZERO,           new SolidString('three')],
					])),
				);
			});
			it('does not overwrite non-identical (even if equal) antecedents.', () => {
				assert.deepStrictEqual(
					new SolidMap(new Map<SolidObject, SolidObject>([
						[new SolidString('a'), Int16.UNIT],
						[new Float64(0.0),     new Float64(2.0)],
						[new Float64(-0.0),    new SolidString('three')],
					])),
					new SolidMap(new Map<SolidObject, SolidObject>([
						[new SolidString('a'), new Int16(1n)],
						[new Float64(0.0),     new Float64(2.0)],
						[new Float64(-0.0),    new SolidString('three')],
					])),
				);
			});
		});
	});
});
