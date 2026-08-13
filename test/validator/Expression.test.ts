import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	OP,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateKey,
	TypeErrorInvalidOperation,
	TypeErrorNotAssignable,
} from '../../src/index.ts';
import {
	extract_tokens,
	repeat,
	assert_shallowStrictEqual,
	assertAssignable,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../utils.ts';



test.suite('Expression', () => {
	test.suite('#type', () => {
		test.suite('Variable', () => {
			test.test('wraps in `Maybe` when accessed variable is uninitialized.', () => {
				const {stmts} = setupScript(`{
					val mut w:  int = 42;
					val mut x?: int;
					w;
					x;
				}`, {build: false});
				assert.ok( (stmts[0] as AST.STMT.DeclarationVariable).assigned);
				assert.ok(!(stmts[1] as AST.STMT.DeclarationVariable).assigned);
				return assertEqualTypes(
					stmts.slice(2).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					[
						TYPE.INT,
						new TYPE.Maybe(TYPE.INT),
					],
				);
			});
		});


		test.suite('Isset', () => {
			test.test('always returns `bool`.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val mut a0?: int;
						val mut a1?: int;
						val mut a2?: int;

						val mut b: int = 42;
						val mut c0: int | null = 42;
						val mut c1: int | null = 42;
						val mut d: int | null = null;
						val e: int = 42;
						val f: int | null = 42;
						val g: int | null = null;

						set a1 = 42;
						set a2 = 42;
						delete a2;
						set c1 = null;

						isset a0;
						isset a1;
						isset a2;
						isset b;
						isset c0;
						isset c1;
						isset d;
						isset e;
						isset f;
						isset g;
					}`, {build: false}).stmts.slice(14).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					repeat(TYPE.BOOL, 10),
				);
			});
		});


		test.suite('Switch', () => {
			test.test('returns `nothing` if the compared value is type `nothing`.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						switch 42 default true;
						switch 42 as <nothing> default 43;
					}`, {build: false}).stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					[
						TYPE.TRUE,
						TYPE.NOTHING,
					],
				);
			});
			test.test('returns the union of all cases’ consequents and the default.', () => {
				assertEqualTypes(
					setupScript(`{
						switch 42 default 4.3;
						switch 42
							case 1.1 -> 10
							case 2.2 -> 20
							default 43;
					}`, {build: false}).stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					[
						typeUnit(4.3),
						TYPE.Union.all(typeUnit(10n), typeUnit(20n), typeUnit(43n)),
					],
				);
			});
			test.test('throws when at least one antecedent is an error.', () => {
				const {stmts} = setupScript(`{
					switch 42
						case 1.1       | 2.2 -> 15
						case 33 / 10.0 | 4.4 -> 25
						default 43;
				}`, {typeCheck: false});
				assert.throws(() => (stmts[0] as AST.STMT.StatementExpression).expr!.typeCheck(), TypeErrorInvalidOperation);
			});
		});
	});



	test.suite('#build', () => {
		test.test('Constant returns an OP.Const.', () => {
			const value: AST.EXPR.Constant = AST.EXPR.Constant.fromSource('42');
			return assert.deepStrictEqual(value.build(), new OP.Const(value.interpreterValue));
		});
		test.test('Variable returns an OP.Get.', () => {
			const {stmts} = setupScript(`{
				val mut x: int = 42;
				x;
			}`, {codegen: false});
			const expr = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Variable;
			const symbol: SymbolSchema | undefined = expr.validator.getSymbol(expr.id);
			assert_instanceof(symbol, SymbolSchemaVar);
			return assert.deepStrictEqual(expr.build(), new OP.Get(symbol, typeUnit(42n)));
		});
		test.test('Template returns an OP.Template.', () => {
			assert.strictEqual(setupScript(`{
				"""hello {{ 42 }} world""";
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (STR.TEMPLATE (STR.CONST "hello ") (INT.CONST 42) (STR.CONST " world")))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('three-address code format.', () => {
			assert.strictEqual(setupScript(`{
				"""hello {{ """great {{ 42 }} big""" }} world""";
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <str> $0 (STR.TEMPLATE (STR.CONST "great ") (INT.CONST 42) (STR.CONST " big")))
					(DROP (STR.TEMPLATE (STR.CONST "hello ") (GET $0) (STR.CONST " world")))
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
		});
		test.suite('Claim', () => {
			test.test('returns the operand.', () => {
				const {stmts, builder} = setupScript(`{
					42 as <int>;
				}`, {codegen: false});
				const expr = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Claim;
				return assert.deepStrictEqual(expr.build(builder), expr.operand.build(builder));
			});
			test.test('repeated calls are idempotent.', () => {
				const {stmts, builder} = setupScript(`{
					(42 + 42 + 42) as <int | float>;
				}`, {build: false});
				assert.strictEqual(builder.instructions.length, 0);
				const expr = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Claim;
				expr.operand.build(builder);
				assert.strictEqual(builder.instructions.length, 1);
				expr.build(builder);
				assert.strictEqual(builder.instructions.length, 1);
			});
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
			assert.strictEqual(setupScript(`{
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
	});



	test.suite('Constant', () => {
		test.suite('#varCheck', () => {
			test.test('never throws.', () => {
				AST.EXPR.Constant.fromSource('42').varCheck();
			});
		});


		test.suite('#type', () => {
			test.test('returns the result of `this#interpreterValue`, wrapped in a `new Unit`.', () => {
				const constants: AST.EXPR.Constant[] = extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					55  -55  +033  -033  0  -0
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					"42😀"  "42\\u{1f600}"
				`).map((src) => AST.EXPR.Constant.fromSource(src));
				return assertEqualTypes(
					constants.map((c) => c.type()),
					constants.map((c) => new TYPE.Unit(c.interpreterValue)),
				);
			});
		});


		/* eslint-disable @stylistic/array-element-newline */
		test.suite('#interpreterValue', () => {
			test.test('computes null, boolean, and symbol values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
					new VALUE.Symbol(0x54n, 'then'),
					new VALUE.Symbol(0x46n, 'str'),
					new VALUE.Symbol(0x49n, 'false'),
					new VALUE.Symbol(Validator.cookTokenIdentifier('foobar'), 'foobar'),
				]);
			});
			test.test('computes int values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new VALUE.Integer(BigInt(v))));
			});
			test.test('computes nat values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					+55  +033  +0
					+\\o55  +\\q033
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					55, 33, 0,
					parseInt('55', 8), parseInt('33', 4),
				].map((v) => new VALUE.Natural(BigInt(v))));
			});
			test.test('computes float values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new VALUE.Float(v)));
			});
			test.test('computes string values.', () => {
				assert.deepStrictEqual(
					AST.EXPR.Constant.fromSource('"42😀\\u{1f600}"').interpreterValue,
					new VALUE.String('42😀\u{1f600}'),
				);
			});
		});
		/* eslint-enable @stylistic/array-element-newline */
	});



	test.suite('Variable', () => {
		test.suite('#varCheck', () => {
			test.test('throws if the validator does not contain a record for the identifier.', () => {
				setupScript(`{
					val mut i: int = 42;
					i;
				}`, {typeCheck: false}); // assert does not throw
				assert.throws(() => AST.EXPR.Variable.fromSource('i').varCheck(), ReferenceErrorUndeclared);
			});
			test.test('throws when declared in an inner scope.', () => {
				assert.throws(() => setupScript(`{
					if true then {
						val mut i: int = 42;
					};
					i;
				}`, {typeCheck: false}), ReferenceErrorUndeclared);
			});
			test.test('throws when there is a temporal dead zone.', {expectFailure: true}, () => {
				assert.throws(() => setupScript(`{
					i;
					val mut i: int = 42;
				}`, {typeCheck: false}), ReferenceErrorDeadZone);
			});
			test.test('throws if it was declared as a type alias.', () => {
				assert.throws(() => setupScript(`{
					type FOO = int;
					42 || FOO;
				}`, {typeCheck: false}), ReferenceErrorKind);
			});
			test.test('iteration variable of `for` loop is scoped only to the block.', () => {
				setupScript(`{
					for it: float in [1.1, 2.2, 3.3] do {
						it;
					};
				}`, {typeCheck: false}); // assert does not throw
				assert.throws(() => setupScript(`{
					for it: float in [1.1, 2.2, 3.3, it] do {
						42;
					};
				}`, {typeCheck: false}), ReferenceErrorUndeclared, 'iteraion variable cannot be referenced in the iterator expression.');
				assert.throws(() => setupScript(`{
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
					it;
				}`, {typeCheck: false}), ReferenceErrorUndeclared, 'iteration variable cannot be referenced after the iteration statement.');
			});
		});
	});



	test.suite('Template', () => {
		function initTemplates(): AST.EXPR.Template[] {
			return [
				AST.EXPR.Template.fromSource('"""42😀"""'),
				AST.EXPR.Template.fromSource('"""the answer is {{ 7 * 3 * 2 }} but what is the question?"""'),
				(setupScript(`{
					val mut x: int = 21;
					"""the answer is {{ x * 2 }} but what is the question?""";
				}`, {build: false}).stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Template,
			];
		}
		test.suite('#type', () => {
			test.test('always returns `String`.', () => {
				const templates: readonly AST.EXPR.Template[] = initTemplates();
				assertEqualTypes(
					templates.map((t) => t.type()),
					repeat(TYPE.STR, templates.length),
				);
			});
		});
	});



	test.suite('CollectionLiteral', () => {
		test.suite('#varCheck', () => {
			test.suite('{Type}Record,Dict', () => {
				test.test('var-checks all keys before all values.', () => {
					const {goal, stmts} = setupScript(`{
						type T = str;
						type U = (a: bool, b: (z: int), c: T, d: (y: float));
						val f: null = null;
						(e= [x= 42, w= 4.2], f= f);
						[g= (w= 42, x= 4.2), f= f];
					}`, {build: false});
					assert.partialDeepStrictEqual(
						goal.block!.validator.getAllSymbols(),
						new Map([
							[Validator.cookTokenIdentifier('T'), {source: 'T'}],
							[Validator.cookTokenIdentifier('U'), {source: 'U'}],
							[Validator.cookTokenIdentifier('f'), {source: 'f'}],
						]),
					);
					return assertEqualTypes(
						(stmts[1] as AST.STMT.DeclarationType).assigned.eval(),
						TYPE.Record.fromTypes(new Map([
							[Validator.cookTokenIdentifier('a'), TYPE.BOOL],
							[Validator.cookTokenIdentifier('b'), TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('z'), TYPE.INT]]))],
							[Validator.cookTokenIdentifier('c'), TYPE.STR],
							[Validator.cookTokenIdentifier('d'), TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('y'), TYPE.FLOAT]]))],
						])),
					);
				});
				test.test('throws if containing duplicate keys.', () => {
					[
						AST.TYPE.Record .fromSource('(a: int, b: float, c: str)'),
						AST.EXPR.Record .fromSource('(a= 1, b= 2.0, c= "three")'),
						AST.EXPR.Dict   .fromSource('[a= 1, b= 2.0, c= "three"]'),
					].forEach((node) => node.varCheck()); // assert does not throw

					[
						AST.TYPE.Record .fromSource('(a: int, b: float, a: str)'),
						AST.TYPE.Record .fromSource('(_: int, b: float, _: str)'),
						AST.EXPR.Record .fromSource('(a= 1, b= 2.0, a= "three")'),
						AST.EXPR.Record .fromSource('(_= 1, b= 2.0, _= "three")'),
						AST.EXPR.Dict   .fromSource('[a= 1, b= 2.0, a= "three"]'),
						AST.EXPR.Dict   .fromSource('[_= 1, b= 2.0, _= "three"]'),
					].forEach((node) => assert.throws(() => node.varCheck(), AssignmentErrorDuplicateKey));

					new Map<AST.AstNode, string[]>([
						[AST.TYPE.Record .fromSource('(c: int, d: float, c: str, d: bool)'),  ['c', 'd']],
						[AST.TYPE.Record .fromSource('(e: int, f: float, e: str, e: bool)'),  ['e', 'e']],
						[AST.EXPR.Record .fromSource('(c= 1, d= 2.0, c= "three", d= false)'), ['c', 'd']],
						[AST.EXPR.Record .fromSource('(e= 1, f= 2.0, e= "three", e= false)'), ['e', 'e']],
						[AST.EXPR.Dict   .fromSource('[c= 1, d= 2.0, c= "three", d= false]'), ['c', 'd']],
						[AST.EXPR.Dict   .fromSource('[e= 1, f= 2.0, e= "three", e= false]'), ['e', 'e']],
					]).forEach((dupes, node) => assert.throws(() => node.varCheck(), (err) => {
						assertAssignable(err as Error, {
							cons:   AggregateError,
							errors: dupes.map((k) => ({
								cons:    AssignmentErrorDuplicateKey,
								message: `Duplicate record/dict key \`${ k }\`.`,
							})),
						});
						return true;
					}));
				});
			});
		});


		test.suite('#type', () => {
			test.test('with constant folding on.', () => {
				const expected: readonly TYPE.Unit[] = [typeUnit(1n), typeUnit(2.0), typeUnit('three')];
				const collections: readonly [
					AST.EXPR.Tuple,
					AST.EXPR.Record,
					AST.EXPR.Set,
					AST.EXPR.Map,
				] = [
					AST.EXPR.Tuple  .fromSource('(   1,    2.0,    "three")'),
					AST.EXPR.Record .fromSource('(a= 1, b= 2.0, _= "three")'),
					AST.EXPR.Set    .fromSource('{   1,    2.0,    "three"}'),
					AST.EXPR.Map    .fromSource(`
						{
							"a" || "" -> 1,
							21 + 21   -> 2.0,
							3.0 * 1.0 -> "three",
						}
					`),
				];
				return assertEqualTypes(
					collections.map((node) => node.type()),
					[
						TYPE.Tuple.fromTypes(expected),
						TYPE.Record.fromTypes(new Map(collections[1].children.map((c, i) => [
							c.key.id,
							expected[i],
						]))),
						new TYPE.Set(TYPE.Union.all(...expected), true),
						new TYPE.Map(
							TYPE.Union.all(typeUnit('a'), TYPE.INT, TYPE.FLOAT),
							TYPE.Union.all(...expected),
							true,
						),
					],
				);
			});
			test.test('does not throw if value type contains reference type.', () => {
				setupScript(`{
					(   1,    [2.2],    "three");
					(a= 1, b= [2.2], c= "three");
				}`, {build: false}); // assert does not throw
			});
		});
	});



	test.suite('Claim', () => {
		test.suite('#type', () => {
			test.test('returns the type value of the claimed type.', () => {
				assert.ok(AST.EXPR.Claim.fromSource('3 as <int | null>').type().equals(TYPE.INT.union(TYPE.NULL)));
			});
			test.test('allows claiming to `nothing` even though intersection is empty.', () => {
				assert.ok(AST.EXPR.Claim.fromSource('42 as <nothing>').type().isBottomType);
			});
			test.test('allows claiming a `nothing` expression even though intersection is empty.', () => {
				const claim: AST.EXPR.Claim = AST.EXPR.Claim.fromSource('n as <int>');
				const id: bigint = Validator.cookTokenIdentifier('n');
				claim.validator.addSymbol(new SymbolSchemaVar(id, claim.operand, false, false));
				(claim.validator.getSymbol(id) as SymbolSchemaVar).type = TYPE.NOTHING;
				assert.strictEqual(claim.type(), TYPE.INT);
			});
			test.test('allows claiming to a type alias.', () => {
				const claim: AST.EXPR.Claim = AST.EXPR.Claim.fromSource('"Alice" as <Name>');
				const id: bigint = Validator.cookTokenIdentifier('Name');
				claim.validator.addSymbol(new SymbolSchemaType(id, claim.claimed_type));
				(claim.validator.getSymbol(id) as SymbolSchemaType).typevalue = TYPE.STR;
				assert.strictEqual(claim.type(), TYPE.STR);
			});
			test.test('throws when the operand type and claimed type do not overlap (and neither is `nothing`).', () => {
				assert.throws(() => AST.EXPR.Claim.fromSource('3 as <str>')       .type(), TypeErrorNotAssignable);
				assert.throws(() => AST.EXPR.Claim.fromSource('"three" as <int>') .type(), TypeErrorNotAssignable);
				assert.throws(() => AST.EXPR.Claim.fromSource('3 as <float>')     .type(), TypeErrorNotAssignable);
				assert.throws(() => AST.EXPR.Claim.fromSource('3.0 as <int>')     .type(), TypeErrorNotAssignable);
			});
		});
	});



	test.suite('ExpressionBlock', () => {
		test.suite('#type', () => {
			test.test('throws when the last statement is not an expression-statement.', () => {
				const {goal} = setupScript(`{
					val mut x: int = 42;
					val mut y: int | null = {
						x;
						val mut z: int = 69;
						%> Error!
					};
					x;
					y;
				}`, {typeCheck: false});
				assert.throws(() => goal.typeCheck(), /The last statement of a block-expression must be an expression-statement/);
			});
			test.test('throws when the determinant is empty.', () => {
				const {goal} = setupScript(`{
					val mut x: int = 42;
					val mut y: int | null = {
						x;
						val mut z: int = 69;
						; %> Error!
					};
					x;
					y;
				}`, {typeCheck: false});
				assert.throws(() => goal.typeCheck(), /The determining expression-statement of a block-expression must be nonempty/);
			});
			test.test('returns the type of the determinant.', () => {
				const {stmts} = setupScript(`{
					val mut x: int = 42;
					val mut y: int | null = {
						x;
						val mut z: int = 69;
						z; % type \`int\`
					};
					x;
					y;
				}`, {build: false});
				assertEqualTypes((stmts[1] as AST.STMT.DeclarationVariable).assigned!.type(), TYPE.INT);
			});
		});
	});
});
