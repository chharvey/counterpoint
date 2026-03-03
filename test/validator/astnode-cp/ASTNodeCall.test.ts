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
				(DECL TUPLE $0 (TUPLE.NEW))
				(DECL LIST $1 (LIST.NEW))
				(LIST.COPY (GET $1) (GET $0))
				(DROP (GET $1))
				(DECL LIST $2 (LIST.NEW))
				(DECL LIST $3 (LIST.NEW))
				(LIST.COPY (GET $3) (GET $2))
				(DROP (GET $3))
				(DECL LIST $4 (LIST.NEW))
				(DECL LIST $5 (LIST.NEW))
				(LIST.COPY (GET $5) (GET $4))
				(DROP (GET $5))
				(DECL SET $6 (SET.NEW))
				(DECL LIST $7 (LIST.NEW))
				(LIST.COPY (GET $7) (GET $6))
				(DROP (GET $7))
				(DECL SET $8 (SET.NEW))
				(DECL LIST $9 (LIST.NEW))
				(LIST.COPY (GET $9) (GET $8))
				(DROP (GET $9))
				(DECL TUPLE $10 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL LIST $11 (LIST.NEW))
				(LIST.COPY (GET $11) (GET $10))
				(DROP (GET $11))
				(DECL TUPLE $12 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL LIST $13 (LIST.NEW))
				(LIST.COPY (GET $13) (GET $12))
				(DECL LIST $14 (LIST.NEW))
				(LIST.COPY (GET $14) (GET $13))
				(DROP (GET $14))
				(DECL LIST $15 (LIST.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL LIST $16 (LIST.NEW))
				(LIST.COPY (GET $16) (GET $15))
				(DROP (GET $16))
				(DECL TUPLE $17 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL SET $18 (SET.NEW))
				(SET.COPY (GET $18) (GET $17))
				(DECL LIST $19 (LIST.NEW))
				(LIST.COPY (GET $19) (GET $18))
				(DROP (GET $19))
				(DECL SET $20 (SET.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL LIST $21 (LIST.NEW))
				(LIST.COPY (GET $21) (GET $20))
				(DROP (GET $21))
			`.join('\n'));
		});
		specify('`Dict.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ DICT_CONS.join('\n') }
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DROP (DICT.NEW))
				(DECL TUPLE $0 (TUPLE.NEW))
				(DECL DICT $1 (DICT.NEW))
				(DICT.COPY (GET $1) (GET $0))
				(DROP (GET $1))
				(DECL LIST $2 (LIST.NEW))
				(DECL DICT $3 (DICT.NEW))
				(DICT.COPY (GET $3) (GET $2))
				(DROP (GET $3))
				(DECL LIST $4 (LIST.NEW))
				(DECL DICT $5 (DICT.NEW))
				(DICT.COPY (GET $5) (GET $4))
				(DROP (GET $5))
				(DECL DICT $6 (DICT.NEW))
				(DECL DICT $7 (DICT.NEW))
				(DICT.COPY (GET $7) (GET $6))
				(DROP (GET $7))
				(DECL SET $8 (SET.NEW))
				(DECL DICT $9 (DICT.NEW))
				(DICT.COPY (GET $9) (GET $8))
				(DROP (GET $9))
				(DECL SET $10 (SET.NEW))
				(DECL DICT $11 (DICT.NEW))
				(DICT.COPY (GET $11) (GET $10))
				(DROP (GET $11))
				(DECL MAP $12 (MAP.NEW))
				(DECL DICT $13 (DICT.NEW))
				(DICT.COPY (GET $13) (GET $12))
				(DROP (GET $13))
				(DECL TUPLE $14 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL TUPLE $15 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL TUPLE $16 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL TUPLE $17 (TUPLE.NEW (GET $14) (GET $15) (GET $16)))
				(DECL DICT $18 (DICT.NEW))
				(DICT.COPY (GET $18) (GET $17))
				(DROP (GET $18))
				(DECL RECORD $19 (RECORD.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
				(DECL DICT $20 (DICT.NEW))
				(DICT.COPY (GET $20) (GET $19))
				(DROP (GET $20))
				(DECL TUPLE $21 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL TUPLE $22 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL TUPLE $23 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL TUPLE $24 (TUPLE.NEW (GET $21) (GET $22) (GET $23)))
				(DECL LIST $25 (LIST.NEW))
				(LIST.COPY (GET $25) (GET $24))
				(DECL DICT $26 (DICT.NEW))
				(DICT.COPY (GET $26) (GET $25))
				(DROP (GET $26))
				(DECL TUPLE $27 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL TUPLE $28 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL TUPLE $29 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL LIST $30 (LIST.NEW (GET $27) (GET $28) (GET $29)))
				(DECL DICT $31 (DICT.NEW))
				(DICT.COPY (GET $31) (GET $30))
				(DROP (GET $31))
				(DECL RECORD $32 (RECORD.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
				(DECL DICT $33 (DICT.NEW))
				(DICT.COPY (GET $33) (GET $32))
				(DECL DICT $34 (DICT.NEW))
				(DICT.COPY (GET $34) (GET $33))
				(DROP (GET $34))
				(DECL DICT $35 (DICT.NEW @a->(INT.CONST 1) @b->(INT.CONST 2) @c->(INT.CONST 3)))
				(DECL DICT $36 (DICT.NEW))
				(DICT.COPY (GET $36) (GET $35))
				(DROP (GET $36))
				(DECL TUPLE $37 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL TUPLE $38 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL TUPLE $39 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL TUPLE $40 (TUPLE.NEW (GET $37) (GET $38) (GET $39)))
				(DECL SET $41 (SET.NEW))
				(SET.COPY (GET $41) (GET $40))
				(DECL DICT $42 (DICT.NEW))
				(DICT.COPY (GET $42) (GET $41))
				(DROP (GET $42))
				(DECL TUPLE $43 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL TUPLE $44 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL TUPLE $45 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL SET $46 (SET.NEW (GET $43) (GET $44) (GET $45)))
				(DECL DICT $47 (DICT.NEW))
				(DICT.COPY (GET $47) (GET $46))
				(DROP (GET $47))
				(DECL TUPLE $48 (TUPLE.NEW (SYM.CONST @a) (INT.CONST 1)))
				(DECL TUPLE $49 (TUPLE.NEW (SYM.CONST @b) (INT.CONST 2)))
				(DECL TUPLE $50 (TUPLE.NEW (SYM.CONST @c) (INT.CONST 3)))
				(DECL TUPLE $51 (TUPLE.NEW (GET $48) (GET $49) (GET $50)))
				(DECL MAP $52 (MAP.NEW))
				(MAP.COPY (GET $52) (GET $51))
				(DECL DICT $53 (DICT.NEW))
				(DICT.COPY (GET $53) (GET $52))
				(DROP (GET $53))
				(DECL MAP $54 (MAP.NEW (SYM.CONST @a)->(INT.CONST 1) (SYM.CONST @b)->(INT.CONST 2) (SYM.CONST @c)->(INT.CONST 3)))
				(DECL DICT $55 (DICT.NEW))
				(DICT.COPY (GET $55) (GET $54))
				(DROP (GET $55))
			`.join('\n'));
		});
		specify('`Set.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ SET_CONS.join('\n') }
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DROP (SET.NEW))
				(DECL TUPLE $0 (TUPLE.NEW))
				(DECL SET $1 (SET.NEW))
				(SET.COPY (GET $1) (GET $0))
				(DROP (GET $1))
				(DECL LIST $2 (LIST.NEW))
				(DECL SET $3 (SET.NEW))
				(SET.COPY (GET $3) (GET $2))
				(DROP (GET $3))
				(DECL LIST $4 (LIST.NEW))
				(DECL SET $5 (SET.NEW))
				(SET.COPY (GET $5) (GET $4))
				(DROP (GET $5))
				(DECL SET $6 (SET.NEW))
				(DECL SET $7 (SET.NEW))
				(SET.COPY (GET $7) (GET $6))
				(DROP (GET $7))
				(DECL SET $8 (SET.NEW))
				(DECL SET $9 (SET.NEW))
				(SET.COPY (GET $9) (GET $8))
				(DROP (GET $9))
				(DECL TUPLE $10 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL SET $11 (SET.NEW))
				(SET.COPY (GET $11) (GET $10))
				(DROP (GET $11))
				(DECL TUPLE $12 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL LIST $13 (LIST.NEW))
				(LIST.COPY (GET $13) (GET $12))
				(DECL SET $14 (SET.NEW))
				(SET.COPY (GET $14) (GET $13))
				(DROP (GET $14))
				(DECL LIST $15 (LIST.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL SET $16 (SET.NEW))
				(SET.COPY (GET $16) (GET $15))
				(DROP (GET $16))
				(DECL TUPLE $17 (TUPLE.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL SET $18 (SET.NEW))
				(SET.COPY (GET $18) (GET $17))
				(DECL SET $19 (SET.NEW))
				(SET.COPY (GET $19) (GET $18))
				(DROP (GET $19))
				(DECL SET $20 (SET.NEW (INT.CONST 1) (INT.CONST 2) (INT.CONST 3)))
				(DECL SET $21 (SET.NEW))
				(SET.COPY (GET $21) (GET $20))
				(DROP (GET $21))
			`.join('\n'));
		});
		specify('`Map.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${ MAP_CONS.join('\n') }
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DROP (MAP.NEW))
				(DECL TUPLE $0 (TUPLE.NEW))
				(DECL MAP $1 (MAP.NEW))
				(MAP.COPY (GET $1) (GET $0))
				(DROP (GET $1))
				(DECL LIST $2 (LIST.NEW))
				(DECL MAP $3 (MAP.NEW))
				(MAP.COPY (GET $3) (GET $2))
				(DROP (GET $3))
				(DECL LIST $4 (LIST.NEW))
				(DECL MAP $5 (MAP.NEW))
				(MAP.COPY (GET $5) (GET $4))
				(DROP (GET $5))
				(DECL SET $6 (SET.NEW))
				(DECL MAP $7 (MAP.NEW))
				(MAP.COPY (GET $7) (GET $6))
				(DROP (GET $7))
				(DECL SET $8 (SET.NEW))
				(DECL MAP $9 (MAP.NEW))
				(MAP.COPY (GET $9) (GET $8))
				(DROP (GET $9))
				(DECL MAP $10 (MAP.NEW))
				(DECL MAP $11 (MAP.NEW))
				(MAP.COPY (GET $11) (GET $10))
				(DROP (GET $11))
				(DECL TUPLE $12 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL TUPLE $13 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL TUPLE $14 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL TUPLE $15 (TUPLE.NEW (GET $12) (GET $13) (GET $14)))
				(DECL MAP $16 (MAP.NEW))
				(MAP.COPY (GET $16) (GET $15))
				(DROP (GET $16))
				(DECL TUPLE $17 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL TUPLE $18 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL TUPLE $19 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL TUPLE $20 (TUPLE.NEW (GET $17) (GET $18) (GET $19)))
				(DECL LIST $21 (LIST.NEW))
				(LIST.COPY (GET $21) (GET $20))
				(DECL MAP $22 (MAP.NEW))
				(MAP.COPY (GET $22) (GET $21))
				(DROP (GET $22))
				(DECL TUPLE $23 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL TUPLE $24 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL TUPLE $25 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL LIST $26 (LIST.NEW (GET $23) (GET $24) (GET $25)))
				(DECL MAP $27 (MAP.NEW))
				(MAP.COPY (GET $27) (GET $26))
				(DROP (GET $27))
				(DECL TUPLE $28 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL TUPLE $29 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL TUPLE $30 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL TUPLE $31 (TUPLE.NEW (GET $28) (GET $29) (GET $30)))
				(DECL SET $32 (SET.NEW))
				(SET.COPY (GET $32) (GET $31))
				(DECL MAP $33 (MAP.NEW))
				(MAP.COPY (GET $33) (GET $32))
				(DROP (GET $33))
				(DECL TUPLE $34 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL TUPLE $35 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL TUPLE $36 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL SET $37 (SET.NEW (GET $34) (GET $35) (GET $36)))
				(DECL MAP $38 (MAP.NEW))
				(MAP.COPY (GET $38) (GET $37))
				(DROP (GET $38))
				(DECL TUPLE $39 (TUPLE.NEW (INT.CONST 1) (FLOAT.CONST 0.1)))
				(DECL TUPLE $40 (TUPLE.NEW (INT.CONST 2) (FLOAT.CONST 0.2)))
				(DECL TUPLE $41 (TUPLE.NEW (INT.CONST 3) (FLOAT.CONST 0.4)))
				(DECL TUPLE $42 (TUPLE.NEW (GET $39) (GET $40) (GET $41)))
				(DECL MAP $43 (MAP.NEW))
				(MAP.COPY (GET $43) (GET $42))
				(DECL MAP $44 (MAP.NEW))
				(MAP.COPY (GET $44) (GET $43))
				(DROP (GET $44))
				(DECL MAP $45 (MAP.NEW (INT.CONST 1)->(FLOAT.CONST 0.1) (INT.CONST 2)->(FLOAT.CONST 0.2) (INT.CONST 3)->(FLOAT.CONST 0.4)))
				(DECL MAP $46 (MAP.NEW))
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
