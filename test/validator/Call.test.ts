import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	AST,
	TYPE,
	ReferenceErrorKind,
	TypeErrorNotAssignable,
	TypeErrorNotCallable,
	TypeErrorArgCount,
	TypeErrorAmbiguousOverload,
} from '../../src/index.ts';
import {
	extract_lines,
	repeat,
	assertAssignable,
	assertEqualTypes,
	setupScript,
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


	test.suite('#varCheck', () => {
		test.test('catches ReferenceErrorKind thrown by `Variable#varCheck`.', () => {
			setupScript(`{
				func inc(x: int): int => x + 1;
				inc.(42);
			}`, {typeCheck: false}); // assert does not throw
			const {stmts} = setupScript(`{
				func inc1(x: int): int => x + 1;
				val inc2: \\(int) => int = \\(x: int): int => x + 2;
				inc2;
				(inc1 || inc2).(42);
			}`, {varCheck: false});
			stmts[0].varCheck();
			stmts[1].varCheck();
			stmts[2].varCheck();
			return assert.throws(() => (stmts[3] as AST.STMT.StatementExpression).expr!.varCheck(), ReferenceErrorKind);
		});
	});


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
		test.test('evaluates custom functions.', () => {
			setupScript(`{
				func inc(x: int): int => x + 1;
				inc.(42);
			}`, {build: false});
		});
		test.test('allows compound base.', () => {
			setupScript(`{
				val inc1: \\(int) => int = \\(x: int): int => x + 1;
				val inc2: \\(int) => int = \\(x: int): int => x + 2;
				(inc1 || inc2).(42);
			}`, {build: false});
		});
		test.test('throws if base is not a function type.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				null.()
				(42 || 43).<bool>()
			`, (src) => assert.throws(() => AST.EXPR.Call.fromSource(src).type(), TypeErrorNotCallable));
		});
		test.test('throws when providing incorrect number (or names) of arguments.', () => {
			const {stmts} = setupScript(`{
				func inc1(x: int): int => x + 1;
				func inc2($x: int): int => x + 2;
				inc1.();
				inc1.(2, 3);
				inc1.(x= 4);
				inc2.();
				inc2.(5);
				inc2.(y= 6);
			}`, {typeCheck: false});
			stmts[0].typeCheck();
			stmts[1].typeCheck();
			xjs.Array.forEachAggregated(stmts.slice(2), (stmt) => assert.throws(() => (stmt as AST.STMT.StatementExpression).expr!.typeCheck(), TypeErrorArgCount));
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
			const {stmts} = setupScript(`{
				func inc1(x: int): int => x + 1;
				func inc2($x: int): int => x + 2;
				inc1.("3");
				inc2.(x= "4");
			}`, {typeCheck: false});
			stmts[0].typeCheck();
			stmts[1].typeCheck();
			xjs.Array.forEachAggregated(stmts.slice(2), (stmt) => assert.throws(() => (stmt as AST.STMT.StatementExpression).expr!.typeCheck(), TypeErrorNotAssignable));
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
		test.test('return type.', () => {
			assertEqualTypes((setupScript(`{
				func inc(x: int): int => x + 1;
				inc.(42);
			}`, {build: false}).stmts[1] as AST.STMT.StatementExpression).expr!.type(), TYPE.INT);
		});
		test.test('void functions have no return type.', {expectFailure: true}, () => {
			assert.strictEqual((setupScript(`{
				func inc(x: int): void { return; }
				inc.(42);
			}`, {build: false}).stmts[1] as AST.STMT.StatementExpression).expr!.type(), null);
		});
		test.suite('function overloads.', () => {
			test.test('when multiple overloads match and one is most specific, returns type of that overload.', () => {
				assertEqualTypes((setupScript(`{
					func overload_test(a: (int), b: (int,)): float => 4.2;
					func overload_test(a: (int, int), b: (int, int)): str => "hello";
					overload_test.((1, 2), (3, 4)); % matches both overloads, but 2nd is chosen; returns type \`str\`
				}`, {build: false}).stmts[2] as AST.STMT.StatementExpression).expr!.type(), TYPE.STR);
			});
			test.test('throws when multiple overloads match and none is most specific.', () => {
				const {stmts} = setupScript(`{
					func overload_test(a: (int,), b: (int, int)): bool => true;
					func overload_test(a: (int, int), b: (int,)): bool => true;
					overload_test.((1, 2), (3, 4)); % TypeErrorAmbiguousOverload: matches both overloads
				}`, {typeCheck: false});
				stmts[0].typeCheck();
				stmts[1].typeCheck();
				return assert.throws(() => (stmts[2] as AST.STMT.StatementExpression).expr!.type(), TypeErrorAmbiguousOverload);
			});
			test.test('throws when no overloads match.', () => {
				const {stmts} = setupScript(`{
					func overload_test(a: (int,), b: (int, int)): bool => true;
					func overload_test(a: (int, int), b: (int,)): bool => true;
					overload_test.((a= 1, b= 2), (c= 3, d= 4)); % TypeErrorAmbiguousOverload: matches neither overload
				}`, {typeCheck: false});
				stmts[0].typeCheck();
				stmts[1].typeCheck();
				return assert.throws(() => (stmts[2] as AST.STMT.StatementExpression).expr!.type(), TypeErrorAmbiguousOverload);
			});
		});
	});
});
