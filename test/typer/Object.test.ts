import * as assert from 'assert';
import binaryen from 'binaryen';
import {OBJ} from '../../src/index.js';
import {assertEqualBins} from '../assert-helpers.js';
import {
	buildConstInt,
	buildConstFloat,
} from '../helpers.js';



describe('Object', () => {
	describe('#equal', () => {
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
		describe('SolidTuple', () => {
			it('returns `(tuple.make)`.', () => {
				const mod = new binaryen.Module();
				return assertEqualBins(
					new OBJ.Tuple([OBJ.Integer.UNIT, new OBJ.Float(2.0)]).build(mod),
					mod.tuple.make([buildConstInt(1n, mod), buildConstFloat(2.0, mod)]),
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



describe('Integer', () => {
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
				data.map((x) => new OBJ.Integer(x).build(mod)),
				data.map((x) => buildConstInt(x, mod)),
			);
		});
	});
});



describe('Float64', () => {
	specify('#build', () => {
		const data: number[] = [
			/* eslint-disable array-element-newline */
			55, -55, 33, -33, 2.007, -2.007,
			91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
			-0, -0, 6.8, 6.8, 0, -0,
			3.0 - 2.7,
			/* eslint-enable array-element-newline */
		];
		const mod = new binaryen.Module();
		return assertEqualBins(
			data.map((x) => new OBJ.Float(x).build(mod)),
			data.map((x) => buildConstFloat(x, mod)),
		);
	});
});
