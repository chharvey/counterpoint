import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	Optimizer,
	IR,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateKey,
	TypeErrorNotAssignable,
} from '../../../src/index.ts';
import {
	assertEqualTypes,
	assertAssignable,
} from '../../assert-helpers.ts';
import {
	setupScript,
	typeUnit,
} from '../../helpers.ts';
import {
	extract_tokens,
	repeat,
} from '../../utils.ts';



test.suite('ASTNodeExpression', () => {
	test.suite('#lower', () => {
		test.test('AST.Constant returns an IR.Const.', () => {
			const value: AST.ASTNodeConstant = AST.ASTNodeConstant.fromSource('42');
			return assert.deepStrictEqual(value.lower(), new IR.Const(value.fold()));
		});
		test.test('AST.Variable returns an IR.Get.', () => {
			const {stmts} = setupScript(`{
				val mut x: int = 42;
				x;
			}`, {codegen: false});
			const expr = (stmts[1] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
			const symbol: SymbolSchema | undefined = expr.validator.getSymbol(expr.id);
			assert_instanceof(symbol, SymbolSchemaVar);
			return assert.deepStrictEqual(expr.lower(), new IR.Get(symbol));
		});
		test.test('AST.Template returns an IR.Template.', () => {
			const opt = new Optimizer();
			const tpl: AST.ASTNodeTemplate = AST.ASTNodeTemplate.fromSource('"""hello {{ 42 }} world"""');
			const value: IR.Template = tpl.lower(opt);
			assert.deepStrictEqual(value, new IR.Template(tpl.children.map((c) => c.lower(opt))));
			return assert.strictEqual(value.toString(), '(STR.TEMPLATE (STR.CONST "hello ") (INT.CONST 42) (STR.CONST " world"))');
		});
		test.test('AST.Tuple returns an IR.CollectionLinearNew.', () => {
			assert.strictEqual(setupScript(`{
				val mut x: bool  = false;
				val mut y: int   = 5;
				val mut z: float = 0.2;
				(x, y + 2, 3.0 * z - 1.0);
			}`, {codegen: false}).opt.print(), xjs.String.dedent`
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
		test.test('AST.Record returns an IR.RecordNew.', () => {
			assert.strictEqual(setupScript(`{
				val x: bool  = false;
				val y: int   = 5;
				val z: float = 0.2;
				(a= x, b= y + 2, c= 3.0 * z - 1.0);
			}`, {codegen: false}).opt.print(), xjs.String.dedent`
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
		test.test('AST.List returns an IR.CollectionLinearNew.', () => {
			assert.strictEqual(setupScript(`{
				[false, 5 + 2, 3.0 * 0.2 - 1.0];
			}`, {codegen: false}).opt.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
					(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
					(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
					(DROP (LIST.NEW (BOOL.CONST false) (GET $0) (GET $2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('AST.Dict returns an IR.DictNew.', () => {
			assert.strictEqual(setupScript(`{
				[a= false, b= 5 + 2, c= 3.0 * 0.2 - 1.0];
			}`, {codegen: false}).opt.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
					(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
					(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
					(DROP (DICT.NEW @a->(BOOL.CONST false) @b->(GET $0) @c->(GET $2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('AST.Set returns an IR.CollectionLinearNew.', () => {
			assert.strictEqual(setupScript(`{
				{false, 5 + 2, 3.0 * 0.2 - 1.0};
			}`, {codegen: false}).opt.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
					(DECL <float> $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
					(DECL <float> $2 (FLOAT.SUB (GET $1) (FLOAT.CONST 1.0)))
					(DROP (SET.NEW (BOOL.CONST false) (GET $0) (GET $2)))
					(ENDPROGRAM)
			`.trim());
		});
		test.suite('AST.Map', () => {
			test.test('returns an IR.MapNew.', () => {
				assert.strictEqual(setupScript(`{
					{"a" -> false, "b" -> 5 + 2, "c" -> 3.0 * 0.2 - 1.0};
				}`, {codegen: false}).opt.print(), xjs.String.dedent`
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
				}`, {codegen: false}).opt.print(), xjs.String.dedent`
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
		test.test('AST.ExpressionBlock returns the last expression-statement’s expression.', () => {
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
			}`, {codegen: false}).opt.print(), xjs.String.dedent`
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
		test.suite('AST.Claim', () => {
			test.test('returns the operand.', () => {
				const {stmts, opt} = setupScript(`{
					42 as <int>;
				}`, {codegen: false});
				const expr = (stmts[0] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeClaim;
				return assert.deepStrictEqual(expr.lower(opt), expr.operand.lower(opt));
			});
			test.test('repeated calls are idempotent.', () => {
				const {stmts, opt} = setupScript(`{
					(42 + 42 + 42) as <int | float>;
				}`, {lower: false});
				assert.strictEqual(opt.instructions.length, 0);
				const expr = (stmts[0] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeClaim;
				expr.operand.lower(opt);
				assert.strictEqual(opt.instructions.length, 1);
				expr.lower(opt);
				assert.strictEqual(opt.instructions.length, 1);
			});
		});
	});



	test.suite('ASTNodeConstant', () => {
		test.suite('#varCheck', () => {
			test.test('never throws.', () => {
				AST.ASTNodeConstant.fromSource('42').varCheck();
			});
		});


		test.suite('#type', () => {
			test.test('returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
				const constants: AST.ASTNodeConstant[] = extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					55  -55  +033  -033  0  -0
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					"42😀"  "42\\u{1f600}"
				`).map((src) => AST.ASTNodeConstant.fromSource(src));
				return assertEqualTypes(
					constants.map((c) => c.type()),
					constants.map((c) => new TYPE.Unit(c.fold())),
				);
			});
		});


		/* eslint-disable @stylistic/array-element-newline */
		test.suite('#fold', () => {
			test.test('computes null, boolean, and symbol values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
				`).map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
					new VALUE.Symbol(0x92n,  'then'),
					new VALUE.Symbol(0x86n,  'str'),
					new VALUE.Symbol(0x89n,  'false'),
					new VALUE.Symbol(0x100n, 'foobar'),
				]);
			});
			test.test('computes int values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`).map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new VALUE.Integer(BigInt(v))));
			});
			test.test('computes nat values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					+55  +033  +0
					+\\o55  +\\q033
				`).map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					55, 33, 0,
					parseInt('55', 8), parseInt('33', 4),
				].map((v) => new VALUE.Natural(BigInt(v))));
			});
			test.test('computes float values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`).map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new VALUE.Float(v)));
			});
			test.test('computes string values.', () => {
				assertEqualTypes(
					AST.ASTNodeConstant.fromSource('"42😀\\u{1f600}"').type(),
					typeUnit('42😀\u{1f600}'),
				);
			});
		});
		/* eslint-enable @stylistic/array-element-newline */
	});



	test.suite('ASTNodeVariable', () => {
		test.suite('#varCheck', () => {
			test.test('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`{
					val mut i: int = 42;
					i;
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource('i').varCheck(), ReferenceErrorUndeclared);
			});
			test.test('throws when declared in an inner scope.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					if true then {
						val mut i: int = 42;
					};
					i;
				}`).varCheck(), ReferenceErrorUndeclared);
			});
			test.test.todo('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					i;
					val mut i: int = 42;
				}`).varCheck(), ReferenceErrorDeadZone);
			});
			test.test('throws if it was declared as a type alias.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type FOO = int;
					42 || FOO;
				}`).varCheck(), ReferenceErrorKind);
			});
			test.test('iteration variable of `for` loop is scoped only to the block.', () => {
				AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3] do {
						it;
					};
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3, it] do {
						42;
					};
				}`).varCheck(), ReferenceErrorUndeclared, 'iteraion variable cannot be referenced in the iterator expression.');
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
					it;
				}`).varCheck(), ReferenceErrorUndeclared, 'iteration variable cannot be referenced after the iteration statement.');
			});
		});


		test.suite('#type', () => {
			test.test('unions with `null` when accessed variable is uninitialized.', () => {
				const {stmts} = setupScript(`{
					val mut w:  int = 42;
					val mut x?: int;
					w;
					x;
				}`, {lower: false});
				assert.ok( (stmts[0] as AST.ASTNodeDeclarationVariable).assigned);
				assert.ok(!(stmts[1] as AST.ASTNodeDeclarationVariable).assigned);
				return assertEqualTypes(
					stmts.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
					[
						TYPE.INT,
						TYPE.INT.union(TYPE.NULL),
					],
				);
			});
		});


		test.suite('#fold', () => {
			test.test('assesses the value of a read-only variable.', () => {
				const {stmts} = setupScript(`{
					val x: int = 21 * 2;
					x;
				}`, {lower: false});
				assert.ok(!(stmts[0] as AST.ASTNodeDeclarationVariable).writable);
				assert.deepStrictEqual(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					new VALUE.Integer(42n),
				);
			});
			test.test('returns null for a writable variable.', () => {
				const {stmts} = setupScript(`{
					val mut x: int = 21 * 2;
					x;
				}`, {lower: false});
				assert.ok((stmts[0] as AST.ASTNodeDeclarationVariable).writable);
				assert.deepStrictEqual(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			test.test('returns null for a read-only variable of mutable type.', () => {
				const {stmts} = setupScript(`{
					val fixed_mutable: mut {int} = {1, 2, 3};
					fixed_mutable;
				}`, {lower: false});
				assert.ok((stmts[0] as AST.ASTNodeDeclarationVariable).typenode!.eval().hasMutable);
				assert.deepStrictEqual(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			test.test('returns null for an uncomputable read-only variable.', () => {
				const {stmts} = setupScript(`{
					val mut x: int = 21 * 2;
					val y: int = x / 2;
					y;
					val z: mut {int} = {11, 22, 33};
					val w: bool = z.[22];
					w;
				}`, {lower: false});
				assert.ok(!(stmts[1] as AST.ASTNodeDeclarationVariable).writable);
				assert.ok(!(stmts[4] as AST.ASTNodeDeclarationVariable).writable);
				assert.deepStrictEqual(
					[
						(stmts[2] as AST.ASTNodeStatementExpression).expr!.fold(),
						(stmts[5] as AST.ASTNodeStatementExpression).expr!.fold(),
					],
					[null, null],
				);
			});
		});
	});



	test.suite('ASTNodeTemplate', () => {
		function initTemplates(): AST.ASTNodeTemplate[] {
			return [
				AST.ASTNodeTemplate.fromSource('"""42😀"""'),
				AST.ASTNodeTemplate.fromSource('"""the answer is {{ 7 * 3 * 2 }} but what is the question?"""'),
				(setupScript(`{
					val mut x: int = 21;
					"""the answer is {{ x * 2 }} but what is the question?""";
				}`, {lower: false}).stmts[1] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTemplate,
			];
		}
		test.suite('#type', () => {
			test.test('always returns `String`.', () => {
				const templates: readonly AST.ASTNodeTemplate[] = initTemplates();
				assertEqualTypes(
					templates.map((t) => t.type()),
					repeat(TYPE.STR, templates.length),
				);
			});
		});


		test.suite('#fold', () => {
			let templates: AST.ASTNodeTemplate[] = [];
			test.test.before(() => {
				templates = initTemplates();
			});
			test.test('returns a constant String for ASTNodeTemplate with no interpolations.', () => {
				assert.deepStrictEqual(
					templates[0].fold(),
					new VALUE.String('42😀'),
				);
			});
			test.test('returns a constant String for ASTNodeTemplate with foldable interpolations.', () => {
				assert.deepStrictEqual(
					templates[1].fold(),
					new VALUE.String('the answer is 42 but what is the question?'),
				);
			});
			test.test('returns null for ASTNodeTemplate with dynamic interpolations.', () => {
				assert.deepStrictEqual(
					templates[2].fold(),
					null,
				);
			});
		});
	});



	test.suite('ASTNodeCollectionLiteral', () => {
		test.suite('#varCheck', () => {
			test.suite('ASTNode{{Type}Record,Dict}', () => {
				test.test('var-checks all keys before all values.', () => {
					const {goal, stmts} = setupScript(`{
						type T = str;
						type U = (a: bool, b: (z: int), c: T, d: (y: float));
						val f: null = null;
						(e= [x= 42, w= 4.2], f= f);
						[g= (w= 42, x= 4.2), f= f];
					}`, {lower: false});
					assert.partialDeepStrictEqual(
						goal.block!.validator.getAllSymbols(),
						new Map([
							[0x100n, {source: 'T'}],
							[0x107n, {source: 'U'}],
							[0x108n, {source: 'f'}],
						]),
					);
					assertEqualTypes(
						(stmts[1] as AST.ASTNodeDeclarationType).assigned.eval(),
						TYPE.Record.fromTypes(new Map([
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.Record.fromTypes(new Map([[0x105n, TYPE.INT]]))],
							[0x103n, TYPE.STR],
							[0x104n, TYPE.Record.fromTypes(new Map([[0x106n, TYPE.FLOAT]]))],
						])),
					);
					return assert.deepStrictEqual(stmts.slice(3, 5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.fold()), [
						new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x109n, new VALUE.Dict(new Map<bigint, VALUE.Value>([
								[0x10an, new VALUE.Integer(42n)],
								[0x10bn, new VALUE.Float(4.2)],
							]))],
							[0x108n, VALUE.NULL],
						])),
						new VALUE.Dict(new Map<bigint, VALUE.Value>([
							[0x10cn, new VALUE.Record(new Map<bigint, VALUE.Value>([
								[0x10bn, new VALUE.Integer(42n)],
								[0x10an, new VALUE.Float(4.2)],
							]))],
							[0x108n, VALUE.NULL],
						])),
					]);
				});
				test.test('throws if containing duplicate keys.', () => {
					[
						AST.ASTNodeTypeRecord .fromSource('(a: int, b: float, c: str)'),
						AST.ASTNodeRecord     .fromSource('(a= 1, b= 2.0, c= "three")'),
						AST.ASTNodeDict       .fromSource('[a= 1, b= 2.0, c= "three"]'),
					].forEach((node) => node.varCheck()); // assert does not throw

					[
						AST.ASTNodeTypeRecord .fromSource('(a: int, b: float, a: str)'),
						AST.ASTNodeTypeRecord .fromSource('(_: int, b: float, _: str)'),
						AST.ASTNodeRecord     .fromSource('(a= 1, b= 2.0, a= "three")'),
						AST.ASTNodeRecord     .fromSource('(_= 1, b= 2.0, _= "three")'),
						AST.ASTNodeDict       .fromSource('[a= 1, b= 2.0, a= "three"]'),
						AST.ASTNodeDict       .fromSource('[_= 1, b= 2.0, _= "three"]'),
					].forEach((node) => assert.throws(() => node.varCheck(), AssignmentErrorDuplicateKey));

					new Map<AST.ASTNodeCP, string[]>([
						[AST.ASTNodeTypeRecord .fromSource('(c: int, d: float, c: str, d: bool)'),  ['c', 'd']],
						[AST.ASTNodeTypeRecord .fromSource('(e: int, f: float, e: str, e: bool)'),  ['e', 'e']],
						[AST.ASTNodeRecord     .fromSource('(c= 1, d= 2.0, c= "three", d= false)'), ['c', 'd']],
						[AST.ASTNodeRecord     .fromSource('(e= 1, f= 2.0, e= "three", e= false)'), ['e', 'e']],
						[AST.ASTNodeDict       .fromSource('[c= 1, d= 2.0, c= "three", d= false]'), ['c', 'd']],
						[AST.ASTNodeDict       .fromSource('[e= 1, f= 2.0, e= "three", e= false]'), ['e', 'e']],
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
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeSet,
					AST.ASTNodeMap,
				] = [
					AST.ASTNodeTuple  .fromSource('(   1,    2.0,    "three")'),
					AST.ASTNodeRecord .fromSource('(a= 1, b= 2.0, _= "three")'),
					AST.ASTNodeSet    .fromSource('{   1,    2.0,    "three"}'),
					AST.ASTNodeMap.fromSource(`
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
						new TYPE.Set(TYPE.Union.all(expected), true),
						new TYPE.Map(
							TYPE.Union.all([typeUnit('a'), TYPE.INT, TYPE.FLOAT]),
							TYPE.Union.all(expected),
							true,
						),
					],
				);
			});
			test.test('does not throw if value type contains reference type.', () => {
				setupScript(`{
					(   1,    [2.2],    "three");
					(a= 1, b= [2.2], c= "three");
				}`, {lower: false}); // assert does not throw
			});
		});


		test.suite('#fold', () => {
			test.test('returns Tuple/Record for constant collections.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple  .fromSource('(   1,    2.0,    "three")'),
						AST.ASTNodeRecord .fromSource('(a= 1, b= 2.0, c= "three")'),
					].map((c) => c.fold()),
					[
						new VALUE.Tuple([
							new VALUE.Integer(1n),
							new VALUE.Float(2.0),
							new VALUE.String('three'),
						]),
						new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x100n, new VALUE.Integer(1n)],
							[0x101n, new VALUE.Float(2.0)],
							[0x102n, new VALUE.String('three')],
						])),
					],
				);
			});
			test.test('returns a constant List/Dict/Set/Map for foldable entries.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeList.fromSource('[1, 2.0, "three"]'),
						AST.ASTNodeDict.fromSource('[a= 1, b= 2.0, c= "three"]'),
						AST.ASTNodeSet.fromSource('{1, 2.0, "three"}'),
						AST.ASTNodeMap.fromSource(`
							{
								"a" || "" -> 1,
								21 + 21   -> 2.0,
								3.0 * 1.0 -> "three",
							}
						`),
					].map((c) => c.fold()),
					[
						new VALUE.List([
							new VALUE.Integer(1n),
							new VALUE.Float(2.0),
							new VALUE.String('three'),
						]),
						new VALUE.Dict(new Map<bigint, VALUE.Value>([
							[0x100n, new VALUE.Integer(1n)],
							[0x101n, new VALUE.Float(2.0)],
							[0x102n, new VALUE.String('three')],
						])),
						new VALUE.Set(new Set([
							new VALUE.Integer(1n),
							new VALUE.Float(2.0),
							new VALUE.String('three'),
						])),
						new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
							[new VALUE.String('a'),  new VALUE.Integer(1n)],
							[new VALUE.Integer(42n), new VALUE.Float(2.0)],
							[new VALUE.Float(3.0),   new VALUE.String('three')],
						])),
					],
				);
			});
			test.test('returns null for non-foldable entries.', () => {
				xjs.Array.forEachAggregated(setupScript(`{
					val mut x: int   = 1;
					val mut y: float = 2.0;
					val mut z: str   = "three";
					(x, 2.0, "three");
					(a= 1, b= y, c= "three");
					[x, 2.0, "three"];
					[a= 1, b= y, c= "three"];
					{1, 2.0, z};
					{
						"a" || "" -> 1,
						21 + 21   -> 2.0,
						3.0 * 1.0 -> z,
					};
				}`, {lower: false}).stmts.slice(3), (c) => assert.strictEqual((c as AST.ASTNodeStatementExpression).expr!.fold(), null));
			});
		});
	});



	test.suite('ASTNodeClaim', () => {
		const samples: string[] = [
			'null',
			'false',
			'true',
			'0',
			'+0',
			'-0',
			'42',
			'+42',
			'-42',
			'0.0',
			'+0.0',
			'-0.0',
			'-4.2e-2',
		];


		test.suite('#type', () => {
			test.test('returns the type value of the claimed type.', () => {
				assert.ok(AST.ASTNodeClaim.fromSource('3 as <int?>').type().equals(TYPE.INT.union(TYPE.NULL)));
			});
			test.test('allows claiming to `nothing` even though intersection is empty.', () => {
				assert.ok(AST.ASTNodeClaim.fromSource('42 as <nothing>').type().isBottomType);
			});
			test.test('allows claiming a `nothing` expression even though intersection is empty.', () => {
				const claim: AST.ASTNodeClaim = AST.ASTNodeClaim.fromSource('n as <int>');
				claim.validator.addSymbol(new SymbolSchemaVar(claim.operand as AST.ASTNodeVariable, false, false));
				(claim.validator.getSymbol(0x100n) as SymbolSchemaVar).type = TYPE.NOTHING;
				assert.strictEqual(claim.type(), TYPE.INT);
			});
			test.test('allows claiming to a type alias.', () => {
				const claim: AST.ASTNodeClaim = AST.ASTNodeClaim.fromSource('"Alice" as <Name>');
				claim.validator.addSymbol(new SymbolSchemaType(claim.claimed_type as AST.ASTNodeTypeAlias));
				(claim.validator.getSymbol(0x100n) as SymbolSchemaType).typevalue = TYPE.STR;
				assert.strictEqual(claim.type(), TYPE.STR);
			});
			test.test('throws when the operand type and claimed type do not overlap (and neither is `nothing`).', () => {
				assert.throws(() => AST.ASTNodeClaim.fromSource('3 as <str>')      .type(), TypeErrorNotAssignable);
				assert.throws(() => AST.ASTNodeClaim.fromSource('"three" as <int>').type(), TypeErrorNotAssignable);
				assert.throws(() => AST.ASTNodeClaim.fromSource('3 as <float>')    .type(), TypeErrorNotAssignable);
				assert.throws(() => AST.ASTNodeClaim.fromSource('3.0 as <int>')    .type(), TypeErrorNotAssignable);
			});
		});


		test.suite('#fold', () => {
			test.test('returns the fold of the operand.', () => {
				samples.forEach((expr) => assert.deepStrictEqual(
					AST.ASTNodeClaim     .fromSource(`${ expr } as <anything>`) .fold(),
					AST.ASTNodeExpression.fromSource(expr).fold(),
					expr,
				));
			});
		});
	});



	test.suite('ASTNodeExpressionBlock', () => {
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
				}`, {lower: false});
				assertEqualTypes((stmts[1] as AST.ASTNodeDeclarationVariable).assigned!.type(), TYPE.INT);
			});
		});


		test.suite('#fold', () => {
			test.test('returns null if the block is not foldable.', () => {
				assert.strictEqual(((setupScript(`{
					val mut x: int = 42;
					val z: int = 69;
					val mut y: int | null = {
						x;
						z;
					};
					x;
					y;
				}`, {lower: false}).stmts[2] as AST.ASTNodeDeclarationVariable).assigned as AST.ASTNodeExpressionBlock).fold(), null);
			});
			test.test('returns the folded value of the last statement, provided the block is foldable.', () => {
				const {stmts} = setupScript(`{
					val x: int = 42;
					val z: int = 69;
					val y: int | null = {
						x;
						val w: int = x;
						w;
						;
						z;
					};
					x;
					y;
				}`, {lower: false});
				const block_expression = (stmts[2] as AST.ASTNodeDeclarationVariable).assigned as AST.ASTNodeExpressionBlock;
				assert.strictEqual(
					block_expression.fold(),
					(block_expression.block.children.at(-1) as AST.ASTNodeStatementExpression).expr!.fold(),
				);
				return assert.deepStrictEqual(
					(stmts[4] as AST.ASTNodeStatementExpression).expr!.fold(),
					new VALUE.Integer(69n),
				);
			});
			test.test('sanity check.', () => {
				assert.deepStrictEqual(
					(setupScript(`{
						val x: int = 42 - { 42; 69; };
						x;
					}`, {lower: false}).stmts[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					new VALUE.Integer(42n - 69n),
				);
			});
		});
	});
});
