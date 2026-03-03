import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	VALUE,
	TYPE,
	Optimizer,
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
		'List.<int>((1, 2, 3));',
		'Dict.<int>((a= 1, b= 2, c= 3));',
		'Set.<int>((1, 2, 3));',
		`Map.<int, float>((
			(1, 0.1),
			(2, 0.2),
		));`,
	] as const;
	const LIST_CONS = [
		'List.<int>();',
		'List.<int>(());',
		'List.<int>(List.<int>());',
		'List.<int>([]);',
		'List.<int>(Set.<int>());',
		'List.<int>({});',
		'List.<int>((1, 2, 3));',
		'List.<int>(List.<int>((1, 2, 3)));',
		'List.<int>([1, 2, 3]);',
		'List.<int>(Set.<int>((1, 2, 3)));',
		'List.<int>({1, 2, 3});',
	] as const;
	const DICT_CONS = [
		'Dict.<int>();',
		'Dict.<int>(());',
		// 'Dict.<int>((=));', // empty record is impossible
		'Dict.<int>(List.<(sym, int)>());',
		'Dict.<int>([]);',
		'Dict.<int>(Dict.<int>());',
		// 'Dict.<int>([=]);', // empty dict literal is impossible
		'Dict.<int>(Set.<(sym, int)>());',
		'Dict.<int>({});',
		'Dict.<int>(Map.<sym, int>());',
		// 'Dict.<int>({->});', // empty map literal is impossible
		`Dict.<int>((
			(@a, 1),
			(@b, 2),
			(@c, 3),
		));`,
		'Dict.<int>((a= 1, b= 2, c= 3));',
		`Dict.<int>(List.<(sym, int)>((
			(@a, 1),
			(@b, 2),
			(@c, 3),
		)));`,
		`Dict.<int>([
			(@a, 1),
			(@b, 2),
			(@c, 3),
		]);`,
		'Dict.<int>(Dict.<int>((a= 1, b= 2, c= 3)));',
		'Dict.<int>([a= 1, b= 2, c= 3]);',
		`Dict.<int>(Set.<(sym, int)>((
			(@a, 1),
			(@b, 2),
			(@c, 3),
		)));`,
		`Dict.<int>({
			(@a, 1),
			(@b, 2),
			(@c, 3),
		});`,
		`Dict.<int>(Map.<sym, int>((
			(@a, 1),
			(@b, 2),
			(@c, 3),
		)));`,
		`Dict.<int>({
			@a -> 1,
			@b -> 2,
			@c -> 3,
		});`,
	] as const;
	const SET_CONS = [
		'Set.<int>();',
		'Set.<int>(());',
		'Set.<int>(List.<int>());',
		'Set.<int>([]);',
		'Set.<int>(Set.<int>());',
		'Set.<int>({});',
		'Set.<int>((1, 2, 3));',
		'Set.<int>(List.<int>((1, 2, 3)));',
		'Set.<int>([1, 2, 3]);',
		'Set.<int>(Set.<int>((1, 2, 3)));',
		'Set.<int>({1, 2, 3});',
	] as const;
	const MAP_CONS = [
		'Map.<int, float>();',
		'Map.<int, float>(());',
		'Map.<int, float>(List.<(int, float)>());',
		'Map.<int, float>([]);',
		'Map.<int, float>(Set.<(int, float)>());',
		'Map.<int, float>({});',
		'Map.<int, float>(Map.<int, float>());',
		// 'Map.<int, float>({->});', // empty map literal is impossible
		`Map.<int, float>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		));`,
		`Map.<int, float>(List.<(int, float)>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		)));`,
		`Map.<int, float>([
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		]);`,
		`Map.<int, float>(Set.<(int, float)>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		)));`,
		`Map.<int, float>({
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		});`,
		`Map.<int, float>(Map.<int, float>((
			(1, 0.1),
			(2, 0.2),
			(3, 0.4),
		)));`,
		`Map.<int, float>({
			1 -> 0.1,
			2 -> 0.2,
			3 -> 0.4,
		});`,
	] as const;


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
				repeat(new TYPE.List(TYPE.INT, true), LIST_CONS.length),
			);
		});
		specify('`Dict.(‹…›)`', () => {
			assertEqualTypes(
				DICT_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				repeat(new TYPE.Dict(TYPE.INT, true), DICT_CONS.length),
			);
		});
		specify('`Set.(‹…›)`', () => {
			assertEqualTypes(
				SET_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				repeat(new TYPE.Set(TYPE.INT, true), SET_CONS.length),
			);
		});
		specify('`Map.(‹…›)`', () => {
			assertEqualTypes(
				MAP_CONS.map((src) => AST.ASTNodeCall.fromSource(src).type()),
				repeat(new TYPE.Map(TYPE.INT, TYPE.FLOAT, true), MAP_CONS.length),
			);
		});
		it('bypasses invariance for generic arguments.', () => {
			extract_lines`
				List.<mut {int}>((   {42},));
				Dict.<mut {int}>((a= {42}));
				Set .<mut {int}>((   {42},));
				Map.<float, mut {int}>(((4.2, {42}),));
				Map.<mut {int}, float>((({42}, 4.2),));
			`.map((src) => AST.ASTNodeCall.fromSource(src).type());
		});
		it('Map has a default type parameter.', () => {
			assertEqualTypes(
				AST.ASTNodeCall.fromSource('Map.<int>();').type(),
				new TYPE.Map(TYPE.INT, TYPE.INT, true),
			);
		});
		it('throws if base is not an ASTNodeVariable.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				null.();
				(42 || 43).<bool>();
			`, (src) => assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorNotCallable, src));
		});
		it('throws if base is not one of the allowed strings.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				SET.<str>();
				Mapping.<bool>();
			`, (src) => assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), SyntaxError, src));
		});
		it('throws when providing incorrect number of arguments.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				List.<int>((), ());
				Dict.<int>((), ());
				Set.<int>((), ());
				Map.<int>((), ());
			`, (src) => assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorArgCount, src));
		});
		it('throws when providing incorrect type of arguments.', () => {
			xjs.Map.forEachAggregated(new Map<string, readonly [string, readonly string[]]>([
				['List.<int>(42);', ['42', ['Set.<int>', 'List.<int>']]],
				['Dict.<int>(42);', ['42', ['List.<(sym, int)>', 'Set.<(sym, int)>', 'Map.<sym, int>', 'Dict.<int>']]],
				['Set.<int>(42);',  ['42', ['List.<int>', 'Set.<int>']]],
				['Map.<int>(42);',  ['42', ['List.<(int, int)>', 'Set.<(int, int)>', 'Map.<int, int>']]],
			]), ([argtype, allowed_types], src) => assert.throws(
				() => AST.ASTNodeCall.fromSource(src).type(),
				(err) => {
					assert_instanceof(err, AggregateError);
					assertAssignable(err, {
						cons:   AggregateError,
						errors: allowed_types.map((allowed_type) => ({
							cons:    TypeErrorNotAssignable,
							message: `Expression of type \`${ argtype }\` is not assignable to type \`${ allowed_type }\`.`,
						})),
					});
					return true;
				},
			));
			return xjs.Array.forEachAggregated(extract_lines`
				List.<int>((4.2,));
				Dict.<int>((4.2,));
				Set.<int>((42, "42"));
				Map.<int>(((42, "42"),));
			`, (src) => assert.throws(() => AST.ASTNodeCall.fromSource(src).type(), TypeErrorNotAssignable, src));
		});
	});


	describe('#lower', () => {
		function setupScript(src: string, opts: object): {goal: AST.ASTNodeGoal, opt: Optimizer} {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src.slice(1, -1));
			goal.varCheck();
			goal.typeCheck();
			'lower' in opts && opts.lower && goal.lower(opt);
			return {goal, opt};
		}
		specify('`List.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ LIST_CONS.join('\n') }
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DROP (LIST.NEW))
				(DECL <tuple> $0 (TUPLE.NEW))
				(DECL <List> $1 (LIST.NEW))
				(LIST.COPY (GET $1) (GET $0))
				(DROP (GET $1))
				(DECL <List> $2 (LIST.NEW))
				(DECL <List> $3 (LIST.NEW))
				(LIST.COPY (GET $3) (GET $2))
				(DROP (GET $3))
				(DECL <List> $4 (LIST.NEW))
				(DECL <List> $5 (LIST.NEW))
				(LIST.COPY (GET $5) (GET $4))
				(DROP (GET $5))
				(DECL <Set> $6 (SET.NEW))
				(DECL <List> $7 (LIST.NEW))
				(LIST.COPY (GET $7) (GET $6))
				(DROP (GET $7))
				(DECL <Set> $8 (SET.NEW))
				(DECL <List> $9 (LIST.NEW))
				(LIST.COPY (GET $9) (GET $8))
				(DROP (GET $9))
				(DECL <tuple> $10 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <List> $11 (LIST.NEW))
				(LIST.COPY (GET $11) (GET $10))
				(DROP (GET $11))
				(DECL <tuple> $12 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <List> $13 (LIST.NEW))
				(LIST.COPY (GET $13) (GET $12))
				(DECL <List> $14 (LIST.NEW))
				(LIST.COPY (GET $14) (GET $13))
				(DROP (GET $14))
				(DECL <List> $15 (LIST.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <List> $16 (LIST.NEW))
				(LIST.COPY (GET $16) (GET $15))
				(DROP (GET $16))
				(DECL <tuple> $17 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <Set> $18 (SET.NEW))
				(SET.COPY (GET $18) (GET $17))
				(DECL <List> $19 (LIST.NEW))
				(LIST.COPY (GET $19) (GET $18))
				(DROP (GET $19))
				(DECL <Set> $20 (SET.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <List> $21 (LIST.NEW))
				(LIST.COPY (GET $21) (GET $20))
				(DROP (GET $21))
			`.join('\n'));
		});
		specify('`Dict.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ DICT_CONS.join('\n') }
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DROP (DICT.NEW))
				(DECL <tuple> $0 (TUPLE.NEW))
				(DECL <Dict> $1 (DICT.NEW))
				(DICT.COPY (GET $1) (GET $0))
				(DROP (GET $1))
				(DECL <List> $2 (LIST.NEW))
				(DECL <Dict> $3 (DICT.NEW))
				(DICT.COPY (GET $3) (GET $2))
				(DROP (GET $3))
				(DECL <List> $4 (LIST.NEW))
				(DECL <Dict> $5 (DICT.NEW))
				(DICT.COPY (GET $5) (GET $4))
				(DROP (GET $5))
				(DECL <Dict> $6 (DICT.NEW))
				(DECL <Dict> $7 (DICT.NEW))
				(DICT.COPY (GET $7) (GET $6))
				(DROP (GET $7))
				(DECL <Set> $8 (SET.NEW))
				(DECL <Dict> $9 (DICT.NEW))
				(DICT.COPY (GET $9) (GET $8))
				(DROP (GET $9))
				(DECL <Set> $10 (SET.NEW))
				(DECL <Dict> $11 (DICT.NEW))
				(DICT.COPY (GET $11) (GET $10))
				(DROP (GET $11))
				(DECL <Map> $12 (MAP.NEW))
				(DECL <Dict> $13 (DICT.NEW))
				(DICT.COPY (GET $13) (GET $12))
				(DROP (GET $13))
				(DECL <tuple> $14 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL <tuple> $15 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL <tuple> $16 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL <tuple> $17 (TUPLE.NEW (GET $14) (GET $15) (GET $16)))
				(DECL <Dict> $18 (DICT.NEW))
				(DICT.COPY (GET $18) (GET $17))
				(DROP (GET $18))
				(DECL <record> $19 (RECORD.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
				(DECL <Dict> $20 (DICT.NEW))
				(DICT.COPY (GET $20) (GET $19))
				(DROP (GET $20))
				(DECL <tuple> $21 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL <tuple> $22 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL <tuple> $23 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL <tuple> $24 (TUPLE.NEW (GET $21) (GET $22) (GET $23)))
				(DECL <List> $25 (LIST.NEW))
				(LIST.COPY (GET $25) (GET $24))
				(DECL <Dict> $26 (DICT.NEW))
				(DICT.COPY (GET $26) (GET $25))
				(DROP (GET $26))
				(DECL <tuple> $27 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL <tuple> $28 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL <tuple> $29 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL <List> $30 (LIST.NEW (GET $27) (GET $28) (GET $29)))
				(DECL <Dict> $31 (DICT.NEW))
				(DICT.COPY (GET $31) (GET $30))
				(DROP (GET $31))
				(DECL <record> $32 (RECORD.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
				(DECL <Dict> $33 (DICT.NEW))
				(DICT.COPY (GET $33) (GET $32))
				(DECL <Dict> $34 (DICT.NEW))
				(DICT.COPY (GET $34) (GET $33))
				(DROP (GET $34))
				(DECL <Dict> $35 (DICT.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
				(DECL <Dict> $36 (DICT.NEW))
				(DICT.COPY (GET $36) (GET $35))
				(DROP (GET $36))
				(DECL <tuple> $37 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL <tuple> $38 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL <tuple> $39 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL <tuple> $40 (TUPLE.NEW (GET $37) (GET $38) (GET $39)))
				(DECL <Set> $41 (SET.NEW))
				(SET.COPY (GET $41) (GET $40))
				(DECL <Dict> $42 (DICT.NEW))
				(DICT.COPY (GET $42) (GET $41))
				(DROP (GET $42))
				(DECL <tuple> $43 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL <tuple> $44 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL <tuple> $45 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL <Set> $46 (SET.NEW (GET $43) (GET $44) (GET $45)))
				(DECL <Dict> $47 (DICT.NEW))
				(DICT.COPY (GET $47) (GET $46))
				(DROP (GET $47))
				(DECL <tuple> $48 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL <tuple> $49 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL <tuple> $50 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL <tuple> $51 (TUPLE.NEW (GET $48) (GET $49) (GET $50)))
				(DECL <Map> $52 (MAP.NEW))
				(MAP.COPY (GET $52) (GET $51))
				(DECL <Dict> $53 (DICT.NEW))
				(DICT.COPY (GET $53) (GET $52))
				(DROP (GET $53))
				(DECL <Map> $54 (MAP.NEW (SYM.CONST @a)->(INT.CONST 1) (SYM.CONST @b)->(INT.CONST 2) (SYM.CONST @c)->(INT.CONST 3)))
				(DECL <Dict> $55 (DICT.NEW))
				(DICT.COPY (GET $55) (GET $54))
				(DROP (GET $55))
			`.join('\n'));
		});
		specify('`Set.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ SET_CONS.join('\n') }
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DROP (SET.NEW))
				(DECL <tuple> $0 (TUPLE.NEW))
				(DECL <Set> $1 (SET.NEW))
				(SET.COPY (GET $1) (GET $0))
				(DROP (GET $1))
				(DECL <List> $2 (LIST.NEW))
				(DECL <Set> $3 (SET.NEW))
				(SET.COPY (GET $3) (GET $2))
				(DROP (GET $3))
				(DECL <List> $4 (LIST.NEW))
				(DECL <Set> $5 (SET.NEW))
				(SET.COPY (GET $5) (GET $4))
				(DROP (GET $5))
				(DECL <Set> $6 (SET.NEW))
				(DECL <Set> $7 (SET.NEW))
				(SET.COPY (GET $7) (GET $6))
				(DROP (GET $7))
				(DECL <Set> $8 (SET.NEW))
				(DECL <Set> $9 (SET.NEW))
				(SET.COPY (GET $9) (GET $8))
				(DROP (GET $9))
				(DECL <tuple> $10 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <Set> $11 (SET.NEW))
				(SET.COPY (GET $11) (GET $10))
				(DROP (GET $11))
				(DECL <tuple> $12 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <List> $13 (LIST.NEW))
				(LIST.COPY (GET $13) (GET $12))
				(DECL <Set> $14 (SET.NEW))
				(SET.COPY (GET $14) (GET $13))
				(DROP (GET $14))
				(DECL <List> $15 (LIST.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <Set> $16 (SET.NEW))
				(SET.COPY (GET $16) (GET $15))
				(DROP (GET $16))
				(DECL <tuple> $17 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <Set> $18 (SET.NEW))
				(SET.COPY (GET $18) (GET $17))
				(DECL <Set> $19 (SET.NEW))
				(SET.COPY (GET $19) (GET $18))
				(DROP (GET $19))
				(DECL <Set> $20 (SET.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL <Set> $21 (SET.NEW))
				(SET.COPY (GET $21) (GET $20))
				(DROP (GET $21))
			`.join('\n'));
		});
		specify('`Map.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ MAP_CONS.join('\n') }
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DROP (MAP.NEW))
				(DECL <tuple> $0 (TUPLE.NEW))
				(DECL <Map> $1 (MAP.NEW))
				(MAP.COPY (GET $1) (GET $0))
				(DROP (GET $1))
				(DECL <List> $2 (LIST.NEW))
				(DECL <Map> $3 (MAP.NEW))
				(MAP.COPY (GET $3) (GET $2))
				(DROP (GET $3))
				(DECL <List> $4 (LIST.NEW))
				(DECL <Map> $5 (MAP.NEW))
				(MAP.COPY (GET $5) (GET $4))
				(DROP (GET $5))
				(DECL <Set> $6 (SET.NEW))
				(DECL <Map> $7 (MAP.NEW))
				(MAP.COPY (GET $7) (GET $6))
				(DROP (GET $7))
				(DECL <Set> $8 (SET.NEW))
				(DECL <Map> $9 (MAP.NEW))
				(MAP.COPY (GET $9) (GET $8))
				(DROP (GET $9))
				(DECL <Map> $10 (MAP.NEW))
				(DECL <Map> $11 (MAP.NEW))
				(MAP.COPY (GET $11) (GET $10))
				(DROP (GET $11))
				(DECL <tuple> $12 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL <tuple> $13 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL <tuple> $14 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL <tuple> $15 (TUPLE.NEW (GET $12) (GET $13) (GET $14)))
				(DECL <Map> $16 (MAP.NEW))
				(MAP.COPY (GET $16) (GET $15))
				(DROP (GET $16))
				(DECL <tuple> $17 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL <tuple> $18 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL <tuple> $19 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL <tuple> $20 (TUPLE.NEW (GET $17) (GET $18) (GET $19)))
				(DECL <List> $21 (LIST.NEW))
				(LIST.COPY (GET $21) (GET $20))
				(DECL <Map> $22 (MAP.NEW))
				(MAP.COPY (GET $22) (GET $21))
				(DROP (GET $22))
				(DECL <tuple> $23 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL <tuple> $24 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL <tuple> $25 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL <List> $26 (LIST.NEW (GET $23) (GET $24) (GET $25)))
				(DECL <Map> $27 (MAP.NEW))
				(MAP.COPY (GET $27) (GET $26))
				(DROP (GET $27))
				(DECL <tuple> $28 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL <tuple> $29 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL <tuple> $30 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL <tuple> $31 (TUPLE.NEW (GET $28) (GET $29) (GET $30)))
				(DECL <Set> $32 (SET.NEW))
				(SET.COPY (GET $32) (GET $31))
				(DECL <Map> $33 (MAP.NEW))
				(MAP.COPY (GET $33) (GET $32))
				(DROP (GET $33))
				(DECL <tuple> $34 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL <tuple> $35 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL <tuple> $36 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL <Set> $37 (SET.NEW (GET $34) (GET $35) (GET $36)))
				(DECL <Map> $38 (MAP.NEW))
				(MAP.COPY (GET $38) (GET $37))
				(DROP (GET $38))
				(DECL <tuple> $39 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL <tuple> $40 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL <tuple> $41 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL <tuple> $42 (TUPLE.NEW (GET $39) (GET $40) (GET $41)))
				(DECL <Map> $43 (MAP.NEW))
				(MAP.COPY (GET $43) (GET $42))
				(DECL <Map> $44 (MAP.NEW))
				(MAP.COPY (GET $44) (GET $43))
				(DROP (GET $44))
				(DECL <Map> $45 (MAP.NEW (INT.CONST 1)->(FLOAT.CONST 0.1) (INT.CONST 2)->(FLOAT.CONST 0.2) (INT.CONST 3)->(FLOAT.CONST 0.4)))
				(DECL <Map> $46 (MAP.NEW))
				(MAP.COPY (GET $46) (GET $45))
				(DROP (GET $46))
			`.join('\n'));
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
				...repeat(new VALUE.Dict<never>(), 8),
				...repeat(new VALUE.Dict<VALUE.Integer>(new Map<bigint, VALUE.Integer>([
					[0x100n, TEST_VALUES[0]],
					[0x101n, TEST_VALUES[1]],
					[0x102n, TEST_VALUES[2]],
				])), 10),
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
