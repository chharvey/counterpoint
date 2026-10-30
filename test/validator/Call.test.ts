import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	AST,
	TYPE,
	TypeErrorNotAssignable,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../src/index.ts';
import {
	extract_lines,
	repeat,
	assertAssignable,
	assertEqualTypes,
} from '../utils.ts';



test.suite('Call', () => {
	const EVALUATE = [
		'Boolean.(42)',
		'Integer.(42)',
		'Natural.(42)',
		'Float.(42)',
		'String.(42)',
		'List.<int>((1, 2, 3))',
		'Dict.<int>((a= 1, b= 2, c= 3))',
		'Set.<int>((1, 2, 3))',
		`Map.<int, float>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		))`,
		'Exception.("message")',
		'None.<int>()',
		'Some.<int>(42)',
		'Fail.<int>(Exception.("message"))',
		'Ok.<int>(42)',
		'Fail.<int, Exception>(Exception.("message"))',
		'Ok.<int, Exception>(42)',
	] as const;
	const BOOL_CONS = [
		'Boolean.(null)',
		'Boolean.(false)',
		'Boolean.(true)',
		'Boolean.(@hello)',
		'Boolean.(-0)',
		'Boolean.(-42)',
		'Boolean.(+0)',
		'Boolean.(+42)',
		'Boolean.(0.0)',
		'Boolean.(4.2)',
		'Boolean.("hello")',
	] as const;
	const INT_CONS = [
		'Integer.(-42)',
		'Integer.(+42)',
		'Integer.(4.2)',
	] as const;
	const NAT_CONS = [
		'Natural.(-42)',
		'Natural.(+42)',
		'Natural.(4.2)',
	] as const;
	const FLOAT_CONS = [
		'Float.(-42)',
		'Float.(+42)',
		'Float.(4.2)',
	] as const;
	const STRING_CONS = [
		'String.(null)',
		'String.(true)',
		'String.(-42)',
		'String.(+42)',
		'String.(4.2)',
		'String.("hello")',
		'String.(())',
		'String.((a= 1))',
		'String.([])',
		'String.([a= 1])',
		'String.({})',
		'String.({"a" -> 1})',
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
		'Dict.<int>(())',
		// 'Dict.<int>((=))', // empty record is impossible
		'Dict.<int>(List.<(sym, int)>())',
		'Dict.<int>([])',
		'Dict.<int>(Dict.<int>())',
		// 'Dict.<int>([=])', // empty dict literal is impossible
		'Dict.<int>(Set.<(sym, int)>())',
		'Dict.<int>({})',
		'Dict.<int>(Map.<sym, int>())',
		// 'Dict.<int>({->})', // empty map literal is impossible
		`Dict.<int>((
			(@a, 1),
			(@b, 2),
			(@c, 3),
		))`,
		'Dict.<int>((a= 1, b= 2, c= 3))',
		`Dict.<int>(List.<(sym, int)>((
			(@a, 1),
			(@b, 2),
			(@c, 3),
		)))`,
		`Dict.<int>([
			(@a, 1),
			(@b, 2),
			(@c, 3),
		])`,
		'Dict.<int>(Dict.<int>((a= 1, b= 2, c= 3)))',
		'Dict.<int>([a= 1, b= 2, c= 3])',
		`Dict.<int>(Set.<(sym, int)>((
			(@a, 1),
			(@b, 2),
			(@c, 3),
		)))`,
		`Dict.<int>({
			(@a, 1),
			(@b, 2),
			(@c, 3),
		})`,
		`Dict.<int>(Map.<sym, int>((
			(@a, 1),
			(@b, 2),
			(@c, 3),
		)))`,
		`Dict.<int>({
			@a -> 1,
			@b -> 2,
			@c -> 3,
		})`,
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
	const EXCEPTION_CONS = [
		'Exception.("message")',
		'Exception.("message", Exception.("cause"))',
	] as const;


	test.suite('#type', () => {
		test.test('evaluates Callable Class Names.', () => {
			assertEqualTypes(
				EVALUATE.map((src) => AST.EXPR.Call.fromSource(src).type()),
				[
					TYPE.BOOL,
					TYPE.INT,
					TYPE.NAT,
					TYPE.FLOAT,
					TYPE.STR,
					new TYPE.List(TYPE.INT, true),
					new TYPE.Dict(TYPE.INT, true),
					new TYPE.Set(TYPE.INT, true),
					new TYPE.Map(TYPE.INT, TYPE.FLOAT, true),
					TYPE.EXCP,
					new TYPE.None(TYPE.INT),
					new TYPE.Some(TYPE.INT),
					new TYPE.Fail(TYPE.INT),
					new TYPE.Ok(TYPE.INT),
					new TYPE.Fail(TYPE.INT),
					new TYPE.Ok(TYPE.INT),
				],
			);
		});
		test.test('`Boolean.(‹…›)`', () => {
			assertEqualTypes(
				BOOL_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(TYPE.BOOL, BOOL_CONS.length),
			);
		});
		test.test('`Integer.(‹…›)`', () => {
			assertEqualTypes(
				INT_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(TYPE.INT, INT_CONS.length),
			);
		});
		test.test('`Natural.(‹…›)`', () => {
			assertEqualTypes(
				NAT_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(TYPE.NAT, NAT_CONS.length),
			);
		});
		test.test('`Float.(‹…›)`', () => {
			assertEqualTypes(
				FLOAT_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(TYPE.FLOAT, FLOAT_CONS.length),
			);
		});
		test.test('`String.(‹…›)`', () => {
			assertEqualTypes(
				STRING_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(TYPE.STR, STRING_CONS.length),
			);
		});
		test.test('`List.(‹…›)`', () => {
			assertEqualTypes(
				LIST_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(new TYPE.List(TYPE.INT, true), LIST_CONS.length),
			);
		});
		test.test('`Dict.(‹…›)`', () => {
			assertEqualTypes(
				DICT_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(new TYPE.Dict(TYPE.INT, true), DICT_CONS.length),
			);
		});
		test.test('`Set.(‹…›)`', () => {
			assertEqualTypes(
				SET_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(new TYPE.Set(TYPE.INT, true), SET_CONS.length),
			);
		});
		test.test('`Map.(‹…›)`', () => {
			assertEqualTypes(
				MAP_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(new TYPE.Map(TYPE.INT, TYPE.FLOAT, true), MAP_CONS.length),
			);
		});
		test.test('`Exception.(‹…›)`', () => {
			assertEqualTypes(
				EXCEPTION_CONS.map((src) => AST.EXPR.Call.fromSource(src).type()),
				repeat(TYPE.EXCP, EXCEPTION_CONS.length),
			);
		});
		test.test('`Maybe.()` and `Result.()` throw.', () => {
			xjs.Array.forEachAggregated([
				'Maybe.<int>()',
				'Maybe.<int>(42)',
				'Result.<int>(42)',
				'Result.<int>(Exception.("message"))',
			], (src) => {
				const call: AST.EXPR.Call = AST.EXPR.Call.fromSource(src);
				return assert.throws(() => call.type(), TypeErrorNotCallable);
			});
		});
		test.test('bypasses invariance for generic arguments.', () => {
			extract_lines`
				List.<mut {int}>((   {42},))
				Dict.<mut {int}>((a= {42}))
				Set .<mut {int}>((   {42},))
				Map.<float, mut {int}>(((4.2, {42}),))
				Map.<mut {int}, float>((({42}, 4.2),))
			`.map((src) => AST.EXPR.Call.fromSource(src).type());
		});
		test.test('Map has a default type parameter.', () => {
			assertEqualTypes(
				AST.EXPR.Call.fromSource('Map.<int>()').type(),
				new TYPE.Map(TYPE.INT, TYPE.INT, true),
			);
		});
		test.test('throws if base is not a Variable.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				null.()
				(42 || 43).<bool>()
			`, (src) => assert.throws(() => AST.EXPR.Call.fromSource(src).type(), TypeErrorNotCallable));
		});
		test.test('throws when providing incorrect number of arguments.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				Integer.()
				Integer.(1, 2)
				Natural.()
				Natural.(1, 2)
				Float.()
				Float.(1, 2)
				String.()
				String.(1, 2)
				List.<int>((), ())
				Dict.<int>((), ())
				Set.<int>((), ())
				Map.<int>((), ())
				None.<int>(42)
				Some.<int>()
			`, (src) => assert.throws(() => AST.EXPR.Call.fromSource(src).type(), TypeErrorArgCount));
		});
		test.test('throws when providing incorrect type of arguments.', () => {
			// API overload checks
			xjs.Map.forEachAggregated(new Map<string, readonly [string, readonly string[]]>(['Integer', 'Natural', 'Float'].flatMap((basesrc) => ['()', '[]', '{}'].map((argsrc) => (
				[`${basesrc}.(${argsrc})`, [argsrc, ['int', 'nat', 'float']]] as const
			)))), ([argexpr, allowed_types], src) => assert.throws(() => AST.EXPR.Call.fromSource(src).type(), (thrown) => {
				assertAssignable(thrown as Error, {
					cons:   AggregateError,
					errors: allowed_types.map((allowed_type) => ({
						cons:    TypeErrorNotAssignable,
						message: `Expression \`${argexpr}\` is not assignable to type \`${allowed_type}\`.`,
					})),
				});
				return true;
			}));
			xjs.Map.forEachAggregated(new Map<string, readonly [string, readonly string[]]>([
				['List.<int>(42)', ['42', ['List.<int>', 'Set.<int>']]],
				['Dict.<int>(42)', ['42', ['List.<(sym, int)>', 'Dict.<int>', 'Set.<(sym, int)>', 'Map.<sym, int>']]],
				['Set.<int>(42)',  ['42', ['List.<int>', 'Set.<int>']]],
				['Map.<int>(42)',  ['42', ['List.<(int, int)>', 'Set.<(int, int)>', 'Map.<int, int>']]],
			]), ([argexpr, allowed_types], src) => assert.throws(
				() => AST.EXPR.Call.fromSource(src).type(),
				(err) => {
					assertAssignable(err as Error, {
						cons:   AggregateError,
						errors: [
							{cons: TypeErrorArgCount, message: 'Got 1 arguments, but expected 0.'},
							...allowed_types.map((allowed_type) => ({
								cons:    TypeErrorNotAssignable,
								message: `Expression \`${argexpr}\` is not assignable to type \`${allowed_type}\`.`,
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
				Some.<int>(4.2)
			`, (src) => assert.throws(() => AST.EXPR.Call.fromSource(src).type(), TypeErrorNotAssignable));
		});
	});
});
