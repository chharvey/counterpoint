import * as assert from 'assert';
import {
	OBJ,
	INST,
} from '../../src/index.js';
import {
	instructionConstInt,
	instructionConstFloat,
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
			return assert.deepStrictEqual(
				data.map((x) => new OBJ.Integer(x).build()),
				data.map((x) => instructionConstInt(x)),
			);
		});

		it('@to_float === true', () => {
			const build: INST.InstructionConst = new OBJ.Integer(42n).build(true);
			assert.deepStrictEqual   (build, instructionConstFloat(42));
			assert.notDeepStrictEqual(build, instructionConstInt(42n));
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
		return assert.deepStrictEqual(
			data.map((x) => new OBJ.Float(x).build()),
			data.map((x) => instructionConstFloat(x)),
		);
	});
});
