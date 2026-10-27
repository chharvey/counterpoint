import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	INTRINSICS,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	Builder,
	OP,
	VisitorExprBuild,
} from '../../../src/index.ts';
import {
	extract_lines,
	op_maybe_string,
	typeUnit,
	setupScript,
} from '../../utils.ts';



test.suite('VisitorExprBuild#visit', () => {
	test.test('Constant returns an OP.Const.', () => {
		const value: AST.EXPR.Constant = AST.EXPR.Constant.fromSource('42');
		return assert.deepStrictEqual(new VisitorExprBuild(new Builder()).visit(value), new OP.Const(value.interpreterValue));
	});


	test.test('Variable returns an OP.Get.', () => {
		const {stmts} = setupScript(`{
			val mut x: int = 42;
			x;
		}`, {codegen: false});
		const expr = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Variable;
		const symbol: SymbolSchema | undefined = expr.validator.getSymbol(expr.id);
		assert_instanceof(symbol, SymbolSchemaVar);
		return assert.deepStrictEqual(new VisitorExprBuild(new Builder()).visit(expr), new OP.Get(symbol, typeUnit(42n)));
	});


	test.test('Template returns an OP.Template.', () => {
		assert.strictEqual(setupScript(`{
				val user: (name: str) = (name= "Alan");
				"""Hello, {{user.name}}, you have {{2 * 3}} new {{"messages"}}.""";
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <record> user (RECORD.NEW @name->(STR.CONST "Alan")))
				(DECL <str> $0 (RECORD.GET @name (GET user)))
				(DECL <int> $1 (INT.MUL (INT.CONST 2) (INT.CONST 3)))
				(DECL <str> $2 (STR.FROM (GET $1)))
				(DROP (STR.TEMPLATE (STR.CONST "Hello, ") (GET $0) (STR.CONST ", you have ") (GET $2) (STR.CONST " new ") (STR.CONST "messages") (STR.CONST ".")))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('three-address code format.', () => {
		assert.strictEqual(setupScript(`{
			"""hello {{"""great {{42}} big"""}} world""";
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <str> $0 (STR.FROM (INT.CONST 42)))
				(DECL <str> $1 (STR.TEMPLATE (STR.CONST "great ") (GET $0) (STR.CONST " big")))
				(DROP (STR.TEMPLATE (STR.CONST "hello ") (GET $1) (STR.CONST " world")))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('Tuple returns an OP.CollectionLinearNew.', () => {
		assert.strictEqual(setupScript(`{
			val mut x: bool  = false;
			val mut y: int   = 5;
			val mut z: float = 0.2;
			(x, y + 2, 3.0 * z - 1.0);
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <bool> x (BOOL.CONST false))
				(DECL <int> y (INT.CONST 5))
				(DECL <float> z (FLOAT.CONST 0.2))
				(DECL <int> $0 (INT.ADD (GET y) (INT.CONST 2)))
				(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (GET z)))
				(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
				(DROP (TUPLE.NEW (GET x) (GET $0) (GET $2)))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('Record returns an OP.RecordNew.', () => {
		assert.strictEqual(setupScript(`{
			val x: bool  = false;
			val y: int   = 5;
			val z: float = 0.2;
			(a= x, b= y + 2, c= 3.0 * z - 1.0);
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <bool> x (BOOL.CONST false))
				(DECL <int> y (INT.CONST 5))
				(DECL <float> z (FLOAT.CONST 0.2))
				(DECL <int> $0 (INT.ADD (GET y) (INT.CONST 2)))
				(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (GET z)))
				(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
				(DROP (RECORD.NEW @a->(GET x) @b->(GET $0) @c->(GET $2)))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('List returns an OP.CollectionLinearNew.', () => {
		assert.strictEqual(setupScript(`{
			[false, 5 + 2, 3.0 * 0.2 - 1.0];
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
				(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
				(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
				(DROP (LIST.NEW (BOOL.CONST false) (GET $0) (GET $2)))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('Dict returns an OP.DictNew.', () => {
		assert.strictEqual(setupScript(`{
			[a= false, b= 5 + 2, c= 3.0 * 0.2 - 1.0];
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
				(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
				(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
				(DROP (DICT.NEW @a->(BOOL.CONST false) @b->(GET $0) @c->(GET $2)))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('Set returns an OP.CollectionLinearNew.', () => {
		assert.strictEqual(setupScript(`{
			{false, 5 + 2, 3.0 * 0.2 - 1.0};
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
				(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
				(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
				(DROP (SET.NEW (BOOL.CONST false) (GET $0) (GET $2)))
				(ENDPROGRAM)
		`.trim());
	});


	test.suite('Map', () => {
		test.test('returns an OP.MapNew.', () => {
			assert.strictEqual(setupScript(`{
				{"a" -> false, "b" -> 5 + 2, "c" -> 3.0 * 0.2 - 1.0};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
					(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
					(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
					(DROP (MAP.NEW (STR.CONST "a")->(BOOL.CONST false) (STR.CONST "b")->(GET $0) (STR.CONST "c")->(GET $2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('evaluates antecedents and consequents interchangeably in source order.', () => {
			assert.strictEqual(setupScript(`{
				{[10] -> 10 + 1, [12] -> 5 * 2 + 3, [7 * 2] -> 15};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <List> $0 (LIST.NEW (INT.CONST 10)))
					(DECL <int> $1 (INT.ADD (INT.CONST 10) (INT.CONST 1)))
					(DECL <List> $2 (LIST.NEW (INT.CONST 12)))
					(DECL <int> $3 (INT.MUL (INT.CONST 5) (INT.CONST 2)))
					(DECL <int> $4 (INT.ADD (GET $3) (INT.CONST 3)))
					(DECL <int> $5 (INT.MUL (INT.CONST 7) (INT.CONST 2)))
					(DECL <List> $6 (LIST.NEW (GET $5)))
					(DROP (MAP.NEW (GET $0)->(GET $1) (GET $2)->(GET $4) (GET $6)->(INT.CONST 15)))
					(ENDPROGRAM)
			`.trim());
		});
	});


	test.test('ExpressionBlock returns the last expression-statement’s expression.', () => {
		assert.strictEqual(setupScript(`{
			val mut x: int = 42;
			val mut y: int = {
				set x = x + 2;
				x / 2;
			};
			set y = {
				y;
				set y = y + x;
				y * 2;
			} + y;
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> x (INT.CONST 42))
				(SET x (INT.ADD (GET x) (INT.CONST 2)))
				(DECL <int> y (INT.DIV (GET x) (INT.CONST 2)))
				(DROP (GET y))
				(SET y (INT.ADD (GET y) (GET x)))
				(DECL <int> $0 (INT.MUL (GET y) (INT.CONST 2)))
				(SET y (INT.ADD (GET $0) (GET y)))
				(ENDPROGRAM)
		`.trim());
		return assert.strictEqual(setupScript(`{
			val mut x: int = 42;
			val mut y: int = 69;
			x + { x; x * y; };
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> x (INT.CONST 42))
				(DECL <int> y (INT.CONST 69))
				(DROP (GET x))
				(DECL <int> $0 (INT.MUL (GET x) (GET y)))
				(DROP (INT.ADD (GET x) (GET $0)))
				(ENDPROGRAM)
		`.trim());
	});


	test.suite('Access', () => {
		test.suite('access kind: normal access (`a.‹b›`).', () => {
			test.test('tuple access returns an OP.TupleGet.', () => {
				assert.strictEqual(setupScript(`{
					(41 + 1, 42 / 2, 43 - 3).1;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <tuple> $3 (TUPLE.NEW (GET $0) (GET $1) (GET $2)))
						(DROP (TUPLE.GET 1 (GET $3)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('record access returns an OP.RecordGet.', () => {
				assert.strictEqual(setupScript(`{
					(a= 41 + 1, b= 42 / 2, c= 43 - 3).b;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <record> $3 (RECORD.NEW @a->(GET $0) @b->(GET $1) @c->(GET $2)))
						(DROP (RECORD.GET @b (GET $3)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('List access returns an OP.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					[41 + 1, 42 / 2, 43 - 3].[1];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <List> $3 (LIST.NEW (GET $0) (GET $1) (GET $2)))
						(DROP (LIST.GET (GET $3) (INT.CONST 1)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('Dict access returns an OP.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					[a= 41 + 1, b= 42 / 2, c= 43 - 3].[@b];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <Dict> $3 (DICT.NEW @a->(GET $0) @b->(GET $1) @c->(GET $2)))
						(DROP (DICT.GET (GET $3) (SYM.CONST @b)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('Set access returns an OP.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					{41 + 1, 42 / 2, 43 - 3}.[21];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <Set> $3 (SET.NEW (GET $0) (GET $1) (GET $2)))
						(DROP (SET.GET (GET $3) (INT.CONST 21)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('Map access returns an OP.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					{21 -> 41 + 1, 22 -> 42 / 2, 23 -> 43 - 3}.[22];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <Map> $3 (MAP.NEW (INT.CONST 21)->(GET $0) (INT.CONST 22)->(GET $1) (INT.CONST 23)->(GET $2)))
						(DROP (MAP.GET (GET $3) (INT.CONST 22)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('nested access.', () => {
				assert.strictEqual(setupScript(`{
					[("hello", {41, 42, 43})].[0].1.[42];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <Set> $0 (SET.NEW (INT.CONST 41) (INT.CONST 42) (INT.CONST 43)))
						(DECL <tuple> $1 (TUPLE.NEW (STR.CONST "hello") (GET $0)))
						(DECL <List> $2 (LIST.NEW (GET $1)))
						(DECL <tuple> $3 (LIST.GET (GET $2) (INT.CONST 0)))
						(DECL <Set> $4 (TUPLE.GET 1 (GET $3)))
						(DROP (SET.GET (GET $4) (INT.CONST 42)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('union access.', () => {
				assert.strictEqual(setupScript(`{
					val mut tup:   (int, ?: float)     | (int, ?: str)     = (42,);
					val mut rec:   (a: int, b?: float) | (a: int, c?: str) = (a= 42);
					val mut list:  [int]               | [float]           = [42];
					val mut dict:  [:int]              | [:float]          = [a= 42];
					val mut 'set': {int}               | {float}           = {42};
					val mut map:   {int -> str}        | {float -> str}    = {42 -> "hello"};
					tup.0;
					rec.a;
					list.[0];
					dict.[@a];
					'set'.[42];
					map.[42];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <tuple> tup (TUPLE.NEW (INT.CONST 42)))
						(DECL <record> rec (RECORD.NEW @a->(INT.CONST 42)))
						(DECL <List> list (LIST.NEW (INT.CONST 42)))
						(DECL <Dict> dict (DICT.NEW @a->(INT.CONST 42)))
						(DECL <Set> 'set' (SET.NEW (INT.CONST 42)))
						(DECL <Map> map (MAP.NEW (INT.CONST 42)->(STR.CONST "hello")))
						(DROP (TUPLE.GET 0 (GET tup)))
						(DROP (RECORD.GET @a (GET rec)))
						(DROP (LIST.GET (GET list) (INT.CONST 0)))
						(DROP (DICT.GET (GET dict) (SYM.CONST @a)))
						(DROP (SET.GET (GET 'set') (INT.CONST 42)))
						(DROP (MAP.GET (GET map) (INT.CONST 42)))
						(ENDPROGRAM)
				`.trim());
			});
		});
		test.suite('access kind: maybe access (`a?.‹b›`).', () => {
			function op_maybe_unwrap_string(mab: string): string {
				return `(MAYBE.UNWRAP ${mab})`;
			}
			function maybe_access_output(
				block_n:      number,
				base_name:    string,
				return_n:     number,
				return_setup: (return_setter: (value?: string) => string) => string,
			): string {
				const block_then:  string = `block-${block_n}`;
				const block_else:  string = `block-${block_n + 1}`;
				const block_endif: string = `block-${block_n + 2}`;
				const return_name: string = `$${return_n}`;
				return xjs.String.dedent`
					${'\t'}(DECL <Maybe> ${return_name})
					${'\t'}(GOTO.IF (INSTANCEOF None (GET ${base_name})) "${block_then}" "${block_else}")
					"${block_then}":
						(SET ${return_name} ${op_maybe_string()})
						(GOTO "${block_endif}")
					"${block_else}":
						${return_setup((ret_val) => `(SET ${return_name} ${op_maybe_string(ret_val)})`)}
						(GOTO "${block_endif}")
					"${block_endif}":
						(DROP (GET ${return_name}))
				`.trim();
			}
			test.test('tuple access.', () => {
				assert.strictEqual(setupScript(`{
					type T = (int, int, ?:int);
					val my_tupleA:   T  = (41 + 1, 42 / 2, 43 ^ 3);
					val my_tupleB:   T  = (41 + 1, 42 / 2);
					val some_tupleA: T? = Some.<T>((41 + 1, 42 / 2, 43 ^ 3));
					val some_tupleB: T? = Some.<T>((41 + 1, 42 / 2));
					my_tupleA.2;
					my_tupleB.2;
					some_tupleA?.2;
					some_tupleB?.2;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
						(DECL <tuple> my_tupleA (TUPLE.NEW (GET $0) (GET $1) (GET $2)))
						(DECL <int> $3 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $4 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <tuple> my_tupleB (TUPLE.NEW (GET $3) (GET $4)))
						(DECL <int> $5 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $6 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $7 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
						(DECL <tuple> $8 (TUPLE.NEW (GET $5) (GET $6) (GET $7)))
						(DECL <Maybe> some_tupleA (MAYBE.NEW (GET $8)))
						(DECL <int> $9 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $10 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <tuple> $11 (TUPLE.NEW (GET $9) (GET $10)))
						(DECL <Maybe> some_tupleB (MAYBE.NEW (GET $11)))
						(DROP (TUPLE.GET 2 (GET my_tupleA)))
						(DROP (GET my_tupleB))
						(DROP (NULL.CONST null))
						${maybe_access_output(1, 'some_tupleA', 12, (return_setter) => extract_lines`
							(DECL <tuple> $13 (MAYBE.UNWRAP (GET some_tupleA)))
							(DECL <Maybe> $14 (TUPLE.GET 2 (GET $13)))
							${return_setter('(GET $14)')}
						`.join('\n\t'))}
						${maybe_access_output(4, 'some_tupleB', 15, (return_setter) => extract_lines`
							(DECL <tuple> $16 (MAYBE.UNWRAP (GET some_tupleB)))
							(DECL <Maybe> $17 (TUPLE.GET 2 (GET $16)))
							${return_setter('(GET $17)')}
						`.join('\n\t'))}
						(ENDPROGRAM)
				`.trim());
			});
			test.test('record access.', () => {
				assert.strictEqual(setupScript(`{
					type R = (a: int, b?: int, c: int);
					val my_recordX:   R  = (a= 41 + 1, c= 42 / 2, b= 43 ^ 3);
					val my_recordY:   R  = (a= 41 + 1, c= 42 / 2);
					val some_recordX: R? = Some.<R>((a= 41 + 1, c= 42 / 2, b= 43 ^ 3));
					val some_recordY: R? = Some.<R>((a= 41 + 1, c= 42 / 2));
					my_recordX.b;
					my_recordY.b;
					some_recordX?.b;
					some_recordY?.b;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
						(DECL <record> my_recordX (RECORD.NEW @a->(GET $0) @c->(GET $1) @b->(GET $2)))
						(DECL <int> $3 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $4 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <record> my_recordY (RECORD.NEW @a->(GET $3) @c->(GET $4)))
						(DECL <int> $5 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $6 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $7 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
						(DECL <record> $8 (RECORD.NEW @a->(GET $5) @c->(GET $6) @b->(GET $7)))
						(DECL <Maybe> some_recordX (MAYBE.NEW (GET $8)))
						(DECL <int> $9 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $10 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <record> $11 (RECORD.NEW @a->(GET $9) @c->(GET $10)))
						(DECL <Maybe> some_recordY (MAYBE.NEW (GET $11)))
						(DROP (RECORD.GET @b (GET my_recordX)))
						(DROP (GET my_recordY))
						(DROP (NULL.CONST null))
						${maybe_access_output(1, 'some_recordX', 12, (return_setter) => extract_lines`
							(DECL <record> $13 (MAYBE.UNWRAP (GET some_recordX)))
							(DECL <Maybe> $14 (RECORD.GET @b (GET $13)))
							${return_setter('(GET $14)')}
						`.join('\n\t'))}
						${maybe_access_output(4, 'some_recordY', 15, (return_setter) => extract_lines`
							(DECL <record> $16 (MAYBE.UNWRAP (GET some_recordY)))
							(DECL <Maybe> $17 (RECORD.GET @b (GET $16)))
							${return_setter('(GET $17)')}
						`.join('\n\t'))}
						(ENDPROGRAM)
				`.trim());
			});
			test.test('List access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list: [int] = [41, 42];
					my_list?.[2];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <List> my_list (LIST.NEW (INT.CONST 41) (INT.CONST 42)))
						${maybe_access_output(1, 'my_list', 0, (return_setter) => extract_lines`
							(DECL <int> $1 (LIST.GET (GET my_list) (INT.CONST 2)))
							${return_setter('(GET $1)')}
						`.join('\n\t'))}
						(ENDPROGRAM)
				`.trim());
			});
			test.test('Dict access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_dict: [:int] = [a= 41, c= 42];
					my_dict?.[@b];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <Dict> my_dict (DICT.NEW @a->(INT.CONST 41) @c->(INT.CONST 42)))
						${maybe_access_output(1, 'my_dict', 0, (return_setter) => extract_lines`
							(DECL <int> $1 (DICT.GET (GET my_dict) (SYM.CONST @b)))
							${return_setter('(GET $1)')}
						`.join('\n\t'))}
						(ENDPROGRAM)
				`.trim());
			});
			test.test('Map access.', () => {
				assert.strictEqual(setupScript(`{
					val mut accessor: int = 22;
					{21 -> 41, 22 -> 42, 23 -> 43}?.[accessor];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> accessor (INT.CONST 22))
						(DECL <Map> $0 (MAP.NEW (INT.CONST 21)->(INT.CONST 41) (INT.CONST 22)->(INT.CONST 42) (INT.CONST 23)->(INT.CONST 43)))
						${maybe_access_output(1, '$0', 1, (return_setter) => extract_lines`
							(DECL <int> $2 (MAP.GET (GET $0) (GET accessor)))
							${return_setter('(GET $2)')}
						`.join('\n\t'))}
						(ENDPROGRAM)
				`.trim());
			});
			test.test('short-circuits evaluation of dynamic accessor.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_tup?:  (int, bool);
					val mut my_rec?:  (a: int);
					val mut my_list?: [int];
					val mut my_dict?: [:int];
					val mut my_map?:  {int -> int};
					my_tup?.1;
					my_rec?.a;
					my_list?.[2 * 2 - 3];
					my_dict?.[@b && @a];
					my_map?.[5 + 3 * 2];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <Maybe> my_tup ${ op_maybe_string()})
						(DECL <Maybe> my_rec ${ op_maybe_string()})
						(DECL <Maybe> my_list ${op_maybe_string()})
						(DECL <Maybe> my_dict ${op_maybe_string()})
						(DECL <Maybe> my_map ${ op_maybe_string()})
						${maybe_access_output(1, 'my_tup', 0, (return_setter) => extract_lines`
							(DECL <tuple> $1 ${op_maybe_unwrap_string('(GET my_tup)')})
							(DECL <bool> $2 (TUPLE.GET 1 (GET $1)))
							${return_setter('(GET $2)')}
						`.join('\n\t'))}
						${maybe_access_output(4, 'my_rec', 3, (return_setter) => extract_lines`
							(DECL <record> $4 ${op_maybe_unwrap_string('(GET my_rec)')})
							(DECL <int> $5 (RECORD.GET @a (GET $4)))
							${return_setter('(GET $5)')}
						`.join('\n\t'))}
						${maybe_access_output(7, 'my_list', 6, (return_setter) => extract_lines`
							(DECL <List> $7 ${op_maybe_unwrap_string('(GET my_list)')})
							(DECL <int> $8 (INT.MUL (INT.CONST 2) (INT.CONST 2)))
							(DECL <int> $9 (INT.SUB (GET $8) (INT.CONST 3)))
							(DECL <Maybe> $10 (LIST.GET (GET $7) (GET $9)))
							${return_setter('(GET $10)')}
						`.join('\n\t'))}
						${maybe_access_output(10, 'my_dict', 11, (return_setter) => xjs.String.dedent`
							${'\t'}(DECL <Dict> $12 ${op_maybe_unwrap_string('(GET my_dict)')})
							${'\t'}(DECL <sym> $13)
							${'\t'}(GOTO.IF (BOOL.FROM (SYM.CONST @b)) "block-13" "block-14")
							"block-13":
								(SET $13 (SYM.CONST @a))
								(GOTO "block-15")
							"block-14":
								(SET $13 (SYM.CONST @b))
								(GOTO "block-15")
							"block-15":
								(DECL <Maybe> $14 (DICT.GET (GET $12) (GET $13)))
								${return_setter('(GET $14)')}
						`.trim())}
						${maybe_access_output(16, 'my_map', 15, (return_setter) => extract_lines`
							(DECL <Map> $16 ${op_maybe_unwrap_string('(GET my_map)')})
							(DECL <int> $17 (INT.MUL (INT.CONST 3) (INT.CONST 2)))
							(DECL <int> $18 (INT.ADD (INT.CONST 5) (GET $17)))
							(DECL <Maybe> $19 (MAP.GET (GET $16) (GET $18)))
							${return_setter('(GET $19)')}
						`.join('\n\t'))}
						(ENDPROGRAM)
				`.trim());
			});
		});
	});


	test.suite('Call', () => {
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
		test.test('`Boolean.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${BOOL_CONS.map((src) => `${src};`).join('\n')}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (BOOL.FROM (NULL.CONST null)))
					(DROP (BOOL.FROM (BOOL.CONST false)))
					(DROP (BOOL.FROM (BOOL.CONST true)))
					(DROP (BOOL.FROM (SYM.CONST @hello)))
					(DROP (BOOL.FROM (INT.CONST 0)))
					(DROP (BOOL.FROM (INT.CONST -42)))
					(DROP (BOOL.FROM (NAT.CONST +0)))
					(DROP (BOOL.FROM (NAT.CONST +42)))
					(DROP (BOOL.FROM (FLOAT.CONST 0.0)))
					(DROP (BOOL.FROM (FLOAT.CONST 4.2)))
					(DROP (BOOL.FROM (STR.CONST "hello")))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Integer.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${INT_CONS.map((src) => `${src};`).join('\n')}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (INT.FROM (INT.CONST -42)))
					(DROP (INT.FROM (NAT.CONST +42)))
					(DROP (INT.FROM (FLOAT.CONST 4.2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Natural.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${NAT_CONS.map((src) => `${src};`).join('\n')}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (NAT.FROM (INT.CONST -42)))
					(DROP (NAT.FROM (NAT.CONST +42)))
					(DROP (NAT.FROM (FLOAT.CONST 4.2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Float.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${FLOAT_CONS.map((src) => `${src};`).join('\n')}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (FLOAT.FROM (INT.CONST -42)))
					(DROP (FLOAT.FROM (NAT.CONST +42)))
					(DROP (FLOAT.FROM (FLOAT.CONST 4.2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`String.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${STRING_CONS.map((src) => `${src};`).join('\n')}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (STR.FROM (NULL.CONST null)))
					(DROP (STR.FROM (BOOL.CONST true)))
					(DROP (STR.FROM (INT.CONST -42)))
					(DROP (STR.FROM (NAT.CONST +42)))
					(DROP (STR.FROM (FLOAT.CONST 4.2)))
					(DROP (STR.FROM (STR.CONST "hello")))
					(DECL <tuple> $0 (TUPLE.NEW))
					(DROP (STR.FROM (GET $0)))
					(DECL <record> $1 (RECORD.NEW @a->(INT.CONST 1)))
					(DROP (STR.FROM (GET $1)))
					(DECL <List> $2 (LIST.NEW))
					(DROP (STR.FROM (GET $2)))
					(DECL <Dict> $3 (DICT.NEW @a->(INT.CONST 1)))
					(DROP (STR.FROM (GET $3)))
					(DECL <Set> $4 (SET.NEW))
					(DROP (STR.FROM (GET $4)))
					(DECL <Map> $5 (MAP.NEW (STR.CONST "a")->(INT.CONST 1)))
					(DROP (STR.FROM (GET $5)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`List.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${LIST_CONS.map((src) => `${src};`).join('\n')}
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
				${DICT_CONS.map((src) => `${src};`).join('\n')}
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
				${SET_CONS.map((src) => `${src};`).join('\n')}
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
				${MAP_CONS.map((src) => `${src};`).join('\n')}
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
		test.test('`Exception.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				${EXCEPTION_CONS.map((src) => `${src};`).join('\n')}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (EXCP.NEW (STR.CONST "message")))
					(DECL <Exception> $0 (EXCP.NEW (STR.CONST "cause")))
					(DROP (EXCP.NEW (STR.CONST "message") (GET $0)))
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
		test.test('`Fail.()`', () => {
			assert.strictEqual(setupScript(`{
				Fail.<int>(Exception.("message"));
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <Exception> $0 (EXCP.NEW (STR.CONST "message")))
					(DROP (RESULT.NEW nil (GET $0)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('`Ok.(‹…›)`', () => {
			assert.strictEqual(setupScript(`{
				Ok.<int>(42);
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (RESULT.NEW (INT.CONST 42) nil))
					(ENDPROGRAM)
			`.trim());
		});
	});


	test.suite('Claim', () => {
		test.test('returns the operand.', () => {
			const {stmts, builder} = setupScript(`{
				42 as <int>;
			}`, {codegen: false});
			const expr_visitor = new VisitorExprBuild(builder);
			const expr = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Claim;
			return assert.deepStrictEqual(expr_visitor.visit(expr), expr_visitor.visit(expr.operand));
		});
		test.test('repeated calls are idempotent.', () => {
			const {stmts, builder} = setupScript(`{
				(42 + 42 + 42) as <int | float>;
			}`, {build: false});
			const expr_visitor = new VisitorExprBuild(builder);
			assert.strictEqual(builder.instructions.length, 0);
			const expr = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Claim;
			expr_visitor.visit(expr.operand);
			assert.strictEqual(builder.instructions.length, 1);
			expr_visitor.visit(expr);
			assert.strictEqual(builder.instructions.length, 1);
		});
	});


	test.suite('OperationUnary', () => {
		test.test('[operator=UN_MAYBE]', () => {
			assert.strictEqual(setupScript(`{
				val mut x?: int;
				val mut y?: nat;
				val mut z?: float;
				set y = +42;
				set z = 4.2;
				delete y;
				x~?;
				y~?;
				z~?;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <Maybe> x (MAYBE.NEW))
					(DECL <Maybe> y (MAYBE.NEW))
					(DECL <Maybe> z (MAYBE.NEW))
					(SET y (MAYBE.NEW (NAT.CONST +42)))
					(SET z (MAYBE.NEW (FLOAT.CONST 4.2)))
					(SET y (MAYBE.NEW))
					(DROP (MAYBE.UNWRAP (GET x)))
					(DROP (MAYBE.UNWRAP (GET y)))
					(DROP (MAYBE.UNWRAP (GET z)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('[operator=UN_RESULT]', () => {
			assert.strictEqual(setupScript(`{
				val x: int! = Fail.<int>(Exception.("42"));
				val y: Result.<nat> = Ok.<nat>(+42);
				val z: Result.<float, Exception> = Ok.<float>(4.2);
				x~!;
				y~!;
				z~!;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <Exception> $0 (EXCP.NEW (STR.CONST "42")))
					(DECL <Result> x (RESULT.NEW nil (GET $0)))
					(DECL <Result> y (RESULT.NEW (NAT.CONST +42) nil))
					(DECL <Result> z (RESULT.NEW (FLOAT.CONST 4.2) nil))
					(DROP (RESULT.UNWRAP (GET x)))
					(DROP (RESULT.UNWRAP (GET y)))
					(DROP (RESULT.UNWRAP (GET z)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('[operator=NOT]', () => {
			assert.strictEqual(setupScript(`{
				!42;
				val y: int = 42 / 7;
				!(42 + y);
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (NOT (INT.CONST 42)))
					(DECL <int> y (INT.DIV (INT.CONST 42) (INT.CONST 7)))
					(DECL <int> $0 (INT.ADD (INT.CONST 42) (GET y)))
					(DROP (NOT (GET $0)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('[operator=EMP]', () => {
			assert.strictEqual(setupScript(`{
				val x: int = 42;
				?x;
				val y: int = x / 7;
				?(x + y);
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> x (INT.CONST 42))
					(DROP (EMP (GET x)))
					(DECL <int> y (INT.DIV (GET x) (INT.CONST 7)))
					(DECL <int> $0 (INT.ADD (GET x) (GET y)))
					(DROP (EMP (GET $0)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('[operator=NEG]', () => {
			assert.strictEqual(setupScript(`{
				val mut x: int = 42;
				-x;
				val mut y: float = 42.0 / 7.0;
				-(3.0 + y);
				val mut z: int | float = if false then 42 else 4.2;
				-z;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> x (INT.CONST 42))
					(DROP (NEG (GET x)))
					(DECL <float> y (FLOAT.DIV (FLOAT.CONST 42.0) (FLOAT.CONST 7.0)))
					(DECL <float> $0 (FLOAT.ADD (FLOAT.CONST 3.0) (GET y)))
					(DROP (NEG (GET $0)))
					(DECL <anything> $1)
					(GOTO.IF (BOOL.CONST false) "block-1" "block-2")
				"block-1":
					(SET $1 (INT.CONST 42))
					(GOTO "block-3")
				"block-2":
					(SET $1 (FLOAT.CONST 4.2))
					(GOTO "block-3")
				"block-3":
					(DECL <anything> z (GET $1))
					(DROP (NEG (GET z)))
					(ENDPROGRAM)
			`.trim());
		});
	});


	test.suite('OperationBinaryCast', () => {
		test.suite('[operator=IS]', () => {
			test.test('"Null"', () => {
				assert.strictEqual(setupScript(`{
					42 is Null;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DROP (ID (INT.CONST 42) (NULL.CONST null)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('"Boolean"', () => {
				assert.strictEqual(setupScript(`{
					42 is Boolean;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <bool> $0 (ID (INT.CONST 42) (BOOL.CONST false)))
						(DECL <bool> $1)
						(GOTO.IF (GET $0) "block-1" "block-2")
					"block-1":
						(SET $1 (GET $0))
						(GOTO "block-3")
					"block-2":
						(SET $1 (ID (INT.CONST 42) (BOOL.CONST true)))
						(GOTO "block-3")
					"block-3":
						(DROP (GET $1))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('if not "Null" nor "Boolean", returns INSTANCEOF.', () => {
				assert.strictEqual(setupScript(`{
					val n: null = null;
					${INTRINSICS.slice(2).map((t) => `n is ${t};`).join('\n')}
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <null> n (NULL.CONST null))
						${INTRINSICS.slice(2).map((t) => `(DROP (INSTANCEOF ${t} (GET n)))`).join('\n\t')}
						(ENDPROGRAM)
				`.trim());
			});
		});
		test.test('[operator=CAST]', () => {
			assert.strictEqual(setupScript(`{
				val n: anything = null;
				${INTRINSICS.map((t) => `n as ${t};`).join('\n')}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <null> n (NULL.CONST null))
					${INTRINSICS.map((t) => `(DROP (CAST ${t} (GET n)))`).join('\n\t')}
					(ENDPROGRAM)
			`.trim());
		});
		test.suite('[operator=MAYBE]', () => {
			test.test('"Null"', () => {
				assert.strictEqual(setupScript(`{
					val n: anything = null;
					val i: anything = 42;
					n as? Null;
					i as? Null;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <null> n (NULL.CONST null))
						(DECL <int> i (INT.CONST 42))
						(DECL <Maybe> $0)
						(GOTO.IF (ID (GET n) (NULL.CONST null)) "block-1" "block-2")
					"block-1":
						(SET $0 ${op_maybe_string('(CAST Null (GET n))')})
						(GOTO "block-3")
					"block-2":
						(SET $0 ${op_maybe_string()})
						(GOTO "block-3")
					"block-3":
						(DROP (GET $0))
						(DECL <Maybe> $1)
						(GOTO.IF (ID (GET i) (NULL.CONST null)) "block-4" "block-5")
					"block-4":
						(SET $1 ${op_maybe_string('(CAST Null (GET i))')})
						(GOTO "block-6")
					"block-5":
						(SET $1 ${op_maybe_string()})
						(GOTO "block-6")
					"block-6":
						(DROP (GET $1))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('"Boolean"', () => {
				assert.strictEqual(setupScript(`{
					val n: anything = null;
					val i: anything = 42;
					n as? Boolean;
					i as? Boolean;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <null> n (NULL.CONST null))
						(DECL <int> i (INT.CONST 42))
						(DECL <Maybe> $0)
						(DECL <bool> $1 (ID (GET n) (BOOL.CONST false)))
						(DECL <bool> $2)
						(GOTO.IF (GET $1) "block-4" "block-5")
					"block-4":
						(SET $2 (GET $1))
						(GOTO "block-6")
					"block-5":
						(SET $2 (ID (GET n) (BOOL.CONST true)))
						(GOTO "block-6")
					"block-6":
						(GOTO.IF (GET $2) "block-1" "block-2")
					"block-1":
						(SET $0 ${op_maybe_string('(CAST Boolean (GET n))')})
						(GOTO "block-3")
					"block-2":
						(SET $0 ${op_maybe_string()})
						(GOTO "block-3")
					"block-3":
						(DROP (GET $0))
						(DECL <Maybe> $3)
						(DECL <bool> $4 (ID (GET i) (BOOL.CONST false)))
						(DECL <bool> $5)
						(GOTO.IF (GET $4) "block-10" "block-11")
					"block-10":
						(SET $5 (GET $4))
						(GOTO "block-12")
					"block-11":
						(SET $5 (ID (GET i) (BOOL.CONST true)))
						(GOTO "block-12")
					"block-12":
						(GOTO.IF (GET $5) "block-7" "block-8")
					"block-7":
						(SET $3 ${op_maybe_string('(CAST Boolean (GET i))')})
						(GOTO "block-9")
					"block-8":
						(SET $3 ${op_maybe_string()})
						(GOTO "block-9")
					"block-9":
						(DROP (GET $3))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('not "Null" nor "Boolean".', () => {
				assert.strictEqual(setupScript(`{
					val n: anything = null;
					${INTRINSICS.slice(2).map((t) => `n as? ${t};`).join('\n')}
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <null> n (NULL.CONST null))
						${INTRINSICS.slice(2).map((t, i) => {
							const block_then:  string = `block-${3 * i + 1}`;
							const block_else:  string = `block-${3 * i + 2}`;
							const block_endif: string = `block-${3 * i + 3}`;
							const return_name: string = `$${i}`;
							return xjs.String.dedent`
								${'\t'}(DECL <Maybe> ${return_name})
								${'\t'}(GOTO.IF (INSTANCEOF ${t} (GET n)) "${block_then}" "${block_else}")
								"${block_then}":
									(SET ${return_name} ${op_maybe_string(`(CAST ${t} (GET n))`)})
									(GOTO "${block_endif}")
								"${block_else}":
									(SET ${return_name} ${op_maybe_string()})
									(GOTO "${block_endif}")
								"${block_endif}":
									(DROP (GET ${return_name}))
							`.trim();
						}).join('\n\t').trimStart()}
						(ENDPROGRAM)
				`.trim());
			});
		});
	});


	test.test('OperationBinaryArithmetic', () => {
		assert.strictEqual(setupScript(`{
			val mut x: int = 42;
			3 + x^2 / 2^3;
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> x (INT.CONST 42))
				(DECL <int> $0 (INT.EXP (GET x) (INT.CONST 2)))
				(DECL <int> $1 (INT.EXP (INT.CONST 2) (INT.CONST 3)))
				(DECL <int> $2 (INT.DIV (GET $0) (GET $1)))
				(DROP (INT.ADD (INT.CONST 3) (GET $2)))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('OperationBinaryComparative', () => {
		assert.strictEqual(setupScript(`{
			val mut a: int = 10;
			val mut b: int = 100;
			val mut c: float = 0.1;
			val mut d: float = 0.01;
			a < b;
			c > d;
			a <= b;
			c >= d;
			a !< d;
			b !> c;
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> a (INT.CONST 10))
				(DECL <int> b (INT.CONST 100))
				(DECL <float> c (FLOAT.CONST 0.1))
				(DECL <float> d (FLOAT.CONST 0.01))
				(DROP (LT (GET a) (GET b)))
				(DROP (GT (GET c) (GET d)))
				(DROP (LE (GET a) (GET b)))
				(DROP (GE (GET c) (GET d)))
				(DECL <bool> $0 (LT (GET a) (GET d)))
				(DROP (NOT (GET $0)))
				(DECL <bool> $1 (GT (GET b) (GET c)))
				(DROP (NOT (GET $1)))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('OperationBinaryEquality', () => {
		assert.strictEqual(setupScript(`{
			val mut a: null  = null;
			val mut b: bool  = false;
			val mut c: int   = 10;
			val mut d: float = 0.1;
			a === b;
			c ==  d;
			c !== a;
			d !=  b;
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <null> a (NULL.CONST null))
				(DECL <bool> b (BOOL.CONST false))
				(DECL <int> c (INT.CONST 10))
				(DECL <float> d (FLOAT.CONST 0.1))
				(DROP (ID (GET a) (GET b)))
				(DROP (EQ (GET c) (GET d)))
				(DECL <bool> $0 (ID (GET c) (GET a)))
				(DROP (NOT (GET $0)))
				(DECL <bool> $1 (EQ (GET d) (GET b)))
				(DROP (NOT (GET $1)))
				(ENDPROGRAM)
		`.trim());
	});


	test.suite('OperationBinaryLogical', () => {
		test.test('[operator=AND]', () => {
			assert.strictEqual(setupScript(`{
				val mut a: null  = null;
				val mut b: bool  = false;
				a && b;
				!a && !b;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <null> a (NULL.CONST null))
					(DECL <bool> b (BOOL.CONST false))
					(DECL <anything> $0)
					(GOTO.IF (BOOL.FROM (GET a)) "block-1" "block-2")
				"block-1":
					(SET $0 (GET b))
					(GOTO "block-3")
				"block-2":
					(SET $0 (GET a))
					(GOTO "block-3")
				"block-3":
					(DROP (GET $0))
					(DECL <bool> $1 (NOT (GET a)))
					(DECL <bool> $2)
					(GOTO.IF (BOOL.FROM (GET $1)) "block-4" "block-5")
				"block-4":
					(SET $2 (NOT (GET b)))
					(GOTO "block-6")
				"block-5":
					(SET $2 (GET $1))
					(GOTO "block-6")
				"block-6":
					(DROP (GET $2))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('[operator=OR]', () => {
			assert.strictEqual(setupScript(`{
				val mut c: int   = 10;
				val mut d: float = 0.1;
				c || d;
				-c + 1 || 1.0 - d;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> c (INT.CONST 10))
					(DECL <float> d (FLOAT.CONST 0.1))
					(DECL <anything> $0)
					(GOTO.IF (BOOL.FROM (GET c)) "block-1" "block-2")
				"block-1":
					(SET $0 (GET c))
					(GOTO "block-3")
				"block-2":
					(SET $0 (GET d))
					(GOTO "block-3")
				"block-3":
					(DROP (GET $0))
					(DECL <int> $1 (NEG (GET c)))
					(DECL <int> $2 (INT.ADD (GET $1) (INT.CONST 1)))
					(DECL <anything> $3)
					(GOTO.IF (BOOL.FROM (GET $2)) "block-4" "block-5")
				"block-4":
					(SET $3 (GET $2))
					(GOTO "block-6")
				"block-5":
					(SET $3 (FLOAT.SUB (FLOAT.CONST 1.0) (GET d)))
					(GOTO "block-6")
				"block-6":
					(DROP (GET $3))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('[operator=NAND]', () => {
			assert.strictEqual(setupScript(`{
				val mut a: null  = null;
				val mut b: bool  = false;
				a !& b;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <null> a (NULL.CONST null))
					(DECL <bool> b (BOOL.CONST false))
					(DECL <anything> $0)
					(GOTO.IF (BOOL.FROM (GET a)) "block-1" "block-2")
				"block-1":
					(SET $0 (GET b))
					(GOTO "block-3")
				"block-2":
					(SET $0 (GET a))
					(GOTO "block-3")
				"block-3":
					(DROP (NOT (GET $0)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('[operator=NOR]', () => {
			assert.strictEqual(setupScript(`{
				val mut c: int   = 10;
				val mut d: float = 0.1;
				c !| d;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> c (INT.CONST 10))
					(DECL <float> d (FLOAT.CONST 0.1))
					(DECL <anything> $0)
					(GOTO.IF (BOOL.FROM (GET c)) "block-1" "block-2")
				"block-1":
					(SET $0 (GET c))
					(GOTO "block-3")
				"block-2":
					(SET $0 (GET d))
					(GOTO "block-3")
				"block-3":
					(DROP (NOT (GET $0)))
					(ENDPROGRAM)
			`.trim());
		});
	});


	test.test('OperationTernary', () => {
		assert.strictEqual(setupScript(`{
			val mut x: bool  = false;
			val mut y: float = 0.5;
			val mut z: float = 0.2;
			if x then y else z;
			if y < z then 0.03 + y * 2.0 else 3.0 * z + 0.02;
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <bool> x (BOOL.CONST false))
				(DECL <float> y (FLOAT.CONST 0.5))
				(DECL <float> z (FLOAT.CONST 0.2))
				(DECL <float> $0)
				(GOTO.IF (GET x) "block-1" "block-2")
			"block-1":
				(SET $0 (GET y))
				(GOTO "block-3")
			"block-2":
				(SET $0 (GET z))
				(GOTO "block-3")
			"block-3":
				(DROP (GET $0))
				(DECL <float> $1)
				(GOTO.IF (LT (GET y) (GET z)) "block-4" "block-5")
			"block-4":
				(DECL <float> $2 (FLOAT.MUL (GET y) (FLOAT.CONST 2.0)))
				(SET $1 (FLOAT.ADD (FLOAT.CONST 0.03) (GET $2)))
				(GOTO "block-6")
			"block-5":
				(DECL <float> $3 (FLOAT.MUL (FLOAT.CONST 3.0) (GET z)))
				(SET $1 (FLOAT.ADD (GET $3) (FLOAT.CONST 0.02)))
				(GOTO "block-6")
			"block-6":
				(DROP (GET $1))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('Switch', () => {
		assert.strictEqual(setupScript(`{
			switch 42 default true;
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DROP (INT.CONST 42))
				(DROP (BOOL.CONST true))
				(ENDPROGRAM)
		`.trim());
		assert.strictEqual(setupScript(`{
			switch 21 + 21
				case 42 -> false
				default true;
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> $0 (INT.ADD (INT.CONST 21) (INT.CONST 21)))
				(DECL <bool> $1)
				(GOTO.IF (ID (GET $0) (INT.CONST 42)) "block-1" "block-2")
			"block-1":
				(SET $1 (BOOL.CONST false))
				(GOTO "block-3")
			"block-2":
				(SET $1 (BOOL.CONST true))
				(GOTO "block-3")
			"block-3":
				(DROP (GET $1))
				(ENDPROGRAM)
		`.trim());
		return assert.strictEqual(setupScript(`{
			switch 4.2
				case 1.1       -> 10
				case 2.0 + 0.2 -> 20
				case 3.3 | 4.4 -> 10 * 3
				default 40;
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> $0)
				(GOTO.IF (ID (FLOAT.CONST 4.2) (FLOAT.CONST 1.1)) "block-1" "block-2")
			"block-1":
				(SET $0 (INT.CONST 10))
				(GOTO "block-3")
			"block-2":
				(DECL <int> $1)
				(DECL <float> $2 (FLOAT.ADD (FLOAT.CONST 2.0) (FLOAT.CONST 0.2)))
				(GOTO.IF (ID (FLOAT.CONST 4.2) (GET $2)) "block-4" "block-5")
			"block-4":
				(SET $1 (INT.CONST 20))
				(GOTO "block-6")
			"block-5":
				(DECL <int> $3)
				(GOTO.IF (ID (FLOAT.CONST 4.2) (FLOAT.CONST 3.3)) "block-7" "block-8")
			"block-7":
				(SET $3 (INT.MUL (INT.CONST 10) (INT.CONST 3)))
				(GOTO "block-9")
			"block-8":
				(DECL <int> $4)
				(GOTO.IF (ID (FLOAT.CONST 4.2) (FLOAT.CONST 4.4)) "block-10" "block-11")
			"block-10":
				(SET $4 (INT.MUL (INT.CONST 10) (INT.CONST 3)))
				(GOTO "block-12")
			"block-11":
				(SET $4 (INT.CONST 40))
				(GOTO "block-12")
			"block-12":
				(SET $3 (GET $4))
				(GOTO "block-9")
			"block-9":
				(SET $1 (GET $3))
				(GOTO "block-6")
			"block-6":
				(SET $0 (GET $1))
				(GOTO "block-3")
			"block-3":
				(DROP (GET $0))
				(ENDPROGRAM)
		`.trim());
	});


	test.test('ExpressionFunction', () => {
		assert.strictEqual(setupScript(`{
			val mut z: int = 42;
			\\(x: int): void {
				x;
				return;
			};
			\\(x: float, y: float) with (z): void {
				x + y;
				z + 10;
				return;
			};
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <int> z (INT.CONST 42))
				(DROP (LAMBDA $0 \\(x: int): void { x; return; }))
				(DROP (LAMBDA $1 \\(x: float, y: float) with (z): void { x + y; z + 10; return; }))
				(ENDPROGRAM)
		`.trim());
	});
});
