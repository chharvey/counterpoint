import * as assert from 'assert';
import {
	AST,
	TYPE,
	OBJ,
} from '../../../src/index.js';
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
					new TYPE.TypeList(TYPE.Type.INT, true),
					new TYPE.TypeDict(TYPE.Type.INT, true),
					new TYPE.TypeSet(TYPE.Type.INT, true),
					new TYPE.TypeMap(TYPE.Type.INT, TYPE.Type.FLOAT, true),
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
					new TYPE.TypeList(TYPE.Type.INT, true),
					new TYPE.TypeSet(TYPE.Type.INT, true),
					new TYPE.TypeMap(TYPE.Type.INT, TYPE.Type.FLOAT, true),
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
					new TYPE.TypeList(TYPE.Type.INT, true),
					new TYPE.TypeDict(TYPE.Type.INT, true),
					new TYPE.TypeSet(TYPE.Type.INT, true),
					new TYPE.TypeMap(TYPE.Type.INT, TYPE.Type.FLOAT, true),
					new TYPE.TypeList(TYPE.Type.INT, true),
					new TYPE.TypeSet(TYPE.Type.INT, true),
					new TYPE.TypeMap(TYPE.Type.INT, TYPE.Type.FLOAT, true),
				],
			);
		});
		it('Map has a default type parameter.', () => {
			assert.deepStrictEqual(
				AST.ASTNodeCall.fromSource(`Map.<int>();`).type(),
				new TYPE.TypeMap(TYPE.Type.INT, TYPE.Type.INT, true),
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
					new OBJ.SolidList<OBJ.Int16>([
						new OBJ.Int16(1n),
						new OBJ.Int16(2n),
						new OBJ.Int16(3n),
					]),
					new OBJ.SolidDict<OBJ.Int16>(new Map<bigint, OBJ.Int16>([
						[0x100n, new OBJ.Int16(1n)],
						[0x101n, new OBJ.Int16(2n)],
						[0x102n, new OBJ.Int16(3n)],
					])),
					new OBJ.SolidSet<OBJ.Int16>(new Set<OBJ.Int16>([
						new OBJ.Int16(1n),
						new OBJ.Int16(2n),
						new OBJ.Int16(3n),
					])),
					new OBJ.SolidMap<OBJ.Int16, OBJ.Float64>(new Map<OBJ.Int16, OBJ.Float64>([
						[new OBJ.Int16(1n), new OBJ.Float64(0.1)],
						[new OBJ.Int16(2n), new OBJ.Float64(0.2)],
						[new OBJ.Int16(3n), new OBJ.Float64(0.4)],
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
					new OBJ.SolidList<OBJ.Int16>([
						new OBJ.Int16(1n),
						new OBJ.Int16(2n),
						new OBJ.Int16(3n),
					]),
					new OBJ.SolidSet<OBJ.Int16>(new Set<OBJ.Int16>([
						new OBJ.Int16(1n),
						new OBJ.Int16(2n),
						new OBJ.Int16(3n),
					])),
					new OBJ.SolidMap<OBJ.Int16, OBJ.Float64>(new Map<OBJ.Int16, OBJ.Float64>([
						[new OBJ.Int16(1n), new OBJ.Float64(0.1)],
						[new OBJ.Int16(2n), new OBJ.Float64(0.2)],
						[new OBJ.Int16(3n), new OBJ.Float64(0.4)],
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
					new OBJ.SolidList<never>(),
					new OBJ.SolidDict<never>(),
					new OBJ.SolidSet<never>(),
					new OBJ.SolidMap<never, never>(),
					new OBJ.SolidList<never>(),
					new OBJ.SolidSet<never>(),
					new OBJ.SolidMap<never, never>(),
				],
			);
		});
	});
});
