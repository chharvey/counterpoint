import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	Builder,
	OP,
	VisitorExprBuild,
} from '../../src/index.ts';
import {
	typeUnit,
	setupScript,
} from '../utils.ts';



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
