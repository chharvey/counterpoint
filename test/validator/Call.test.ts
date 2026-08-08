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
	setupScript,
} from '../utils.ts';



test.suite('Call', () => {
	const EVALUATE = [
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
		'None.<int>()',
		'Some.<int>(42)',
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


	test.suite('#varCheck', () => {
		test.test('throws if base is not one of the allowed strings.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				SET.<str>()
				Mapping.<bool>()
			`, (src) => assert.throws(() => AST.EXPR.Call.fromSource(src).varCheck(), SyntaxError));
		});
	});


	test.suite('#type', () => {
		test.test('evaluates Integer, Natural, Float, String, List, Dict, Set, Map, None, and Some.', () => {
			assertEqualTypes(
				EVALUATE.map((src) => AST.EXPR.Call.fromSource(src).type()),
				[
					TYPE.INT,
					TYPE.NAT,
					TYPE.FLOAT,
					TYPE.STR,
					new TYPE.List(TYPE.INT, true),
					new TYPE.Dict(TYPE.INT, true),
					new TYPE.Set(TYPE.INT, true),
					new TYPE.Map(TYPE.INT, TYPE.FLOAT, true),
					new TYPE.Maybe(TYPE.INT),
					new TYPE.Maybe(TYPE.INT),
				],
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
				[`${ basesrc }.(${ argsrc })`, [argsrc, ['int', 'nat', 'float']]] as const
			)))), ([argexpr, allowed_types], src) => assert.throws(() => AST.EXPR.Call.fromSource(src).type(), (thrown) => {
				assertAssignable(thrown as Error, {
					cons:   AggregateError,
					errors: allowed_types.map((allowed_type) => ({
						cons:    TypeErrorNotAssignable,
						message: `Expression \`${ argexpr }\` is not assignable to type \`${ allowed_type }\`.`,
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
				Some.<int>(4.2)
			`, (src) => assert.throws(() => AST.EXPR.Call.fromSource(src).type(), TypeErrorNotAssignable));
		});
	});


	test.suite('#build', () => {
		test.test('`Integer.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ INT_CONS.map((src) => `${ src };`).join('\n') }
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (TOINT (INT.CONST -42)))
					(DROP (TOINT (NAT.CONST +42)))
					(DROP (TOINT (FLOAT.CONST 4.2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Natural.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ NAT_CONS.map((src) => `${ src };`).join('\n') }
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (TONAT (INT.CONST -42)))
					(DROP (TONAT (NAT.CONST +42)))
					(DROP (TONAT (FLOAT.CONST 4.2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Float.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ FLOAT_CONS.map((src) => `${ src };`).join('\n') }
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (TOFLOAT (INT.CONST -42)))
					(DROP (TOFLOAT (NAT.CONST +42)))
					(DROP (TOFLOAT (FLOAT.CONST 4.2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`String.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ STRING_CONS.map((src) => `${ src };`).join('\n') }
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (TOSTR (NULL.CONST null)))
					(DROP (TOSTR (BOOL.CONST true)))
					(DROP (TOSTR (INT.CONST -42)))
					(DROP (TOSTR (NAT.CONST +42)))
					(DROP (TOSTR (FLOAT.CONST 4.2)))
					(DROP (TOSTR (STR.CONST "hello")))
					(DECL <tuple> $0 (TUPLE.NEW))
					(DROP (TOSTR (GET $0)))
					(DECL <record> $1 (RECORD.NEW @a->(INT.CONST 1)))
					(DROP (TOSTR (GET $1)))
					(DECL <List> $2 (LIST.NEW))
					(DROP (TOSTR (GET $2)))
					(DECL <Dict> $3 (DICT.NEW @a->(INT.CONST 1)))
					(DROP (TOSTR (GET $3)))
					(DECL <Set> $4 (SET.NEW))
					(DROP (TOSTR (GET $4)))
					(DECL <Map> $5 (MAP.NEW (STR.CONST "a")->(INT.CONST 1)))
					(DROP (TOSTR (GET $5)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`List.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ LIST_CONS.map((src) => `${ src };`).join('\n') }
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (LIST.NEW))
					(DECL <List> $0 (LIST.NEW))
					(DECL <tuple> $1 (TUPLE.NEW))
					(LIST.COPY (GET $0) (GET $1))
					(DROP (GET $0))
					(DECL <List> $2 (LIST.NEW))
					(DECL <List> $3 (LIST.NEW))
					(LIST.COPY (GET $2) (GET $3))
					(DROP (GET $2))
					(DECL <List> $4 (LIST.NEW))
					(DECL <List> $5 (LIST.NEW))
					(LIST.COPY (GET $4) (GET $5))
					(DROP (GET $4))
					(DECL <List> $6 (LIST.NEW))
					(DECL <Set> $7 (SET.NEW))
					(LIST.COPY (GET $6) (GET $7))
					(DROP (GET $6))
					(DECL <List> $8 (LIST.NEW))
					(DECL <Set> $9 (SET.NEW))
					(LIST.COPY (GET $8) (GET $9))
					(DROP (GET $8))
					(DECL <List> $10 (LIST.NEW))
					(DECL <tuple> $11 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(LIST.COPY (GET $10) (GET $11))
					(DROP (GET $10))
					(DECL <List> $12 (LIST.NEW))
					(DECL <List> $13 (LIST.NEW))
					(DECL <tuple> $14 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(LIST.COPY (GET $13) (GET $14))
					(LIST.COPY (GET $12) (GET $13))
					(DROP (GET $12))
					(DECL <List> $15 (LIST.NEW))
					(DECL <List> $16 (LIST.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(LIST.COPY (GET $15) (GET $16))
					(DROP (GET $15))
					(DECL <List> $17 (LIST.NEW))
					(DECL <Set> $18 (SET.NEW))
					(DECL <tuple> $19 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(SET.COPY (GET $18) (GET $19))
					(LIST.COPY (GET $17) (GET $18))
					(DROP (GET $17))
					(DECL <List> $20 (LIST.NEW))
					(DECL <Set> $21 (SET.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(LIST.COPY (GET $20) (GET $21))
					(DROP (GET $20))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Dict.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ DICT_CONS.map((src) => `${ src };`).join('\n') }
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (DICT.NEW))
					(DECL <Dict> $0 (DICT.NEW))
					(DECL <tuple> $1 (TUPLE.NEW))
					(DICT.COPY (GET $0) (GET $1))
					(DROP (GET $0))
					(DECL <Dict> $2 (DICT.NEW))
					(DECL <List> $3 (LIST.NEW))
					(DICT.COPY (GET $2) (GET $3))
					(DROP (GET $2))
					(DECL <Dict> $4 (DICT.NEW))
					(DECL <List> $5 (LIST.NEW))
					(DICT.COPY (GET $4) (GET $5))
					(DROP (GET $4))
					(DECL <Dict> $6 (DICT.NEW))
					(DECL <Dict> $7 (DICT.NEW))
					(DICT.COPY (GET $6) (GET $7))
					(DROP (GET $6))
					(DECL <Dict> $8 (DICT.NEW))
					(DECL <Set> $9 (SET.NEW))
					(DICT.COPY (GET $8) (GET $9))
					(DROP (GET $8))
					(DECL <Dict> $10 (DICT.NEW))
					(DECL <Set> $11 (SET.NEW))
					(DICT.COPY (GET $10) (GET $11))
					(DROP (GET $10))
					(DECL <Dict> $12 (DICT.NEW))
					(DECL <Map> $13 (MAP.NEW))
					(DICT.COPY (GET $12) (GET $13))
					(DROP (GET $12))
					(DECL <Dict> $14 (DICT.NEW))
					(DECL <tuple> $15 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
					(DECL <tuple> $16 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
					(DECL <tuple> $17 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
					(DECL <tuple> $18 (TUPLE.NEW (GET $15) (GET $16) (GET $17)))
					(DICT.COPY (GET $14) (GET $18))
					(DROP (GET $14))
					(DECL <Dict> $19 (DICT.NEW))
					(DECL <record> $20 (RECORD.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
					(DICT.COPY (GET $19) (GET $20))
					(DROP (GET $19))
					(DECL <Dict> $21 (DICT.NEW))
					(DECL <List> $22 (LIST.NEW))
					(DECL <tuple> $23 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
					(DECL <tuple> $24 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
					(DECL <tuple> $25 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
					(DECL <tuple> $26 (TUPLE.NEW (GET $23) (GET $24) (GET $25)))
					(LIST.COPY (GET $22) (GET $26))
					(DICT.COPY (GET $21) (GET $22))
					(DROP (GET $21))
					(DECL <Dict> $27 (DICT.NEW))
					(DECL <tuple> $28 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
					(DECL <tuple> $29 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
					(DECL <tuple> $30 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
					(DECL <List> $31 (LIST.NEW (GET $28) (GET $29) (GET $30)))
					(DICT.COPY (GET $27) (GET $31))
					(DROP (GET $27))
					(DECL <Dict> $32 (DICT.NEW))
					(DECL <Dict> $33 (DICT.NEW))
					(DECL <record> $34 (RECORD.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
					(DICT.COPY (GET $33) (GET $34))
					(DICT.COPY (GET $32) (GET $33))
					(DROP (GET $32))
					(DECL <Dict> $35 (DICT.NEW))
					(DECL <Dict> $36 (DICT.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
					(DICT.COPY (GET $35) (GET $36))
					(DROP (GET $35))
					(DECL <Dict> $37 (DICT.NEW))
					(DECL <Set> $38 (SET.NEW))
					(DECL <tuple> $39 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
					(DECL <tuple> $40 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
					(DECL <tuple> $41 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
					(DECL <tuple> $42 (TUPLE.NEW (GET $39) (GET $40) (GET $41)))
					(SET.COPY (GET $38) (GET $42))
					(DICT.COPY (GET $37) (GET $38))
					(DROP (GET $37))
					(DECL <Dict> $43 (DICT.NEW))
					(DECL <tuple> $44 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
					(DECL <tuple> $45 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
					(DECL <tuple> $46 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
					(DECL <Set> $47 (SET.NEW (GET $44) (GET $45) (GET $46)))
					(DICT.COPY (GET $43) (GET $47))
					(DROP (GET $43))
					(DECL <Dict> $48 (DICT.NEW))
					(DECL <Map> $49 (MAP.NEW))
					(DECL <tuple> $50 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
					(DECL <tuple> $51 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
					(DECL <tuple> $52 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
					(DECL <tuple> $53 (TUPLE.NEW (GET $50) (GET $51) (GET $52)))
					(MAP.COPY (GET $49) (GET $53))
					(DICT.COPY (GET $48) (GET $49))
					(DROP (GET $48))
					(DECL <Dict> $54 (DICT.NEW))
					(DECL <Map> $55 (MAP.NEW (SYM.CONST @a)->(INT.CONST 1) (SYM.CONST @b)->(INT.CONST 2) (SYM.CONST @c)->(INT.CONST 3)))
					(DICT.COPY (GET $54) (GET $55))
					(DROP (GET $54))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Set.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ SET_CONS.map((src) => `${ src };`).join('\n') }
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (SET.NEW))
					(DECL <Set> $0 (SET.NEW))
					(DECL <tuple> $1 (TUPLE.NEW))
					(SET.COPY (GET $0) (GET $1))
					(DROP (GET $0))
					(DECL <Set> $2 (SET.NEW))
					(DECL <List> $3 (LIST.NEW))
					(SET.COPY (GET $2) (GET $3))
					(DROP (GET $2))
					(DECL <Set> $4 (SET.NEW))
					(DECL <List> $5 (LIST.NEW))
					(SET.COPY (GET $4) (GET $5))
					(DROP (GET $4))
					(DECL <Set> $6 (SET.NEW))
					(DECL <Set> $7 (SET.NEW))
					(SET.COPY (GET $6) (GET $7))
					(DROP (GET $6))
					(DECL <Set> $8 (SET.NEW))
					(DECL <Set> $9 (SET.NEW))
					(SET.COPY (GET $8) (GET $9))
					(DROP (GET $8))
					(DECL <Set> $10 (SET.NEW))
					(DECL <tuple> $11 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(SET.COPY (GET $10) (GET $11))
					(DROP (GET $10))
					(DECL <Set> $12 (SET.NEW))
					(DECL <List> $13 (LIST.NEW))
					(DECL <tuple> $14 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(LIST.COPY (GET $13) (GET $14))
					(SET.COPY (GET $12) (GET $13))
					(DROP (GET $12))
					(DECL <Set> $15 (SET.NEW))
					(DECL <List> $16 (LIST.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(SET.COPY (GET $15) (GET $16))
					(DROP (GET $15))
					(DECL <Set> $17 (SET.NEW))
					(DECL <Set> $18 (SET.NEW))
					(DECL <tuple> $19 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(SET.COPY (GET $18) (GET $19))
					(SET.COPY (GET $17) (GET $18))
					(DROP (GET $17))
					(DECL <Set> $20 (SET.NEW))
					(DECL <Set> $21 (SET.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
					(SET.COPY (GET $20) (GET $21))
					(DROP (GET $20))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Map.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ MAP_CONS.map((src) => `${ src };`).join('\n') }
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (MAP.NEW))
					(DECL <Map> $0 (MAP.NEW))
					(DECL <tuple> $1 (TUPLE.NEW))
					(MAP.COPY (GET $0) (GET $1))
					(DROP (GET $0))
					(DECL <Map> $2 (MAP.NEW))
					(DECL <List> $3 (LIST.NEW))
					(MAP.COPY (GET $2) (GET $3))
					(DROP (GET $2))
					(DECL <Map> $4 (MAP.NEW))
					(DECL <List> $5 (LIST.NEW))
					(MAP.COPY (GET $4) (GET $5))
					(DROP (GET $4))
					(DECL <Map> $6 (MAP.NEW))
					(DECL <Set> $7 (SET.NEW))
					(MAP.COPY (GET $6) (GET $7))
					(DROP (GET $6))
					(DECL <Map> $8 (MAP.NEW))
					(DECL <Set> $9 (SET.NEW))
					(MAP.COPY (GET $8) (GET $9))
					(DROP (GET $8))
					(DECL <Map> $10 (MAP.NEW))
					(DECL <Map> $11 (MAP.NEW))
					(MAP.COPY (GET $10) (GET $11))
					(DROP (GET $10))
					(DECL <Map> $12 (MAP.NEW))
					(DECL <tuple> $13 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
					(DECL <tuple> $14 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
					(DECL <tuple> $15 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
					(DECL <tuple> $16 (TUPLE.NEW (GET $13) (GET $14) (GET $15)))
					(MAP.COPY (GET $12) (GET $16))
					(DROP (GET $12))
					(DECL <Map> $17 (MAP.NEW))
					(DECL <List> $18 (LIST.NEW))
					(DECL <tuple> $19 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
					(DECL <tuple> $20 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
					(DECL <tuple> $21 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
					(DECL <tuple> $22 (TUPLE.NEW (GET $19) (GET $20) (GET $21)))
					(LIST.COPY (GET $18) (GET $22))
					(MAP.COPY (GET $17) (GET $18))
					(DROP (GET $17))
					(DECL <Map> $23 (MAP.NEW))
					(DECL <tuple> $24 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
					(DECL <tuple> $25 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
					(DECL <tuple> $26 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
					(DECL <List> $27 (LIST.NEW (GET $24) (GET $25) (GET $26)))
					(MAP.COPY (GET $23) (GET $27))
					(DROP (GET $23))
					(DECL <Map> $28 (MAP.NEW))
					(DECL <Set> $29 (SET.NEW))
					(DECL <tuple> $30 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
					(DECL <tuple> $31 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
					(DECL <tuple> $32 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
					(DECL <tuple> $33 (TUPLE.NEW (GET $30) (GET $31) (GET $32)))
					(SET.COPY (GET $29) (GET $33))
					(MAP.COPY (GET $28) (GET $29))
					(DROP (GET $28))
					(DECL <Map> $34 (MAP.NEW))
					(DECL <tuple> $35 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
					(DECL <tuple> $36 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
					(DECL <tuple> $37 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
					(DECL <Set> $38 (SET.NEW (GET $35) (GET $36) (GET $37)))
					(MAP.COPY (GET $34) (GET $38))
					(DROP (GET $34))
					(DECL <Map> $39 (MAP.NEW))
					(DECL <Map> $40 (MAP.NEW))
					(DECL <tuple> $41 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
					(DECL <tuple> $42 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
					(DECL <tuple> $43 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
					(DECL <tuple> $44 (TUPLE.NEW (GET $41) (GET $42) (GET $43)))
					(MAP.COPY (GET $40) (GET $44))
					(MAP.COPY (GET $39) (GET $40))
					(DROP (GET $39))
					(DECL <Map> $45 (MAP.NEW))
					(DECL <Map> $46 (MAP.NEW (INT.CONST 1)->(FLOAT.CONST 0.1) (INT.CONST 2)->(FLOAT.CONST 0.2) (INT.CONST 3)->(FLOAT.CONST 0.4)))
					(MAP.COPY (GET $45) (GET $46))
					(DROP (GET $45))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`None.()`', () => {
			assert.strictEqual(setupScript(`{
				None.<int>();
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (MAYBE.NEW))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Some.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				Some.<int>(42);
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (MAYBE.NEW (INT.CONST 42)))
					(ENDPROGRAM)
			`.trim());
		});
	});
});
