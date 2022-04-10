import * as assert from 'assert';
import {
	ASTNODE_SOLID as AST,
} from '../../../src/validator/index.js';
import {
	SolidType,
	SolidTypeList,
	SolidTypeDict,
	SolidTypeSet,
	SolidTypeMap,
	Int16,
	Float64,
	SolidList,
	SolidDict,
	SolidSet,
	SolidMap,
} from '../../../src/typer/index.js';
import {
	TypeError03,
	TypeError05,
	TypeError06,
} from '../../../src/error/index.js';



describe('ASTNodeCall', () => {
	describe('#type', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assert.deepStrictEqual(
				[
					`List.<int>([1, 2, 3]);`,
					`Dict.<int>([a= 1, b= 2, c= 3]);`,
					`Set.<int>([1, 2, 3]);`,
					`Map.<int, float>([
						[1, 0.1],
						[2, 0.2],
						[3, 0.3],
					]);`,
				].map((src) => AST.ASTNodeCall.fromSource(src).type()),
				[
					new SolidTypeList(SolidType.INT).mutableOf(),
					new SolidTypeDict(SolidType.INT).mutableOf(),
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
				].map((src) => AST.ASTNodeCall.fromSource(src).type()),
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
					`Dict.<int>();`,
					`Set.<int>();`,
					`Map.<int, float>();`,
					`List.<int>([]);`,
					`Set.<int>([]);`,
					`Map.<int, float>([]);`,
				].map((src) => AST.ASTNodeCall.fromSource(src).type()),
				[
					new SolidTypeList(SolidType.INT).mutableOf(),
					new SolidTypeDict(SolidType.INT).mutableOf(),
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
				AST.ASTNodeCall.fromSource(`Map.<int>();`).type(),
				new SolidTypeMap(SolidType.INT, SolidType.INT).mutableOf(),
			);
		});
		it('throws if base is not an ASTNodeVariable.', () => {
			[
				`null.();`,
				`(42 || 43).<bool>();`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeError05);
			});
		});
		it('throws if base is not one of the allowed strings.', () => {
			[
				`SET.<str>();`,
				`Mapping.<bool>();`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), SyntaxError);
			});
		});
		it('throws when providing incorrect number of arguments.', () => {
			[
				`List.<int>([], []);`,
				`Dict.<int>([], []);`,
				`Set.<int>([], []);`,
				`Map.<int>([], []);`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeError06);
			});
		});
		it('throws when providing incorrect type of arguments.', () => {
			[
				`List.<int>(42);`,
				`Dict.<int>([4.2]);`,
				`Set.<int>([42, '42']);`,
				`Map.<int>([42, '42']);`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeError03);
			});
		});
	});


	describe('#fold', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assert.deepStrictEqual(
				[
					`List.<int>([1, 2, 3]);`,
					`Dict.<int>([a= 1, b= 2, c= 3]);`,
					`Set.<int>([1, 2, 3]);`,
					`Map.<int, float>([
						[1, 0.1],
						[2, 0.2],
						[3, 0.4],
					]);`,
				].map((src) => AST.ASTNodeCall.fromSource(src).fold()),
				[
					new SolidList<Int16>([
						new Int16(1n),
						new Int16(2n),
						new Int16(3n),
					]),
					new SolidDict<Int16>(new Map<bigint, Int16>([
						[0x101n, new Int16(1n)], // 0x100n is "Dict"
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
				].map((src) => AST.ASTNodeCall.fromSource(src).fold()),
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
					`Dict.<int>();`,
					`Set.<int>();`,
					`Map.<int, float>();`,
					`List.<int>([]);`,
					`Set.<int>([]);`,
					`Map.<int, float>([]);`,
				].map((src) => AST.ASTNodeCall.fromSource(src).fold()),
				[
					new SolidList<never>(),
					new SolidDict<never>(),
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
