import * as assert from 'assert';
import {
	AST,
	OBJ,
	TYPE,
	TypeErrorNotAssignable,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../../src/index.js';



describe('ASTNodeCall', () => {
	const evaluate = [
		'List.<int>([1, 2, 3]);',
		'List.<int>(\\[1, 2, 3]);',
		'Dict.<int>([a= 1, b= 2, c= 3]);',
		'Dict.<int>(\\[a= 1, b= 2, c= 3]);',
		'Set.<int>([1, 2, 3]);',
		'Set.<int>(\\[1, 2, 3]);',
		`Map.<int, float>([
			  [1, 0.1],
			  [2, 0.2],
			\\[3, 0.4],
		]);`,
		`Map.<int, float>(\\[
			\\[1, 0.1],
			\\[2, 0.2],
			\\[3, 0.4],
		]);`,
	] as const;
	const list_args = [
		'List.<int>(List.<int>([1, 2, 3]));',
		'Set.<int>(List.<int>([1, 2, 3]));',
		`Map.<int, float>(List.<[int, float]>([
			[1, 0.1],
			[2, 0.2],
			[3, 0.4],
		]));`,
	] as const;
	const zero_empty = [
		'List.<int>();',
		'Dict.<int>();',
		'Set.<int>();',
		'Map.<int, float>();',
		'List.<int>([]);',
		'List.<int>(\\[]);',
		'Set.<int>([]);',
		'Set.<int>(\\[]);',
		'Map.<int, float>([]);',
		'Map.<int, float>(\\[]);',
	] as const;


	describe('#type', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assert.deepStrictEqual(
				evaluate.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				[
					new TYPE.TypeList(TYPE.INT, true),
					new TYPE.TypeList(TYPE.INT, true),
					new TYPE.TypeDict(TYPE.INT, true),
					new TYPE.TypeDict(TYPE.INT, true),
					new TYPE.TypeSet(TYPE.INT, true),
					new TYPE.TypeSet(TYPE.INT, true),
					new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT, true),
					new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT, true),
				],
			);
		});
		it('List, Set, and Map take List-type arguments.', () => {
			assert.deepStrictEqual(
				list_args.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				[
					new TYPE.TypeList(TYPE.INT, true),
					new TYPE.TypeSet(TYPE.INT, true),
					new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT, true),
				],
			);
		});
		it('zero/empty functional arguments.', () => {
			assert.deepStrictEqual(
				zero_empty.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				[
					new TYPE.TypeList(TYPE.INT, true),
					new TYPE.TypeDict(TYPE.INT, true),
					new TYPE.TypeSet(TYPE.INT, true),
					new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT, true),
					new TYPE.TypeList(TYPE.INT, true),
					new TYPE.TypeList(TYPE.INT, true),
					new TYPE.TypeSet(TYPE.INT, true),
					new TYPE.TypeSet(TYPE.INT, true),
					new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT, true),
					new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT, true),
				],
			);
		});
		it('Map has a default type parameter.', () => {
			assert.deepStrictEqual(
				AST.ASTNodeCall.fromSource('Map.<int>();').type(),
				new TYPE.TypeMap(TYPE.INT, TYPE.INT, true),
			);
		});
		it('throws if base is not an ASTNodeVariable.', () => {
			[
				'null.();',
				'(42 || 43).<bool>();',
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorNotCallable);
			});
		});
		it('throws if base is not one of the allowed strings.', () => {
			[
				'SET.<str>();',
				'Mapping.<bool>();',
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), SyntaxError);
			});
		});
		it('throws when providing incorrect number of arguments.', () => {
			[
				'List.<int>([], []);',
				'Dict.<int>([], []);',
				'Set.<int>([], []);',
				'Map.<int>([], []);',
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorArgCount);
			});
		});
		it('throws when providing incorrect type of arguments.', () => {
			[
				'List.<int>(42);',
				'Dict.<int>([4.2]);',
				'Set.<int>([42, "42"]);',
				'Map.<int>([42, "42"]);',
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorNotAssignable);
			});
		});
	});


	describe('#fold', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assert.deepStrictEqual(
				evaluate.map((src) => AST.ASTNodeCall.fromSource(src).fold()),
				[
					new OBJ.List<OBJ.Integer>([
						new OBJ.Integer(1n),
						new OBJ.Integer(2n),
						new OBJ.Integer(3n),
					]),
					new OBJ.List<OBJ.Integer>([
						new OBJ.Integer(1n),
						new OBJ.Integer(2n),
						new OBJ.Integer(3n),
					]),
					new OBJ.Dict<OBJ.Integer>(new Map<bigint, OBJ.Integer>([
						[0x100n, new OBJ.Integer(1n)],
						[0x101n, new OBJ.Integer(2n)],
						[0x102n, new OBJ.Integer(3n)],
					])),
					new OBJ.Dict<OBJ.Integer>(new Map<bigint, OBJ.Integer>([
						[0x100n, new OBJ.Integer(1n)],
						[0x101n, new OBJ.Integer(2n)],
						[0x102n, new OBJ.Integer(3n)],
					])),
					new OBJ.Set<OBJ.Integer>(new Set<OBJ.Integer>([
						new OBJ.Integer(1n),
						new OBJ.Integer(2n),
						new OBJ.Integer(3n),
					])),
					new OBJ.Set<OBJ.Integer>(new Set<OBJ.Integer>([
						new OBJ.Integer(1n),
						new OBJ.Integer(2n),
						new OBJ.Integer(3n),
					])),
					new OBJ.Map<OBJ.Integer, OBJ.Float>(new Map<OBJ.Integer, OBJ.Float>([
						[new OBJ.Integer(1n), new OBJ.Float(0.1)],
						[new OBJ.Integer(2n), new OBJ.Float(0.2)],
						[new OBJ.Integer(3n), new OBJ.Float(0.4)],
					])),
					new OBJ.Map<OBJ.Integer, OBJ.Float>(new Map<OBJ.Integer, OBJ.Float>([
						[new OBJ.Integer(1n), new OBJ.Float(0.1)],
						[new OBJ.Integer(2n), new OBJ.Float(0.2)],
						[new OBJ.Integer(3n), new OBJ.Float(0.4)],
					])),
				],
			);
		});
		it('List, Set, and Map take List-value arguments.', () => {
			assert.deepStrictEqual(
				list_args.map((src) => AST.ASTNodeCall.fromSource(src).fold()),
				[
					new OBJ.List<OBJ.Integer>([
						new OBJ.Integer(1n),
						new OBJ.Integer(2n),
						new OBJ.Integer(3n),
					]),
					new OBJ.Set<OBJ.Integer>(new Set<OBJ.Integer>([
						new OBJ.Integer(1n),
						new OBJ.Integer(2n),
						new OBJ.Integer(3n),
					])),
					new OBJ.Map<OBJ.Integer, OBJ.Float>(new Map<OBJ.Integer, OBJ.Float>([
						[new OBJ.Integer(1n), new OBJ.Float(0.1)],
						[new OBJ.Integer(2n), new OBJ.Float(0.2)],
						[new OBJ.Integer(3n), new OBJ.Float(0.4)],
					])),
				],
			);
		});
		it('zero/empty functional arguments.', () => {
			assert.deepStrictEqual(
				zero_empty.map((src) => AST.ASTNodeCall.fromSource(src).fold()),
				[
					new OBJ.List<never>(),
					new OBJ.Dict<never>(),
					new OBJ.Set<never>(),
					new OBJ.Map<never, never>(),
					new OBJ.List<never>(),
					new OBJ.List<never>(),
					new OBJ.Set<never>(),
					new OBJ.Set<never>(),
					new OBJ.Map<never, never>(),
					new OBJ.Map<never, never>(),
				],
			);
		});
	});
});
