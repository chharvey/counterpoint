import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	VALUE,
	TYPE,
	TypeErrorNotAssignable,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../../src/index.ts';
import {
	assertEqualTypes,
	assertAssignable,
} from '../../assert-helpers.ts';
import {
	extract_lines,
	repeat,
} from '../../utils.ts';



describe('ASTNodeCall', () => {
	const EVALUATE = [
		'List.<int>((1, 2, 3))',
		'Dict.<int>((a= 1, b= 2, c= 3))',
		'Set.<int>((1, 2, 3))',
		`Map.<int, float>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		))`,
	] as const;
	const LIST_CONS = [
		'List.<int>()',
		'List.<int>(())',
		'List.<int>(List.<int>())',
		'List.<int>([])',
		'List.<int>(Set.<int>())',
		'List.<int>({})',
		'List.<int>((1, 2, 3))',
		'List.<int>(List.<int>((1, 2, 3)))',
		'List.<int>([1, 2, 3])',
		'List.<int>(Set.<int>((1, 2, 3)))',
		'List.<int>({1, 2, 3})',
	] as const;
	const DICT_CONS = [
		'Dict.<int>()',
		// 'Dict.<int>((=))', // empty record is impossible
		'Dict.<int>(Dict.<int>())',
		// 'Dict.<int>([=])', // empty dict literal is impossible
		'Dict.<int>((a= 1, b= 2, c= 3))',
		'Dict.<int>(Dict.<int>((a= 1, b= 2, c= 3)))',
		'Dict.<int>([a= 1, b= 2, c= 3])',
	] as const;
	const SET_CONS = [
		'Set.<int>()',
		'Set.<int>(())',
		'Set.<int>(List.<int>())',
		'Set.<int>([])',
		'Set.<int>(Set.<int>())',
		'Set.<int>({})',
		'Set.<int>((1, 2, 3))',
		'Set.<int>(List.<int>((1, 2, 3)))',
		'Set.<int>([1, 2, 3])',
		'Set.<int>(Set.<int>((1, 2, 3)))',
		'Set.<int>({1, 2, 3})',
	] as const;
	const MAP_CONS = [
		'Map.<int, float>()',
		'Map.<int, float>(())',
		'Map.<int, float>(List.<(int, float)>())',
		'Map.<int, float>([])',
		'Map.<int, float>(Set.<(int, float)>())',
		'Map.<int, float>({})',
		'Map.<int, float>(Map.<int, float>())',
		// 'Map.<int, float>({->})', // empty map literal is impossible
		`Map.<int, float>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		))`,
		`Map.<int, float>(List.<(int, float)>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		)))`,
		`Map.<int, float>([
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		])`,
		`Map.<int, float>(Set.<(int, float)>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		)))`,
		`Map.<int, float>({
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		})`,
		`Map.<int, float>(Map.<int, float>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		)))`,
		`Map.<int, float>({
			1 -> 0.1,
			2 -> 0.2,
			3 -> 0.4,
		})`,
	] as const;


	describe('#varCheck', () => {
		it('throws if base is not one of the allowed strings.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				SET.<str>()
				Mapping.<bool>()
			`, (src) => assert.throws(() => AST.ASTNodeCall.fromSource(src).varCheck(), SyntaxError));
		});
	});


	describe('#type', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assertEqualTypes(
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
			assertEqualTypes(
				LIST_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				repeat(new TYPE.List(TYPE.INT, true), 11),
			);
		});
		specify('`Dict.(‹…›)`', () => {
			assertEqualTypes(
				DICT_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				repeat(new TYPE.Dict(TYPE.INT, true), 5),
			);
		});
		specify('`Set.(‹…›)`', () => {
			assertEqualTypes(
				SET_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				repeat(new TYPE.Set(TYPE.INT, true), 11),
			);
		});
		specify('`Map.(‹…›)`', () => {
			assertEqualTypes(
				MAP_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				repeat(new TYPE.Map(TYPE.INT, TYPE.FLOAT, true), 14),
			);
		});
		it('bypasses invariance for generic arguments.', () => {
			extract_lines`
				List.<mut {int}>((   {42},))
				Dict.<mut {int}>((a= {42}))
				Set .<mut {int}>((   {42},))
				Map.<float, mut {int}>(((4.2, {42}),))
				Map.<mut {int}, float>((({42}, 4.2),))
			`.map((src) => AST.ASTNodeCall.fromSource(src).type());
		});
		it('Map has a default type parameter.', () => {
			assertEqualTypes(
				AST.ASTNodeCall.fromSource('Map.<int>()').type(),
				new TYPE.Map(TYPE.INT, TYPE.INT, true),
			);
		});
		it('throws if base is not an ASTNodeVariable.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				null.()
				(42 || 43).<bool>()
			`, (src) => assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorNotCallable));
		});
		it('throws when providing incorrect number of arguments.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				List.<int>((), ())
				Dict.<int>((), ())
				Set.<int>((), ())
				Map.<int>((), ())
			`, (src) => assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorArgCount));
		});
		it('throws when providing incorrect type of arguments.', () => {
			// API overload checks
			xjs.Map.forEachAggregated(new Map<string, readonly [string, readonly string[]]>([
				['List.<int>(42)', ['42', ['List.<int>', 'Set.<int>']]],
				['Dict.<int>(42)', ['42', ['Dict.<int>']]],
				['Set.<int>(42)',  ['42', ['List.<int>', 'Set.<int>']]],
				['Map.<int>(42)',  ['42', ['List.<(int, int)>', 'Set.<(int, int)>', 'Map.<int, int>']]],
			]), ([argexpr, allowed_types], src) => assert.throws(
				() => AST.ASTNodeCall.fromSource(src).type(),
				(err) => {
					assert_instanceof(err, AggregateError);
					assertAssignable(err, {
						cons:   AggregateError,
						errors: [
							{cons: TypeErrorArgCount, message: 'Got `1` arguments, but expected `0`.'},
							...allowed_types.map((allowed_type) => ({
								cons:    TypeErrorNotAssignable,
								message: `Expression \`${ argexpr }\` is not assignable to type \`${ allowed_type }\`.`,
							})),
						],
					});
					return true;
				},
			));
			// if API overload checks fail, check allowed types not in API
			return xjs.Array.forEachAggregated(extract_lines`
				List.<int>((4.2,))
				Dict.<int>((a= 4.2))
				Set.<int>((42, "42"))
				Map.<int>(((42, "42"),))
			`, (src) => assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorNotAssignable));
		});
	});


	describe('#fold', () => {
		const TEST_VALUES = [
			VALUE.INT_1,
			new VALUE.Integer(2n),
			new VALUE.Integer(3n),
		] as const;
		it('evaluates List, Dict, Set, and Map.', () => {
			assert.deepStrictEqual(
				EVALUATE.map((src) => AST.ASTNodeCall.fromSource(src).fold()),
				[
					new VALUE.List<VALUE.Integer>(TEST_VALUES),
					new VALUE.Dict<VALUE.Integer>(new Map<bigint, VALUE.Integer>([
						[0x100n, TEST_VALUES[0]],
						[0x101n, TEST_VALUES[1]],
						[0x102n, TEST_VALUES[2]],
					])),
					new VALUE.Set<VALUE.Integer>(new Set<VALUE.Integer>(TEST_VALUES)),
					new VALUE.Map<VALUE.Integer, VALUE.Float>(new Map<VALUE.Integer, VALUE.Float>([
						[TEST_VALUES[0], new VALUE.Float(0.1)],
						[TEST_VALUES[1], new VALUE.Float(0.2)],
						[TEST_VALUES[2], new VALUE.Float(0.4)],
					])),
				],
			);
		});
		specify('`List.(‹…›)`', () => {
			assert.deepStrictEqual(LIST_CONS.map((src) => AST.ASTNodeCall.fromSource(src).fold()), [
				...repeat(new VALUE.List<never>(), 6),
				...repeat(new VALUE.List<VALUE.Integer>(TEST_VALUES), 5),
			]);
		});
		specify('`Dict.(‹…›)`', () => {
			assert.deepStrictEqual(DICT_CONS.map((src) => AST.ASTNodeCall.fromSource(src).fold()), [
				...repeat(new VALUE.Dict<never>(), 2),
				...repeat(new VALUE.Dict<VALUE.Integer>(new Map<bigint, VALUE.Integer>([
					[0x100n, TEST_VALUES[0]],
					[0x101n, TEST_VALUES[1]],
					[0x102n, TEST_VALUES[2]],
				])), 3),
			]);
		});
		specify('`Set.(‹…›)`', () => {
			assert.deepStrictEqual(SET_CONS.map((src) => AST.ASTNodeCall.fromSource(src).fold()), [
				...repeat(new VALUE.Set<never>(), 6),
				...repeat(new VALUE.Set<VALUE.Integer>(new Set<VALUE.Integer>(TEST_VALUES)), 5),
			]);
		});
		specify('`Map.(‹…›)`', () => {
			assert.deepStrictEqual(MAP_CONS.map((src) => AST.ASTNodeCall.fromSource(src).fold()), [
				...repeat(new VALUE.Map<never, never>(), 7),
				...repeat(new VALUE.Map<VALUE.Integer, VALUE.Float>(new Map<VALUE.Integer, VALUE.Float>([
					[TEST_VALUES[0], new VALUE.Float(0.1)],
					[TEST_VALUES[1], new VALUE.Float(0.2)],
					[TEST_VALUES[2], new VALUE.Float(0.4)],
				])), 7),
			]);
		});
	});
});
