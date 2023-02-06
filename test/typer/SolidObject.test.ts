import * as assert from 'assert'
import binaryen from 'binaryen';
import {
	SolidObject,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidSet,
	SolidMap,
} from '../../src/index.js';
import {assertEqualBins} from '../assert-helpers.js';
import {
	buildConstInt,
	buildConstFloat,
} from '../helpers.js';



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


	describe('#build', () => {
		describe('SolidTuple', () => {
			it('returns `(tuple.make)`.', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					new SolidTuple([Int16.UNIT, new Float64(2.0)]).build(mod),
					mod.tuple.make([buildConstInt(1n, mod), buildConstFloat(2.0, mod)]),
				);
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



describe('Int16', () => {
	describe('#build', () => {
		it('ok.', () => {
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
				data.map((x) => new Int16(x).build(mod)),
				data.map((x) => buildConstInt(x, mod)),
			);
		});
	});
});



describe('Float64', () => {
	specify('#build', () => {
		const data: number[] = [
			55, -55, 33, -33, 2.007, -2.007,
			91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
			-0, -0, 6.8, 6.8, 0, -0,
			3.0 - 2.7,
		];
		const mod = new binaryen.Module();
		return assertEqualBins(
			data.map((x) => new Float64(x).build(mod)),
			data.map((x) => buildConstFloat(x, mod)),
		);
	});
});
