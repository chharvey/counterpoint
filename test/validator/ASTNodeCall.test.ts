import * as assert from 'assert';
import {
	// {ASTNodeKey, ...} as AST,
	Validator,
} from '../../src/validator/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	SolidType,
	SolidTypeList,
	SolidTypeHash,
	SolidTypeSet,
	SolidTypeMap,
	Int16,
	Float64,
	SolidList,
	SolidHash,
	SolidSet,
	SolidMap,
} from '../../src/typer/index.js';
import {
	TypeError03,
	TypeError05,
	TypeError06,
} from '../../src/error/index.js';
import {CONFIG_FOLDING_OFF} from '../helpers.js';



describe('ASTNodeCall', () => {
	describe('#type', () => {
		const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
		it('evaluates List, Hash, Set, and Map.', () => {
			assert.deepStrictEqual(
				[
					`List.<int>([1, 2, 3]);`,
					`Hash.<int>([a= 1, b= 2, c= 3]);`,
					`Set.<int>([1, 2, 3]);`,
					`Map.<int, float>([
						[1, 0.1],
						[2, 0.2],
						[3, 0.3],
					]);`,
				].map((src) => AST.ASTNodeCall.fromSource(src).type(validator)),
				[
					new SolidTypeList(SolidType.INT).mutableOf(),
					new SolidTypeHash(SolidType.INT).mutableOf(),
					new SolidTypeSet(SolidType.INT).mutableOf(),
					new SolidTypeMap(SolidType.INT, SolidType.FLOAT).mutableOf(),
				],
			);
		});
		it('List, Set, and Map take List-type arguments.', () => {
			assert.deepStrictEqual(
				[
					`List.<int>(List.<int>([1, 2, 3]));`,
					`Set.<int>(List.<int>([1, 2, 3]));`,
					`Map.<int, float>(List.<[int, float]>([
						[1, 0.1],
						[2, 0.2],
						[3, 0.3],
					]));`,
				].map((src) => AST.ASTNodeCall.fromSource(src).type(validator)),
				[
					new SolidTypeList(SolidType.INT).mutableOf(),
					new SolidTypeSet(SolidType.INT).mutableOf(),
					new SolidTypeMap(SolidType.INT, SolidType.FLOAT).mutableOf(),
				],
			);
		});
		it('zero/empty functional arguments.', () => {
			assert.deepStrictEqual(
				[
					`List.<int>();`,
					`Hash.<int>();`,
					`Set.<int>();`,
					`Map.<int, float>();`,
					`List.<int>([]);`,
					`Set.<int>([]);`,
					`Map.<int, float>([]);`,
				].map((src) => AST.ASTNodeCall.fromSource(src).type(validator)),
				[
					new SolidTypeList(SolidType.INT).mutableOf(),
					new SolidTypeHash(SolidType.INT).mutableOf(),
					new SolidTypeSet(SolidType.INT).mutableOf(),
					new SolidTypeMap(SolidType.INT, SolidType.FLOAT).mutableOf(),
					new SolidTypeList(SolidType.INT).mutableOf(),
					new SolidTypeSet(SolidType.INT).mutableOf(),
					new SolidTypeMap(SolidType.INT, SolidType.FLOAT).mutableOf(),
				],
			);
		});
		it('Map has a default type parameter.', () => {
			assert.deepStrictEqual(
				AST.ASTNodeCall.fromSource(`Map.<int>();`).type(validator),
				new SolidTypeMap(SolidType.INT, SolidType.INT).mutableOf(),
			);
		});
		it('throws if base is not an ASTNodeVariable.', () => {
			[
				`null.();`,
				`(42 || 43).<bool>();`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(validator), TypeError05);
			});
		});
		it('throws if base is not one of the allowed strings.', () => {
			[
				`SET.<str>();`,
				`Mapping.<bool>();`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(validator), SyntaxError);
			});
		});
		it('throws when providing incorrect number of arguments.', () => {
			[
				`List.<int>([], []);`,
				`Hash.<int>([], []);`,
				`Set.<int>([], []);`,
				`Map.<int>([], []);`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(validator), TypeError06);
			});
		});
		it('throws when providing incorrect type of arguments.', () => {
			[
				`List.<int>(42);`,
				`Hash.<int>([4.2]);`,
				`Set.<int>([42, '42']);`,
				`Map.<int>([42, '42']);`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(validator), TypeError03);
			});
		});
	});


	describe('#fold', () => {
		const validator: Validator = new Validator();
		it('evaluates List, Hash, Set, and Map.', () => {
			assert.deepStrictEqual(
				[
					`List.<int>([1, 2, 3]);`,
					`Hash.<int>([a= 1, b= 2, c= 3]);`,
					`Set.<int>([1, 2, 3]);`,
					`Map.<int, float>([
						[1, 0.1],
						[2, 0.2],
						[3, 0.4],
					]);`,
				].map((src) => AST.ASTNodeCall.fromSource(src).fold(validator)),
				[
					new SolidList<Int16>([
						new Int16(1n),
						new Int16(2n),
						new Int16(3n),
					]),
					new SolidHash<Int16>(new Map<bigint, Int16>([
						[0x101n, new Int16(1n)], // 0x100n is "Hash"
						[0x102n, new Int16(2n)],
						[0x103n, new Int16(3n)],
					])),
					new SolidSet<Int16>(new Set<Int16>([
						new Int16(1n),
						new Int16(2n),
						new Int16(3n),
					])),
					new SolidMap<Int16, Float64>(new Map<Int16, Float64>([
						[new Int16(1n), new Float64(0.1)],
						[new Int16(2n), new Float64(0.2)],
						[new Int16(3n), new Float64(0.4)],
					])),
				],
			);
		});
		it('List, Set, and Map take List-value arguments.', () => {
			assert.deepStrictEqual(
				[
					`List.<int>(List.<int>([1, 2, 3]));`,
					`Set.<int>(List.<int>([1, 2, 3]));`,
					`Map.<int, float>(List.<[int, float]>([
						[1, 0.1],
						[2, 0.2],
						[3, 0.4],
					]));`,
				].map((src) => AST.ASTNodeCall.fromSource(src).fold(validator)),
				[
					new SolidList<Int16>([
						new Int16(1n),
						new Int16(2n),
						new Int16(3n),
					]),
					new SolidSet<Int16>(new Set<Int16>([
						new Int16(1n),
						new Int16(2n),
						new Int16(3n),
					])),
					new SolidMap<Int16, Float64>(new Map<Int16, Float64>([
						[new Int16(1n), new Float64(0.1)],
						[new Int16(2n), new Float64(0.2)],
						[new Int16(3n), new Float64(0.4)],
					])),
				],
			);
		});
		it('zero/empty functional arguments.', () => {
			assert.deepStrictEqual(
				[
					`List.<int>();`,
					`Hash.<int>();`,
					`Set.<int>();`,
					`Map.<int, float>();`,
					`List.<int>([]);`,
					`Set.<int>([]);`,
					`Map.<int, float>([]);`,
				].map((src) => AST.ASTNodeCall.fromSource(src).fold(validator)),
				[
					new SolidList<never>(),
					new SolidHash<never>(),
					new SolidSet<never>(),
					new SolidMap<never, never>(),
					new SolidList<never>(),
					new SolidSet<never>(),
					new SolidMap<never, never>(),
				],
			);
		});
	});
});
