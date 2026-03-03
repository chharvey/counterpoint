import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	assert_instanceof,
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	Optimizer,
	IR,
	type Builder,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateKey,
} from '../../../src/index.ts';
import {
	assertEqualTypes,
	assertEqualBins,
	assertAssignable,
} from '../../assert-helpers.ts';
import {
	CONFIG_FOLDING_OFF,
	typeUnit,
	buildConst,
} from '../../helpers.ts';
import {
	extract_tokens,
	extract_lines,
} from '../../utils.ts';



describe('ASTNodeExpression', () => {
	describe('#lower', () => {
		function setupScript(src: string, opts: object): {goal: AST.ASTNodeGoal, opt: Optimizer} {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src.slice(1, -1));
			goal.varCheck();
			goal.typeCheck();
			'lower' in opts && opts.lower && goal.lower(opt);
			return {goal, opt};
		}

		xjs.Map.forEachAggregated(new Map<ConstructorType<AST.ASTNodeExpression>, string>([
			[AST.ASTNodeTemplate, '"""hello {{ 42 }} world"""'],
		]), (src, klass) => {
			it(klass.name, () => {
				const opt = new Optimizer();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`${ src };`);
				goal.varCheck();
				goal.typeCheck();
				const expr: AST.ASTNodeExpression = (goal.children[0] as AST.ASTNodeStatementExpression).expr!;
				assert_instanceof(expr, klass);
				return assert.throws(() => expr.lower(opt), /not yet supported/);
			});
		});

		it('AST.Constant returns an IR.Const.', () => {
			const value: AST.ASTNodeConstant = AST.ASTNodeConstant.fromSource('42;');
			return assert.deepStrictEqual(value.lower(), new IR.Const(value.fold()));
		});
		it('AST.Variable returns an IR.Variable.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut x: int = 42;
				x;
			`);
			goal.varCheck();
			goal.typeCheck();
			const expr = (goal.children[1] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
			const symbol: SymbolSchema | null = expr.validator.getSymbolInfo(expr.id);
			assert_instanceof(symbol, SymbolSchemaVar);
			return assert.deepStrictEqual(expr.lower(), new IR.Get(symbol));
		});
		it('AST.Tuple returns an IR.CollectionIndexedNew.', () => {
			assert.strictEqual(setupScript(`{
				val mut x: bool  = false;
				val mut y: int   = 5;
				val mut z: float = 0.2;
				(x, y + 2, 3.0 * z - 1.0);
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL BOOL x (BOOL.CONST false))
				(DECL INT y (INT.CONST 5))
				(DECL FLOAT z (FLOAT.CONST 0.2))
				(DECL INT $0 (INT.ADD (GET y) (INT.CONST 2)))
				(DECL FLOAT $1 (FLOAT.MUL (FLOAT.CONST 3.0) (GET z)))
				(DECL FLOAT $2 (FLOAT.NEG (FLOAT.CONST 1.0)))
				(DECL FLOAT $3 (FLOAT.ADD (GET $1) (GET $2)))
				(DROP (TUPLE.NEW (GET x) (GET $0) (GET $3)))
			`.join('\n'));
		});
		it('AST.Record returns an IR.RecordNew.', () => {
			assert.strictEqual(setupScript(`{
				val x: bool  = false;
				val y: int   = 5;
				val z: float = 0.2;
				(a= x, b= y + 2, c= 3.0 * z - 1.0);
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL BOOL x (BOOL.CONST false))
				(DECL INT y (INT.CONST 5))
				(DECL FLOAT z (FLOAT.CONST 0.2))
				(DECL INT $0 (INT.ADD (GET y) (INT.CONST 2)))
				(DECL FLOAT $1 (FLOAT.MUL (FLOAT.CONST 3.0) (GET z)))
				(DECL FLOAT $2 (FLOAT.NEG (FLOAT.CONST 1.0)))
				(DECL FLOAT $3 (FLOAT.ADD (GET $1) (GET $2)))
				(DROP (RECORD.NEW @a->(GET x) @b->(GET $0) @c->(GET $3)))
			`.join('\n'));
		});
		it('AST.List returns an IR.CollectionIndexedNew.', () => {
			assert.strictEqual(setupScript(`{
				[false, 5 + 2, 3.0 * 0.2 - 1.0];
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL INT $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
				(DECL FLOAT $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
				(DECL FLOAT $2 (FLOAT.NEG (FLOAT.CONST 1.0)))
				(DECL FLOAT $3 (FLOAT.ADD (GET $1) (GET $2)))
				(DROP (LIST.NEW (BOOL.CONST false) (GET $0) (GET $3)))
			`.join('\n'));
		});
		it('AST.Dict returns an IR.DictNew.', () => {
			assert.strictEqual(setupScript(`{
				[a= false, b= 5 + 2, c= 3.0 * 0.2 - 1.0];
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL INT $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
				(DECL FLOAT $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
				(DECL FLOAT $2 (FLOAT.NEG (FLOAT.CONST 1.0)))
				(DECL FLOAT $3 (FLOAT.ADD (GET $1) (GET $2)))
				(DROP (DICT.NEW @a->(BOOL.CONST false) @b->(GET $0) @c->(GET $3)))
			`.join('\n'));
		});
		it('AST.Set returns an IR.SetNew.', () => {
			assert.strictEqual(setupScript(`{
				{false, 5 + 2, 3.0 * 0.2 - 1.0};
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL INT $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
				(DECL FLOAT $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
				(DECL FLOAT $2 (FLOAT.NEG (FLOAT.CONST 1.0)))
				(DECL FLOAT $3 (FLOAT.ADD (GET $1) (GET $2)))
				(DROP (SET.NEW (BOOL.CONST false) (GET $0) (GET $3)))
			`.join('\n'));
		});
		describe('AST.Map', () => {
			it('returns an IR.MapNew.', () => {
				assert.strictEqual(setupScript(`{
					{"a" -> false, "b" -> 5 + 2, "c" -> 3.0 * 0.2 - 1.0};
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL INT $0 (INT.ADD (INT.CONST 5) (INT.CONST 2)))
					(DECL FLOAT $1 (FLOAT.MUL (FLOAT.CONST 3.0) (FLOAT.CONST 0.2)))
					(DECL FLOAT $2 (FLOAT.NEG (FLOAT.CONST 1.0)))
					(DECL FLOAT $3 (FLOAT.ADD (GET $1) (GET $2)))
					(DROP (MAP.NEW (STR.CONST "a")->(BOOL.CONST false) (STR.CONST "b")->(GET $0) (STR.CONST "c")->(GET $3)))
				`.join('\n'));
			});
			it('evaluates antecedents and consequents interchangeably in source order.', () => {
				assert.strictEqual(setupScript(`{
					{[10] -> 10 + 1, [12] -> 5 * 2 + 3, [7 * 2] -> 15};
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL LIST $0 (LIST.NEW (INT.CONST 10)))
					(DECL INT $1 (INT.ADD (INT.CONST 10) (INT.CONST 1)))
					(DECL LIST $2 (LIST.NEW (INT.CONST 12)))
					(DECL INT $3 (INT.MUL (INT.CONST 5) (INT.CONST 2)))
					(DECL INT $4 (INT.ADD (GET $3) (INT.CONST 3)))
					(DECL INT $5 (INT.MUL (INT.CONST 7) (INT.CONST 2)))
					(DECL LIST $6 (LIST.NEW (GET $5)))
					(DROP (MAP.NEW (GET $0)->(GET $1) (GET $2)->(GET $4) (GET $6)->(INT.CONST 15)))
				`.join('\n'));
			});
		});

		// TODO: move these to ASTNodeStatement tests
		it('AST.DeclarationVariable pushes (DECL+SET)/DROP instruction depending on presence of child nodes.', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				% Foldable cases:
				val _:          int = 42; % \`(DROP (INT.CONST 42))\`
				val assignee_a: int = 42; % \`(DECL INT assignee_a (INT.CONST 42))\`

				% Non-Foldable cases:
				val mut assignee_b?: int;              % \`(DECL NULL assignee_b null)\`
				val mut assignee_c:  int = 42;         % \`(DECL INT assignee_c 42)\`
				val     _:           int = assignee_c; % \`(DROP assignee_c)\`
				val     assignee_d:  int = assignee_c; % \`(DECL INT assignee_d assignee_c)\`
				val mut assignee_e:  int = assignee_c; % \`(DECL INT assignee_e assignee_c)\`

				%% Syntactically impossible cases (for completion):
				val _?:          int;
				val assignee_f?: int;
				val mut _?:      int;
				val mut _:       int = 42;
				val mut _:       int = assignee_c;
				%%
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.children.forEach((stmt) => (stmt as AST.ASTNodeDeclarationVariable).lower(opt));
			return assert.strictEqual(opt.print(), extract_lines`
				(DROP (INT.CONST 42))
				(DECL INT assignee_a (INT.CONST 42))
				(DECL NULL assignee_b (NULL.CONST null))
				(DECL INT assignee_c (INT.CONST 42))
				(DROP (GET assignee_c))
				(DECL INT assignee_d (GET assignee_c))
				(DECL INT assignee_e (GET assignee_c))
			`.join('\n'));
		});
		it('AST.StatementExpression pushes DROP instruction if expression exists and is non-foldable.', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut x: int = 42;
				x;
				42;
				;
			`);
			goal.varCheck();
			goal.typeCheck();
			assert.strictEqual(opt.instructions.length, 0);
			(goal.children[1] as AST.ASTNodeStatementExpression).lower(opt);
			assert.strictEqual(opt.instructions.length, 1);
			(goal.children[2] as AST.ASTNodeStatementExpression).lower(opt);
			assert.strictEqual(opt.instructions.length, 2);
			(goal.children[3] as AST.ASTNodeStatementExpression).lower(opt);
			assert.strictEqual(opt.instructions.length, 2);
			return assert.strictEqual(opt.print(), extract_lines`
				(DROP (GET x))
				(DROP (INT.CONST 42))
			`.join('\n'));
		});
		it('AST.StatementReassignment for variables pushes SET instruction.', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut x: int = 42;
				x = 43;
				x = 44;
				x = -42;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.children.slice(1).forEach((stmt) => (stmt as AST.ASTNodeDeclarationVariable).lower(opt));
			return assert.strictEqual(opt.print(), extract_lines`
				(SET x (INT.CONST 43))
				(SET x (INT.CONST 44))
				(SET x (INT.CONST -42))
			`.join('\n'));
		});
		it('AST.StatementReassignment for collections pushes IR.CollectionDynamicSet.', () => {
			assert.strictEqual(setupScript(`{
				val mut my_list: mut [int]        = [41, 42];
				val mut my_dict: mut [:int]       = [a= 41, b= 42];
				val mut my_set:  mut {int}        = {41 + 1, 42 / 2, 43 ^ 3};
				val mut my_map:  mut {int -> int} = {21 -> 41, 22 -> 42, 23 -> 43};

				val mut accessor: int = 22;
				my_list.[0 + 1]   = 84;
				my_dict.[@b]      = 84;
				my_set.[accessor] = true;
				my_map.[accessor] = 84;
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL LIST my_list (LIST.NEW (INT.CONST 41) (INT.CONST 42)))
				(DECL DICT my_dict (DICT.NEW @a->(INT.CONST 41) @b->(INT.CONST 42)))
				(DECL INT $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
				(DECL INT $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
				(DECL INT $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
				(DECL SET my_set (SET.NEW (GET $0) (GET $1) (GET $2)))
				(DECL MAP my_map (MAP.NEW (INT.CONST 21)->(INT.CONST 41) (INT.CONST 22)->(INT.CONST 42) (INT.CONST 23)->(INT.CONST 43)))
				(DECL INT accessor (INT.CONST 22))
				(DECL INT $3 (INT.ADD (INT.CONST 0) (INT.CONST 1)))
				(LIST.SET (GET my_list) (GET $3) (INT.CONST 84))
				(DICT.SET (GET my_dict) (SYM.CONST @b) (INT.CONST 84))
				(SET.SET (GET my_set) (GET accessor) (BOOL.CONST true))
				(MAP.SET (GET my_map) (GET accessor) (INT.CONST 84))
			`.join('\n'));
		});
		it('AST.Goal lowers each statement.', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut assignee_b?: int;
				val mut assignee_c:  int = 42;
				val     _:           int = assignee_c;
				val     assignee_d:  int = assignee_c;
				val mut assignee_e:  int = assignee_c;

				assignee_b;
				assignee_c;
				assignee_d;
				assignee_e;

				assignee_e = 43;
				assignee_e = 44;
				assignee_e = -42;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
			return assert.strictEqual(opt.instructions.length, 12);
		});
	});



	describe('ASTNodeConstant', () => {
		describe('#varCheck', () => {
			it('never throws.', () => {
				AST.ASTNodeConstant.fromSource('42;').varCheck();
			});
		});


		describe('#type', () => {
			it('returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
				const constants: AST.ASTNodeConstant[] = extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					55  -55  033  -033  0  -0
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					"42😀"  "42\\u{1f600}"
				`).map((src) => AST.ASTNodeConstant.fromSource(`${ src };`));
				return assertEqualTypes(
					constants.map((c) => c.type()),
					constants.map((c) => new TYPE.Unit(c.fold())),
				);
			});
		});


		/* eslint-disable @stylistic/array-element-newline */
		describe('#fold', () => {
			it('computes null, boolean, and symbol values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
				`).map((src) => AST.ASTNodeConstant.fromSource(`${ src };`).fold()), [
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
					new VALUE.Symbol(0x8en,  'then'),
					new VALUE.Symbol(0x85n,  'str'),
					new VALUE.Symbol(0x88n,  'false'),
					new VALUE.Symbol(0x100n, 'foobar'),
				]);
			});
			it('computes int values.', () => {
				const integer_radices_on: CPConfig = {
					...CONFIG_DEFAULT,
					languageFeatures: {
						...CONFIG_DEFAULT.languageFeatures,
						integerRadices: true,
					},
				};
				assert.deepStrictEqual(extract_tokens(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`).map((src) => AST.ASTNodeConstant.fromSource(`${ src };`, integer_radices_on).fold()), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new VALUE.Integer(BigInt(v))));
			});
			it('computes float values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`).map((src) => AST.ASTNodeConstant.fromSource(`${ src };`).fold()), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new VALUE.Float(v)));
			});
			it('computes string values.', () => {
				assertEqualTypes(
					AST.ASTNodeConstant.fromSource('"42😀\\u{1f600}";').type(),
					typeUnit('42😀\u{1f600}'),
				);
			});
		});
		/* eslint-enable @stylistic/array-element-newline */


		specify('#build', () => {
			xjs.Map.forEachAggregated(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
				['null;',    (builder) => buildConst(builder)],
				['false;',   (builder) => buildConst(builder, false)],
				['true;',    (builder) => buildConst(builder, true)],
				['@never;',  (builder) => buildConst(builder, Symbol(0x80))],
				['@hello;',  (builder) => buildConst(builder, Symbol(0x100))],
				['0;',       (builder) => buildConst(builder, 0n)],
				['+0;',      (builder) => buildConst(builder, 0n)],
				['-0;',      (builder) => buildConst(builder, 0n)],
				['42;',      (builder) => buildConst(builder, 42n)],
				['+42;',     (builder) => buildConst(builder, 42n)],
				['-42;',     (builder) => buildConst(builder, -42n)],
				['0.0;',     (builder) => buildConst(builder, 0)],
				['+0.0;',    (builder) => buildConst(builder, 0)],
				['-0.0;',    (builder) => buildConst(builder, -0)],
				['-4.2e-2;', (builder) => buildConst(builder, -0.042)],
			]), (expected_fn, src) => {
				const constant: AST.ASTNodeConstant = AST.ASTNodeConstant.fromSource(src, CONFIG_FOLDING_OFF);
				return assertEqualBins(
					constant.build(),
					expected_fn.call(null, constant.builder),
				);
			});
		});
	});



	describe('ASTNodeVariable', () => {
		describe('#varCheck', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`
					val mut i: int = 42;
					i;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource('i;').varCheck(), ReferenceErrorUndeclared);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					i;
					val mut i: int = 42;
				`).varCheck(), ReferenceErrorDeadZone);
			});
			it('throws if it was declared as a type alias.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type FOO = int;
					42 || FOO;
				`).varCheck(), ReferenceErrorKind);
			});
		});


		describe('#type', () => {
			it('unions with `null` when accessed variable is uninitialized.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut w:  int = 42;
					val mut x?: int;
					w;
					x;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok( (goal.children[0] as AST.ASTNodeDeclarationVariable).assigned);
				assert.ok(!(goal.children[1] as AST.ASTNodeDeclarationVariable).assigned);
				return assertEqualTypes(
					goal.children.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
					[
						TYPE.INT,
						TYPE.INT.union(TYPE.NULL),
					],
				);
			});
		});


		describe('#fold', () => {
			it('assesses the value of a fixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val x: int = 21 * 2;
					x;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok(!(goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					new VALUE.Integer(42n),
				);
			});
			it('returns null for an unfixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int = 21 * 2;
					x;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok((goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			it('returns null for a fixed variable of mutable type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val fixed_mutable: mut {int} = {1, 2, 3};
					fixed_mutable;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok((goal.children[0] as AST.ASTNodeDeclarationVariable).typenode.eval().hasMutable);
				assert.deepStrictEqual(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			it('returns null for an uncomputable fixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int = 21 * 2;
					val y: int = x / 2;
					y;
					val z: mut {int} = {11, 22, 33};
					val w: bool = z.[22];
					w;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok(!(goal.children[1] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.ok(!(goal.children[4] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					[
						(goal.children[2] as AST.ASTNodeStatementExpression).expr!.fold(),
						(goal.children[5] as AST.ASTNodeStatementExpression).expr!.fold(),
					],
					[null, null],
				);
			});
		});


		describe('#build', () => {
			it('with constant folding on, returns `({i32,f64}.const)` for fixed & foldable variables.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val x: int = 42;
					val y: float = 4.2 * 10;
					x;
					y;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				assertEqualBins(
					[
						(goal.children[2] as AST.ASTNodeStatementExpression).expr!.build(),
						(goal.children[3] as AST.ASTNodeStatementExpression).expr!.build(),
					],
					[
						buildConst(goal.builder, 42n),
						buildConst(goal.builder, 42.0),
					],
				);
			});
			it('with constant folding on, returns `(local.get)` for unfixed / non-foldable variables.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int = 42;
					val y: int = x + 10;
					x;
					y;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const var0 = (goal.children[2] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const var1 = (goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const [
					{id: id0, type: type0},
					{id: id1, type: type1},
				] = goal.builder.getLocals();
				assert.deepStrictEqual([var0.id, var1.id], [id0, id1]);
				assertEqualBins(
					[
						var0.build(),
						var1.build(),
					],
					[
						goal.builder.module.local.get(0, type0),
						goal.builder.module.local.get(1, type1),
					],
				);
			});
			it('with constant folding off, always returns `(local.get)`.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val x: int = 42;
					val mut y: float = 4.2;
					x;
					y;
				`, CONFIG_FOLDING_OFF);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const var0 = (goal.children[2] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const var1 = (goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const [
					{id: id0, type: type0},
					{id: id1, type: type1},
				] = goal.builder.getLocals();
				assert.deepStrictEqual([var0.id, var1.id], [id0, id1]);
				assertEqualBins(
					[
						var0.build(),
						var1.build(),
					],
					[
						goal.builder.module.local.get(0, type0),
						goal.builder.module.local.get(1, type1),
					],
				);
			});
		});
	});



	describe('ASTNodeTemplate', () => {
		function initTemplates(config: CPConfig = CONFIG_DEFAULT): AST.ASTNodeTemplate[] {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut x: int = 21;
				"""the answer is {{ x * 2 }} but what is the question?""";
			`, config);
			goal.varCheck();
			goal.typeCheck();
			return [
				AST.ASTNodeTemplate.fromSource('"""42😀""";', config),
				AST.ASTNodeTemplate.fromSource('"""the answer is {{ 7 * 3 * 2 }} but what is the question?""";', config),
				(goal.children[1] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTemplate,
			];
		}
		describe('#type', () => {
			let templates: readonly AST.ASTNodeTemplate[] = [];
			context('with constant folding on.', () => {
				let types: TYPE.Type[] = [];
				before(() => {
					templates = initTemplates();
					types = templates.map((t) => t.type());
				});
				it('for foldable interpolations, returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
					assertEqualTypes(
						types.slice(0, 2),
						templates.slice(0, 2).map((t) => new TYPE.Unit<VALUE.String>(t.fold()!)),
					);
				});
				it('for non-foldable interpolations, returns `String`.', () => {
					assert.strictEqual(types[2], TYPE.STR);
				});
			});
			context('with constant folding off.', () => {
				it('always returns `String`.', () => {
					templates = initTemplates(CONFIG_FOLDING_OFF);
					return templates.forEach((t) => assert.strictEqual(t.type(), TYPE.STR));
				});
			});
		});


		describe('#fold', () => {
			let templates: AST.ASTNodeTemplate[] = [];
			before(() => {
				templates = initTemplates();
			});
			it('returns a constant String for ASTNodeTemplate with no interpolations.', () => {
				assert.deepStrictEqual(
					templates[0].fold(),
					new VALUE.String('42😀'),
				);
			});
			it('returns a constant String for ASTNodeTemplate with foldable interpolations.', () => {
				assert.deepStrictEqual(
					templates[1].fold(),
					new VALUE.String('the answer is 42 but what is the question?'),
				);
			});
			it('returns null for ASTNodeTemplate with dynamic interpolations.', () => {
				assert.deepStrictEqual(
					templates[2].fold(),
					null,
				);
			});
		});
	});



	describe('ASTNodeCollectionLiteral', () => {
		describe('#varCheck', () => {
			describe('ASTNode{{Type}Record,Dict}', () => {
				it('var-checks all keys before all values.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						type T = str;
						type U = (a: bool, b: (z: int), c: T, d: (y: float));
						val f: null = null;
						(e= [x= 42, w= 4.2], f= f);
						[g= (w= 42, x= 4.2), f= f];
					`);
					goal.varCheck();
					goal.typeCheck();
					assert.partialDeepStrictEqual(
						goal.validator.getSymbols(),
						new Map([
							[0x100n, {source: 'T'}],
							[0x107n, {source: 'U'}],
							[0x108n, {source: 'f'}],
						]),
					);
					assertEqualTypes(
						(goal.children[1] as AST.ASTNodeDeclarationType).assigned.eval(),
						TYPE.Record.fromTypes(new Map([
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.Record.fromTypes(new Map([[0x105n, TYPE.INT]]))],
							[0x103n, TYPE.STR],
							[0x104n, TYPE.Record.fromTypes(new Map([[0x106n, TYPE.FLOAT]]))],
						])),
					);
					return assert.deepStrictEqual(goal.children.slice(3, 5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.fold()), [
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
				it('throws if containing duplicate keys.', () => {
					[
						AST.ASTNodeTypeRecord .fromSource('(a: int, b: float, c: str)'),
						AST.ASTNodeRecord     .fromSource('(a= 1, b= 2.0, c= "three");'),
						AST.ASTNodeDict       .fromSource('[a= 1, b= 2.0, c= "three"];'),
					].forEach((node) => node.varCheck()); // assert does not throw

					[
						AST.ASTNodeTypeRecord .fromSource('(a: int, b: float, a: str)'),
						AST.ASTNodeTypeRecord .fromSource('(_: int, b: float, _: str)'),
						AST.ASTNodeRecord     .fromSource('(a= 1, b= 2.0, a= "three");'),
						AST.ASTNodeRecord     .fromSource('(_= 1, b= 2.0, _= "three");'),
						AST.ASTNodeDict       .fromSource('[a= 1, b= 2.0, a= "three"];'),
						AST.ASTNodeDict       .fromSource('[_= 1, b= 2.0, _= "three"];'),
					].forEach((node) => assert.throws(() => node.varCheck(), AssignmentErrorDuplicateKey));

					new Map<AST.ASTNodeCP, string[]>([
						[AST.ASTNodeTypeRecord .fromSource('(c: int, d: float, c: str, d: bool)'),   ['c', 'd']],
						[AST.ASTNodeTypeRecord .fromSource('(e: int, f: float, e: str, e: bool)'),   ['e', 'e']],
						[AST.ASTNodeRecord     .fromSource('(c= 1, d= 2.0, c= "three", d= false);'), ['c', 'd']],
						[AST.ASTNodeRecord     .fromSource('(e= 1, f= 2.0, e= "three", e= false);'), ['e', 'e']],
						[AST.ASTNodeDict       .fromSource('[c= 1, d= 2.0, c= "three", d= false];'), ['c', 'd']],
						[AST.ASTNodeDict       .fromSource('[e= 1, f= 2.0, e= "three", e= false];'), ['e', 'e']],
					]).forEach((dupes, node) => assert.throws(() => node.varCheck(), (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
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


		describe('#type', () => {
			([
				['with constant folding on.',  CONFIG_DEFAULT,     TYPE.Union.all([typeUnit('a'), typeUnit(42n), typeUnit(3.0)])],
				['with constant folding off.', CONFIG_FOLDING_OFF, TYPE.Union.all([typeUnit('a'), TYPE.INT,      TYPE.FLOAT])],
			] as const).forEach(([description, config, map_ant_type]) => it(description, () => {
				const expected: readonly TYPE.Unit[] = [typeUnit(1n), typeUnit(2.0), typeUnit('three')];
				const collections: readonly [
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeSet,
					AST.ASTNodeMap,
				] = [
					AST.ASTNodeTuple  .fromSource('(   1,    2.0,    "three");', config),
					AST.ASTNodeRecord .fromSource('(a= 1, b= 2.0, _= "three");', config),
					AST.ASTNodeSet    .fromSource('{   1,    2.0,    "three"};', config),
					AST.ASTNodeMap.fromSource(`
						{
							"a" || "" -> 1,
							21 + 21   -> 2.0,
							3 * 1.0   -> "three",
						};
					`, config),
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
							map_ant_type,
							TYPE.Union.all(expected),
							true,
						),
					],
				);
			}));
			it('does not throw if value type contains reference type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					(   1,    [2.2],    "three");
					(a= 1, b= [2.2], c= "three");
				`);
				goal.varCheck();
				goal.typeCheck(); // assert does not throw
			});
		});


		describe('#fold', () => {
			it('returns Tuple/Record for constant collections.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple  .fromSource('(   1,    2.0,    "three");'),
						AST.ASTNodeRecord .fromSource('(a= 1, b= 2.0, c= "three");'),
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
			it('returns a constant List/Dict/Set/Map for foldable entries.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeList.fromSource('[1, 2.0, "three"];'),
						AST.ASTNodeDict.fromSource('[a= 1, b= 2.0, c= "three"];'),
						AST.ASTNodeSet.fromSource('{1, 2.0, "three"};'),
						AST.ASTNodeMap.fromSource(`
							{
								"a" || "" -> 1,
								21 + 21   -> 2.0,
								3 * 1.0   -> "three",
							};
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
			it('returns null for non-foldable entries.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
						3 * 1.0   -> z,
					};
				`);
				goal.varCheck();
				goal.typeCheck();
				xjs.Array.forEachAggregated(goal.children.slice(3), (c) => assert.strictEqual((c as AST.ASTNodeStatementExpression).expr!.fold(), null));
			});
		});
	});
});
