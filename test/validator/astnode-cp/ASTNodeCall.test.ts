import * as assert from 'node:assert';
import {
	AST,
	VALUE,
	TYPE,
	TypeErrorNotAssignable,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../../src/index.ts';



describe('ASTNodeCall', () => {
	const EVALUATE = [
		'List.<int>([1, 2, 3]);',
		'Dict.<int>([a= 1, b= 2, c= 3]);',
		'Set.<int>([1, 2, 3]);',
		`Map.<int, float>([
			[1, 0.1],
			[2, 0.2],
		]);`,
	] as const;
	const LIST_CONS = [
		'List.<int>();',
		'List.<int>([]);',
		'List.<int>(List.<int>([1, 2, 3]));',
	] as const;
	const DICT_CONS = [
		'Dict.<int>();',
	] as const;
	const SET_CONS = [
		'Set.<int>();',
		'Set.<int>([]);',
		'Set.<int>(List.<int>([1, 2, 3]));',
	] as const;
	const MAP_CONS = [
		'Map.<int, float>();',
		'Map.<int, float>([]);',
		`Map.<int, float>(List.<[int, float]>([
			[1, 0.1],
			[2, 0.2],
			[3, 0.4],
		]));`,
	] as const;


	describe('#type', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assert.deepStrictEqual(
				EVALUATE.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				[
					new TYPE.List(TYPE.INT, true),
					new TYPE.Dict(TYPE.INT, true),
					new TYPE.Set(TYPE.INT, true),
					new TYPE.Map(TYPE.INT, TYPE.FLOAT, true),
				],
			);
		});
		specify('`List.(‹…›)`', () => {
			assert.deepStrictEqual(LIST_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()), [
				new TYPE.List(TYPE.INT, true),
				new TYPE.List(TYPE.INT, true),
				new TYPE.List(TYPE.INT, true),
			]);
		});
		specify('`Dict.(‹…›)`', () => {
			assert.deepStrictEqual(DICT_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()), [
				new TYPE.Dict(TYPE.INT, true),
			]);
		});
		specify('`Set.(‹…›)`', () => {
			assert.deepStrictEqual(SET_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()), [
				new TYPE.Set(TYPE.INT, true),
				new TYPE.Set(TYPE.INT, true),
				new TYPE.Set(TYPE.INT, true),
			]);
		});
		specify('`Map.(‹…›)`', () => {
			assert.deepStrictEqual(MAP_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()), [
				new TYPE.Map(TYPE.INT, TYPE.FLOAT, true),
				new TYPE.Map(TYPE.INT, TYPE.FLOAT, true),
				new TYPE.Map(TYPE.INT, TYPE.FLOAT, true),
			]);
		});
		it('bypasses invariance for generic arguments.', () => {
			[
				'List.<mut int{}>([   {42}]);',
				'Dict.<mut int{}>([a= {42}]);',
				'Set .<mut int{}>([   {42}]);',
				'Map.<float, mut int{}>([[4.2, {42}]]);',
				'Map.<mut int{}, float>([[{42}, 4.2]]);',
			].map((src) => AST.ASTNodeCall.fromSource(src).type());
		});
		it('Map has a default type parameter.', () => {
			assert.deepStrictEqual(
				AST.ASTNodeCall.fromSource('Map.<int>();').type(),
				new TYPE.Map(TYPE.INT, TYPE.INT, true),
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
				'Map.<int>([[42, "42"]]);',
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorNotAssignable);
			});
		});
	});


	describe('#fold', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assert.deepStrictEqual(
				EVALUATE.map((src) => AST.ASTNodeCall.fromSource(src).fold()),
				[
					new VALUE.List<VALUE.Integer>([
						new VALUE.Integer(1n),
						new VALUE.Integer(2n),
						new VALUE.Integer(3n),
					]),
					new VALUE.Dict<VALUE.Integer>(new Map<bigint, VALUE.Integer>([
						[0x100n, new VALUE.Integer(1n)],
						[0x101n, new VALUE.Integer(2n)],
						[0x102n, new VALUE.Integer(3n)],
					])),
					new VALUE.Set<VALUE.Integer>(new Set<VALUE.Integer>([
						new VALUE.Integer(1n),
						new VALUE.Integer(2n),
						new VALUE.Integer(3n),
					])),
					new VALUE.Map<VALUE.Integer, VALUE.Float>(new Map<VALUE.Integer, VALUE.Float>([
						[new VALUE.Integer(1n), new VALUE.Float(0.1)],
						[new VALUE.Integer(2n), new VALUE.Float(0.2)],
					])),
				],
			);
		});
		specify('`List.(‹…›)`', () => {
			assert.deepStrictEqual(LIST_CONS.map((src) => AST.ASTNodeCall.fromSource(src).fold()), [
				new VALUE.List<never>(),
				new VALUE.List<never>(),
				new VALUE.List<VALUE.Integer>([
					new VALUE.Integer(1n),
					new VALUE.Integer(2n),
					new VALUE.Integer(3n),
				]),
			]);
		});
		specify('`Dict.(‹…›)`', () => {
			assert.deepStrictEqual(DICT_CONS.map((src) => AST.ASTNodeCall.fromSource(src).fold()), [
				new VALUE.Dict<never>(),
			]);
		});
		specify('`Set.(‹…›)`', () => {
			assert.deepStrictEqual(SET_CONS.map((src) => AST.ASTNodeCall.fromSource(src).fold()), [
				new VALUE.Set<never>(),
				new VALUE.Set<never>(),
				new VALUE.Set<VALUE.Integer>(new Set<VALUE.Integer>([
					new VALUE.Integer(1n),
					new VALUE.Integer(2n),
					new VALUE.Integer(3n),
				])),
			]);
		});
		specify('`Map.(‹…›)`', () => {
			assert.deepStrictEqual(MAP_CONS.map((src) => AST.ASTNodeCall.fromSource(src).fold()), [
				new VALUE.Map<never, never>(),
				new VALUE.Map<never, never>(),
				new VALUE.Map<VALUE.Integer, VALUE.Float>(new Map<VALUE.Integer, VALUE.Float>([
					[new VALUE.Integer(1n), new VALUE.Float(0.1)],
					[new VALUE.Integer(2n), new VALUE.Float(0.2)],
					[new VALUE.Integer(3n), new VALUE.Float(0.4)],
				])),
			]);
		});
	});
});
