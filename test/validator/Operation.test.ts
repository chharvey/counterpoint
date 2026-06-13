import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
} from '../../src/index.ts';
import {
	extract_lines,
	repeat,
	assert_shallowStrictEqual,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../utils.ts';



function typeOperations(tests: ReadonlyMap<string, TYPE.Type>): void {
	return assertEqualTypes(
		[...tests.keys()].map((src) => AST.EXPR.Operation.fromSource(src).type()),
		[...tests.values()],
	);
}
function foldOperations(tests: Map<string, VALUE.Value>): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.EXPR.Operation.fromSource(src).fold()),
		[...tests.values()],
	);
}



test.suite('Operation', () => {
	function typeOfStmtExpr(stmt: AST.STMT.Statement): TYPE.Type {
		assert_instanceof(stmt, AST.STMT.StatementExpression);
		return stmt.expr!.type();
	}



	test.suite('#type', () => {
		test.suite('OperationUnary', () => {
			test.suite('[operator=EMP]', () => {
				test.test('without constant folding: returns type `bool` for anything else.', () => {
					assert_shallowStrictEqual(
						setupScript(`{
							val mut a: null | int   = null;
							val mut b: null | int   = 42;
							val mut c: bool         = false;
							val mut d: bool | float = 4.2;
							val mut f: int          = 42;
							val mut g: float        = 4.2e+1;
							val mut h: sym          = @hello;
							val mut i: anything     = ();
							val mut j: anything     = (42,);
							val mut k: anything     = (a= 42);
							val mut l: anything     = {41 -> 42};
							?a;
							?b;
							?c;
							?d;
							?f;
							?g;
							?h;
							?i;
							?j;
							?k;
							?l;
						}`, {build: false}).stmts.slice(11).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
						repeat(TYPE.BOOL, 11),
					);
				});
			});
		});


		test.suite('OperationBinaryArithmetic', () => {
			test.test('without constant folding: returns Integer/Natural/Float respectively for valid ops.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val mut i1: int   = 7;
						val mut i2: int   = 3;
						val mut i3: int   = 2;
						val mut n1: nat   = +7;
						val mut n2: nat   = +3;
						val mut n3: nat   = +2;
						val mut f1: float = 7.1;
						val mut f2: float = 3.1;
						val mut f3: float = 2.1;

						(i1 + i2) * i3;
						(n1 + n2) * n3;
						f1 * f2 ^ f3;
					}`, {build: false}).stmts.slice(9).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					[TYPE.INT, TYPE.NAT, TYPE.FLOAT],
				);
			});
		});


		test.suite('OperationBinaryComparative', () => {
			test.test('without constant folding: returns `bool` for numeric operands.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val mut i1: int   = 7;
						val mut i2: int   = 3;
						val mut n1: nat   = +7;
						val mut n2: nat   = +3;
						val mut f1: float = 7.1;
						val mut f2: float = 3.1;

						${ ['i1', 'n1', 'f1'].flatMap((left) => ['i2', 'n2', 'f2'].flatMap((right) => ['<', '>', '<=', '>=', '!<', '!>'].map((op) => `${ left } ${ op } ${ right };`))).join('\n') }
					}`).stmts.slice(6).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					repeat(TYPE.BOOL, 3 * 3 * 6),
				);
			});
		});


		test.suite('OperationBinaryEquality', () => {
			test.test('returns `false` for operands of the same primitive unit type, even numeric, but have different values.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					@symb1  === @symb2
					"hello" === "world"
					@symb1  ==  @symb2
					"hello" ==  "world"
				`, (expr) => assert.strictEqual(AST.EXPR.Operation.fromSource(expr).type(), TYPE.FALSE));
			});
			test.test('returns `false` if operands are of disjoint types in general.', () => {
				assert.strictEqual(AST.EXPR.Operation.fromSource('7      == null').type(), TYPE.FALSE);
				assert.strictEqual(AST.EXPR.Operation.fromSource('@symb1 == 256').type(),  TYPE.FALSE);
			});
			test.test('without constant folding: returns `bool` for operands of same numeric type.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val mut i1: int   = 7;
						val mut i2: int   = 3;
						val mut n1: nat   = +7;
						val mut n2: nat   = +3;
						val mut f1: float = 7.1;
						val mut f2: float = 3.1;

						i1 === i2;
						n1 === n2;
						f1 === f2;
						i1 == i2;
						n1 == n2;
						f1 == f2;
					}`).stmts.slice(6).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					repeat(TYPE.BOOL, 6),
				);
			});

			test.suite('[operator=ID]', () => {
				test.test('without constant folding: returns `false` for operands of different numeric types.', () => {
					assert_shallowStrictEqual(
						setupScript(`{
							val mut i1: int   = 7;
							val mut n1: nat   = +7;
							val mut f1: float = 7.1;

							i1 === n1;
							i1 === f1;
							n1 === f1;
						}`).stmts.slice(3).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
						repeat(TYPE.FALSE, 3),
					);
				});
			});

			test.suite('[operator=EQ]', () => {
				test.test('without constant folding: coerces numeric types when mixed, returns `bool`.', () => {
					assert_shallowStrictEqual(
						setupScript(`{
							val mut i1: int   = 7;
							val mut n1: nat   = +7;
							val mut f1: float = 7.1;

							i1 == n1;
							i1 == f1;
							n1 == f1;
						}`).stmts.slice(3).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
						repeat(TYPE.BOOL, 3),
					);
				});
			});
		});
	});



	test.suite('#build', () => {
		test.test('with block-expressions.', () => {
			assert.strictEqual(setupScript(`{
				val mut x: int = 42;
				val mut y: int = 69;
				x + { x; x * y; };
			}`).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> x (INT.CONST 42))
					(DECL <int> y (INT.CONST 69))
					(DROP (GET x))
					(DECL <int> $0 (INT.MUL (GET x) (GET y)))
					(DROP (INT.ADD (GET x) (GET $0)))
					(ENDPROGRAM)
			`.trim());
		});

		test.test('OperationUnary[operator=NOT]', () => {
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
		test.test('OperationUnary[operator=EMP]', () => {
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
		test.test('OperationUnary[operator=NEG]', () => {
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
		test.test('OperationUnary[operator=INT | NAT | FLOAT]', () => {
			assert.strictEqual(setupScript(`{
				val mut my_int: int   = -7;
				val mut my_nat: nat   = +42;
				val mut my_flt: float = -3.5;

				int   my_int;
				int   my_nat;
				int   my_flt;
				nat   my_int;
				nat   my_nat;
				nat   my_flt;
				float my_int;
				float my_nat;
				float my_flt;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> my_int (INT.CONST -7))
					(DECL <nat> my_nat (NAT.CONST +42))
					(DECL <float> my_flt (FLOAT.CONST -3.5))
					(DROP (TOINT (GET my_int)))
					(DROP (TOINT (GET my_nat)))
					(DROP (TOINT (GET my_flt)))
					(DROP (TONAT (GET my_int)))
					(DROP (TONAT (GET my_nat)))
					(DROP (TONAT (GET my_flt)))
					(DROP (TOFLOAT (GET my_int)))
					(DROP (TOFLOAT (GET my_nat)))
					(DROP (TOFLOAT (GET my_flt)))
					(ENDPROGRAM)
			`.trim());
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
						(GOTO.IF (TOBOOL (GET a)) "block-1" "block-2")
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
						(GOTO.IF (TOBOOL (GET $1)) "block-4" "block-5")
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
						(GOTO.IF (TOBOOL (GET c)) "block-1" "block-2")
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
						(GOTO.IF (TOBOOL (GET $2)) "block-4" "block-5")
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
						(GOTO.IF (TOBOOL (GET a)) "block-1" "block-2")
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
						(GOTO.IF (TOBOOL (GET c)) "block-1" "block-2")
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
	});



	test.suite('OperationUnary', () => {
		test.suite('#type', () => {
			test.suite('with constant folding on.', () => {
				test.test('returns a constant Boolean type for boolean unary operation of anything.', () => {
					typeOperations(new Map<string, TYPE.Type>([
						['!null',   TYPE.TRUE],
						['!false',  TYPE.TRUE],
						['!true',   TYPE.FALSE],
						['!@hello', TYPE.FALSE],
						['!42',     TYPE.FALSE],
						['!4.2e+1', TYPE.FALSE],
						['?null',   TYPE.TRUE],
						['?false',  TYPE.TRUE],
						['?true',   TYPE.BOOL],
						['?@hello', TYPE.BOOL],
						['?42',     TYPE.BOOL],
						['?4.2e+1', TYPE.BOOL],

						['!()',         TYPE.FALSE],
						['!(42,)',      TYPE.FALSE],
						['!(a= 42)',    TYPE.FALSE],
						['!{}',         TYPE.FALSE],
						['!{42}',       TYPE.FALSE],
						['!{41 -> 42}', TYPE.FALSE],
						['?()',         TYPE.BOOL],
						['?(42,)',      TYPE.BOOL],
						['?(a= 42)',    TYPE.BOOL],
						['?{}',         TYPE.BOOL],
						['?{42}',       TYPE.BOOL],
						['?{41 -> 42}', TYPE.BOOL],
					]));
				});
				test.test('[operator=NEG] throws for Natural number literals (foldable).', () => {
					assert.throws(() => AST.EXPR.Operation.fromSource('-+42').type(), TypeErrorInvalidOperation);
				});
			});

			test.suite('with constant folding off.', () => {
				test.suite('[operator=NOT]', () => {
					test.test('returns type `true` for a subtype of `null | false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							val mut a: null = null;
							val mut b: null | false = null;
							!a;
							!b;
						}`, {build: false}).stmts.slice(2), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.TRUE));
					});
					test.test('returns type `bool` for a supertype of `T narrows null | false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							val mut a: null | int = null;
							val mut b: null | int = 42;
							val mut c: bool = false;
							val mut d: bool | float = 4.2;
							!a;
							!b;
							!c;
							!d;
						}`, {build: false}).stmts.slice(4), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.BOOL));
					});
					test.test('returns type `false` for any literal type not a supertype of `null` or `false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							val mut a: int = 42;
							val mut b: float = 4.2;
							val mut c: sym = @hello;
							!a;
							!b;
							!c;
						}`, {build: false}).stmts.slice(3), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.FALSE));
					});
					test.test('returns type `false` for any literal collection type not a supertype of `null` or `false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							!();
							!(42,);
							!(a= 42);
							!{41 -> 42};
						}`, {build: false}).stmts, (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.FALSE));
					});
				});
				test.suite('[operator=EMP]', () => {
					test.test('returns type `true` for a subtype of `null | false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							val mut a: null = null;
							val mut b: null | false = null;
							?a;
							?b;
						}`, {build: false}).stmts.slice(2), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.TRUE));
					});
				});
				test.test('[operator=NEG] throws for `nat` type.', () => {
					const {stmts} = setupScript(`{
						val mut n: nat = +42;
						-n;
					}`, {typeCheck: false});
					stmts[0].typeCheck(); // assert does not throw
					assert.throws(() => ((stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.OperationUnary).type(), TypeErrorInvalidOperation);
				});
			});
			test.suite('[operator=INT | NAT | FLOAT]', () => {
				test.test('returns the respective type for numeric operands.', () => {
					assert.deepStrictEqual(setupScript(`{
						val mut my_int: int   = 7;
						val mut my_nat: nat   = +42;
						val mut my_flt: float = -3.5;

						int   my_int;
						int   my_nat;
						int   my_flt;
						nat   my_int;
						nat   my_nat;
						nat   my_flt;
						float my_int;
						float my_nat;
						float my_flt;
					}`, {build: false}).stmts.slice(3).map((stmt) => typeOfStmtExpr(stmt)), [
						TYPE.INT,
						TYPE.INT,
						TYPE.INT,
						TYPE.NAT,
						TYPE.NAT,
						TYPE.NAT,
						TYPE.FLOAT,
						TYPE.FLOAT,
						TYPE.FLOAT,
					]);
				});
				test.test('throws for non-numeric operands.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						int   null
						int   @symb
						int   "string"
						int   ["string tuple"]
						int   [record= "string"]
						nat   null
						nat   @symb
						nat   "string"
						nat   ["string tuple"]
						nat   [record= "string"]
						float null
						float @symb
						float "string"
						float ["string tuple"]
						float [record= "string"]
					`, (src) => assert.throws(() => AST.EXPR.OperationUnary.fromSource(src).type(), TypeErrorInvalidOperation));
				});
			});
		});


		test.suite('#fold', () => {
			test.test('[operator=NOT]', () => {
				foldOperations(new Map([
					['!false',      VALUE.TRUE],
					['!true',       VALUE.FALSE],
					['!null',       VALUE.TRUE],
					['!0',          VALUE.FALSE],
					['!42',         VALUE.FALSE],
					['!0.0',        VALUE.FALSE],
					['!-0.0',       VALUE.FALSE],
					['!4.2e+1',     VALUE.FALSE],
					['!""',         VALUE.FALSE],
					['!"hello"',    VALUE.FALSE],
					['!()',         VALUE.FALSE],
					['!(42,)',      VALUE.FALSE],
					['!(a= 42)',    VALUE.FALSE],
					['![]',         VALUE.FALSE],
					['![42]',       VALUE.FALSE],
					['![a= 42]',    VALUE.FALSE],
					['!{}',         VALUE.FALSE],
					['!{42}',       VALUE.FALSE],
					['!{41 -> 42}', VALUE.FALSE],
				]));
			});
			test.test('[operator=EMP]', () => {
				foldOperations(new Map([
					['?false',      VALUE.TRUE],
					['?true',       VALUE.FALSE],
					['?null',       VALUE.TRUE],
					['?0',          VALUE.TRUE],
					['?42',         VALUE.FALSE],
					['?0.0',        VALUE.TRUE],
					['?-0.0',       VALUE.TRUE],
					['?4.2e+1',     VALUE.FALSE],
					['?""',         VALUE.TRUE],
					['?"hello"',    VALUE.FALSE],
					['?()',         VALUE.TRUE],
					['?(42,)',      VALUE.FALSE],
					['?(a= 42)',    VALUE.FALSE],
					['?[]',         VALUE.TRUE],
					['?[42]',       VALUE.FALSE],
					['?[a= 42]',    VALUE.FALSE],
					['?{}',         VALUE.TRUE],
					['?{42}',       VALUE.FALSE],
					['?{41 -> 42}', VALUE.FALSE],
				]));
			});
			test.test('[operator=INT | NAT | FLOAT]: returns a numeric conversion only if needed.', () => {
				const exprs: readonly AST.EXPR.OperationUnary[] = setupScript(`{
					val my_int: int   = -7;
					val my_nat: nat   = +42;
					val my_flt: float = -3.5;

					int   my_int;
					int   my_nat;
					int   my_flt;
					nat   my_int;
					nat   my_nat;
					nat   my_flt;
					float my_int;
					float my_nat;
					float my_flt;
				}`, {build: false}).stmts.slice(3).map((stmt) => (stmt as AST.STMT.StatementExpression).expr as AST.EXPR.OperationUnary);
				const values:   readonly (VALUE.Value | null)[] = exprs.map((expr) => expr.fold());
				const operands: readonly (VALUE.Value | null)[] = exprs.map((expr) => expr.operand.fold());
				assert.strictEqual(values[0], operands[0]);
				assert.strictEqual(values[4], operands[4]);
				assert.strictEqual(values[8], operands[8]);
				return assert.deepStrictEqual(values, [
					new VALUE.Integer(-7n),
					new VALUE.Integer(42n),
					new VALUE.Integer(-3n),
					new VALUE.Natural(-7n),
					new VALUE.Natural(42n),
					new VALUE.Natural(0n),
					new VALUE.Float(-7.0),
					new VALUE.Float(42.0),
					new VALUE.Float(-3.5),
				]);
			});
		});
	});



	test.suite('OperationBinaryArithmetic', () => {
		test.suite('#type', () => {
			test.test('returns the respective type.', () => {
				typeOperations(new Map<string, TYPE.Type>([
					['7 * 3 * 2',       TYPE.INT],
					['+7 * +3 * +2',    TYPE.NAT],
					['7.1 * 3.1 * 2.1', TYPE.FLOAT],
				]));
			});
			test.test('throws for any operation of mix of numeric types.', () => {
				assert.throws(() => AST.EXPR.OperationBinaryArithmetic.fromSource('+3 * 2')      .type(), TypeErrorInvalidOperation);
				assert.throws(() => AST.EXPR.OperationBinaryArithmetic.fromSource('+3 * 2.7')    .type(), TypeErrorInvalidOperation);
				assert.throws(() => AST.EXPR.OperationBinaryArithmetic.fromSource('3 * 2.7')     .type(), TypeErrorInvalidOperation);
				assert.throws(() => AST.EXPR.OperationBinaryArithmetic.fromSource('7 * 3.0 * 2') .type(), TypeErrorInvalidOperation);
			});
			test.test('throws for arithmetic operation of non-numbers.', () => {
				[
					'null + 5',
					'5 * null',
					'false - 2',
					'2 / true',
					'null ^ false',
					'"hello" + 5',
				].forEach((src) => {
					assert.throws(() => AST.EXPR.OperationBinaryArithmetic.fromSource(src).type(), TypeErrorInvalidOperation);
				});
			});
		});


		test.suite('#fold', () => {
			test.test('computes the value of an integer operation of constants.', () => {
				foldOperations(new Map<string, VALUE.Value>([
					['42 + 420',        new VALUE.Integer(42n + 420n)],
					['42 - 420',        new VALUE.Integer(42n + -420n)],
					[' 126 /  3',       new VALUE.Integer( 126n /  3n)],
					['-126 /  3',       new VALUE.Integer(-126n /  3n)],
					[' 126 / -3',       new VALUE.Integer( 126n / -3n)],
					['-126 / -3',       new VALUE.Integer(-126n / -3n)],
					[' 200 /  3',       new VALUE.Integer( 200n /  3n)],
					[' 200 / -3',       new VALUE.Integer( 200n / -3n)],
					['-200 /  3',       new VALUE.Integer(-200n /  3n)],
					['-200 / -3',       new VALUE.Integer(-200n / -3n)],
					['-(5) ^ +(2 * 3)', new VALUE.Integer((-5n) ** (2n * 3n))],
					['+5 ^ (+2 * +3)',  new VALUE.Natural(5n ** (2n * 3n))],
				]));
			});
			test.test('overflows integers properly.', () => {
				assert.deepStrictEqual([
					'2 ^ 63 + 2 ^ 62',
					'-(2 ^ 62) - 2 ^ 63',
					'42 ^ 2 * 420',
				].map((src) => AST.EXPR.OperationBinaryArithmetic.fromSource(src).fold()), [
					new VALUE.Integer(-(2n ** 62n)),
					new VALUE.Integer(2n ** 62n),
					new VALUE.Integer((42n ** 2n * 420n) % (2n ** 64n)),
				]);
			});
			test.test('overflows naturals properly.', () => {
				assert.deepStrictEqual(
					AST.EXPR.OperationBinaryArithmetic.fromSource('+2 ^ +63  +  +2 ^ +62  +  +2 ^ +63').fold(),
					new VALUE.Natural(2n ** 63n + 2n ** 62n + 2n ** 63n),
				);
			});
			test.test('does not underflow naturals.', () => {
				assert.deepStrictEqual(AST.EXPR.OperationBinaryArithmetic.fromSource('+5 - +9').fold(), VALUE.NAT_0);
			});
			test.test('computes the value of a float operation of constants.', () => {
				foldOperations(new Map<string, VALUE.Value>([
					['3.0e1 - 201.0e-1', new VALUE.Float(30 - 20.1)],
					['3.0 * 2.1',        new VALUE.Float(3.0 * 2.1)],
				]));
			});
			test.test('short-circuits when multiplicand is zero.', () => {
				const {stmts} = setupScript(`{
					val mut i: int   = 42;
					val mut f: float = 4.2;

					0 * i;    % value \`0\`
					0.0 * f;  % value \`0.0\`
					-0.0 * f; % value \`-0.0\`

					1 * i;    % non-foldable value
					1.0 * f;  % non-foldable value
					-1.0 * f; % non-foldable value
				}`);
				const exprs:     readonly AST.EXPR.Expression[]  = stmts.slice(2).map((stmt) => ((stmt as AST.STMT.StatementExpression).expr!));
				const expecteds: readonly (VALUE.Value | null)[] = exprs.slice(0, 3).map((op) => (op as AST.EXPR.OperationBinaryArithmetic).operand0.fold());
				assert.deepStrictEqual(
					exprs.map((op) => op.fold()),
					[...expecteds, null, null, null],
				);
				return assert.deepStrictEqual(
					expecteds,
					[VALUE.INT_0, VALUE.FLOAT_0, VALUE.FLOAT_N0],
				);
			});
			test.test('throws when performing an operation that does not yield a valid number.', () => {
				assert.throws(() => AST.EXPR.OperationBinaryArithmetic.fromSource('42 / 0')     .fold(), NanErrorDivZero);
				assert.throws(() => AST.EXPR.OperationBinaryArithmetic.fromSource('-4.0 ^ -0.5').fold(), NanErrorInvalid);
			});
		});
	});



	test.suite('OperationBinaryComparative', () => {
		test.test.todo('OperationUnary[operator=IS]', () => {
			assert.ok('TODO:');
		});
		test.suite('#type', () => {
			test.test('with folding on, returns a constant value.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					2   <  3
					2   >  3
					2   <= 3
					2   >= 3
					2   !< 3
					2   !> 3
					2.0 <  3
					2.0 >  3
					2.0 <= 3
					2.0 >= 3
					2.0 !< 3
					2.0 !> 3
					2   <  3.0
					2   >  3.0
					2   <= 3.0
					2   >= 3.0
					2   !< 3.0
					2   !> 3.0
				`, (src) => assert.strictEqual(AST.EXPR.Operation.fromSource(src).type(), TYPE.BOOL));
			});
			test.test('throws for comparative operation of non-numbers.', () => {
				assert.throws(() => AST.EXPR.OperationBinaryComparative.fromSource('7.0 <= null').type(), TypeErrorInvalidOperation);
			});
		});


		test.test('#fold', () => {
			foldOperations(new Map([
				['3   <  3',   VALUE.FALSE],
				['3   >  3',   VALUE.FALSE],
				['3   <= 3',   VALUE.TRUE],
				['3   >= 3',   VALUE.TRUE],
				['+3  <  +3',  VALUE.FALSE],
				['+3  >  +3',  VALUE.FALSE],
				['+3  <= +3',  VALUE.TRUE],
				['+3  >= +3',  VALUE.TRUE],
				['5.2 <  7.0', VALUE.TRUE],
				['5.2 >  7.0', VALUE.FALSE],
				['5.2 <= 7.0', VALUE.TRUE],
				['5.2 >= 7.0', VALUE.FALSE],
				['5   <  +9',  VALUE.TRUE],
				['5   >  +9',  VALUE.FALSE],
				['5   <= +9',  VALUE.TRUE],
				['5   >= +9',  VALUE.FALSE],
				['+5  <  9',   VALUE.TRUE],
				['+5  >  9',   VALUE.FALSE],
				['+5  <= 9',   VALUE.TRUE],
				['+5  >= 9',   VALUE.FALSE],
				['5.2 <  9',   VALUE.TRUE],
				['5.2 >  9',   VALUE.FALSE],
				['5.2 <= 9',   VALUE.TRUE],
				['5.2 >= 9',   VALUE.FALSE],
				['5   <  9.2', VALUE.TRUE],
				['5   >  9.2', VALUE.FALSE],
				['5   <= 9.2', VALUE.TRUE],
				['5   >= 9.2', VALUE.FALSE],
				['5.2 <  +9',  VALUE.TRUE],
				['5.2 >  +9',  VALUE.FALSE],
				['5.2 <= +9',  VALUE.TRUE],
				['5.2 >= +9',  VALUE.FALSE],
				['+5  <  9.2', VALUE.TRUE],
				['+5  >  9.2', VALUE.FALSE],
				['+5  <= 9.2', VALUE.TRUE],
				['+5  >= 9.2', VALUE.FALSE],
				['+3  <  3',   VALUE.FALSE],
				['+3  >  3',   VALUE.FALSE],
				['+3  <= 3',   VALUE.TRUE],
				['+3  >= 3',   VALUE.TRUE],
				['3   <  +3',  VALUE.FALSE],
				['3   >  +3',  VALUE.FALSE],
				['3   <= +3',  VALUE.TRUE],
				['3   >= +3',  VALUE.TRUE],
				['3.0 <  +3',  VALUE.FALSE],
				['3.0 >  +3',  VALUE.FALSE],
				['3.0 <= +3',  VALUE.TRUE],
				['3.0 >= +3',  VALUE.TRUE],
				['+3  <  3.0', VALUE.FALSE],
				['+3  >  3.0', VALUE.FALSE],
				['+3  <= 3.0', VALUE.TRUE],
				['+3  >= 3.0', VALUE.TRUE],
				['3.0 <  3',   VALUE.FALSE],
				['3.0 >  3',   VALUE.FALSE],
				['3.0 <= 3',   VALUE.TRUE],
				['3.0 >= 3',   VALUE.TRUE],
				['3   <  3.0', VALUE.FALSE],
				['3   >  3.0', VALUE.FALSE],
				['3   <= 3.0', VALUE.TRUE],
				['3   >= 3.0', VALUE.TRUE],

				['-2 > (+2 ^ +64 - +3)', VALUE.TRUE],
			]));
		});
	});



	test.suite('OperationBinaryEquality', () => {
		test.suite('#type', () => {
			test.suite('with folding on.', () => {
				test.test('for numeric literals.', () => {
					typeOperations(new Map<string, TYPE.Type>([
						['0   === -0',   TYPE.BOOL],
						['0.0 === -0.0', TYPE.FALSE],
						['0   === 0.0',  TYPE.FALSE],
						['0   === -0.0', TYPE.FALSE],
						['-0  === 0.0',  TYPE.FALSE],
						['-0  === -0.0', TYPE.FALSE],
						['3   === 3.0',  TYPE.FALSE],

						['0   == -0',   TYPE.BOOL],
						['0.0 == -0.0', TYPE.BOOL],
						['0   == 0.0',  TYPE.BOOL],
						['0   == -0.0', TYPE.BOOL],
						['-0  == 0.0',  TYPE.BOOL],
						['-0  == -0.0', TYPE.BOOL],
						['3   == 3.0',  TYPE.BOOL],
					]));
				});
				test.test('returns type `bool`.', () => {
					setupScript(`{
						val a: anything = ();
						val b: anything = (42,);
						val c: anything = (x= 42);
						val d: Object   = {41 -> 42};
						a !== ();
						b !== (42,);
						c !== (x= 42);
						d !== {41 -> 42};
						a === a;
						b === b;
						c === c;
						d === d;
						a == ();
						b == (42,);
						c == (x= 42);
						d == {41 -> 42};
						b != (42, 43);
						c != (x= 43);
						c != (y= 42);
						d != {41 -> 43};
						d != {43 -> 42};
					}`, {build: false}).stmts.slice(4).forEach((stmt) => assert.strictEqual(
						((stmt as AST.STMT.StatementExpression).expr as AST.EXPR.OperationBinaryEquality).type(),
						TYPE.BOOL,
					));
				});
			});
		});


		test.suite('#fold', () => {
			test.test('simple non-numeric types.', () => {
				foldOperations(new Map([
					['null === null',                          VALUE.TRUE],
					['null ==  null',                          VALUE.TRUE],
					['null === 5',                             VALUE.FALSE],
					['null ==  5',                             VALUE.FALSE],
					['true === 1',                             VALUE.FALSE],
					['true ==  1',                             VALUE.FALSE],
					['true === 1.0',                           VALUE.FALSE],
					['true ==  1.0',                           VALUE.FALSE],
					['true === 5.1',                           VALUE.FALSE],
					['true ==  5.1',                           VALUE.FALSE],
					['true === true',                          VALUE.TRUE],
					['true ==  true',                          VALUE.TRUE],
					['@a === @a',                              VALUE.TRUE],
					['@a ==  @a',                              VALUE.TRUE],
					['@a === @b',                              VALUE.FALSE],
					['@a ==  @b',                              VALUE.FALSE],
					['@a === 256',                             VALUE.FALSE], // TODO: use \x100
					['@a ==  256',                             VALUE.FALSE], // TODO: use \x100
					['@a === @\'a\'',                          VALUE.FALSE],
					['@a ==  @\'a\'',                          VALUE.FALSE],
					['@\'a\' === @\'\\u{61}\'',                VALUE.FALSE],
					['@\'a\' ==  @\'\\u{61}\'',                VALUE.FALSE],
					['@\'\\u{61}\' === @\'\\u{61}\'',          VALUE.TRUE],
					['@\'\\u{61}\' ==  @\'\\u{61}\'',          VALUE.TRUE],
					['"" == ""',                               VALUE.TRUE],
					['"a" === "a"',                            VALUE.TRUE],
					['"a" ==  "a"',                            VALUE.TRUE],
					['"hello\\u{20}world" === "hello world"',  VALUE.TRUE],
					['"hello\\u{20}world" ==  "hello world"',  VALUE.TRUE],
					['"a" !== "b"',                            VALUE.TRUE],
					['"a" !=  "b"',                            VALUE.TRUE],
					['"hello\\u{20}world" !== "hello20world"', VALUE.TRUE],
					['"hello\\u{20}world" !=  "hello20world"', VALUE.TRUE],
				]));
			});
			test.suite('numeric types.', () => {
				test.test('for identity (`===`), always returns `false` for distinct values.', () => {
					foldOperations(new Map<string, VALUE.Value>([
						['0   === -0',   VALUE.TRUE],
						['0.0 === -0.0', VALUE.FALSE],
						['0   === 0.0',  VALUE.FALSE],
						['0   === -0.0', VALUE.FALSE],
						['-0  === 0.0',  VALUE.FALSE],
						['-0  === -0.0', VALUE.FALSE],
						['3   === 3.0',  VALUE.FALSE],
					]));
				});
				test.test('for equality (`==`), only returns `true` for mathematically equal values (coerces ints to floats when mixed).', () => {
					foldOperations(new Map<string, VALUE.Value>([
						['0   == -0',   VALUE.TRUE],
						['0.0 == -0.0', VALUE.TRUE],
						['0   == 0.0',  VALUE.TRUE],
						['0   == -0.0', VALUE.TRUE],
						['-0  == 0.0',  VALUE.TRUE],
						['-0  == -0.0', VALUE.TRUE],
						['3   == 3.0',  VALUE.TRUE],
					]));
				});
			});
			test.test('compound types.', () => {
				setupScript(`{
					val a: anything = ();
					val b: anything = (42,);
					val c: anything = (x= 42);
					val d: Object   = [];
					val e: Object   = [42];
					val f: Object   = [x= 42];
					val g: Object   = {};
					val h: Object   = {42};
					val i: Object   = {41 -> 42};

					val bb: anything = ((42,),);
					val cc: anything = (x= (42,));
					val hh: Object   = {(42,)};
					val ii: Object   = {(41,) -> (42,)};

					a === ();
					b === (42,);
					c === (x= 42);
					d !== [];
					e !== [42];
					f !== [x= 42];
					g !== {};
					h !== {42};
					i !== {41 -> 42};
					a === a;
					b === b;
					c === c;
					d === d;
					e === e;
					f === f;
					g === g;
					h === h;
					i === i;
					a == ();
					b == (42,);
					c == (x= 42);
					d == [];
					e == [42];
					f == [x= 42];
					g == {};
					h == {42};
					i == {41 -> 42};

					bb === ((42,),);
					cc === (x= (42,));
					hh !== {(42,)};
					ii !== {(41,) -> (42,)};
					bb === bb;
					cc === cc;
					hh === hh;
					ii === ii;
					bb == ((42,),);
					cc == (x= (42,));
					hh == {(42,)};
					ii == {(41,) -> (42,)};

					b != (42, 43);
					c != (x= 43);
					c != (y= 42);
					i != {41 -> 43};
					i != {43 -> 42};
				}`, {build: false}).stmts.slice(13).forEach((stmt) => {
					assert.strictEqual((stmt as AST.STMT.StatementExpression).expr!.fold(), VALUE.TRUE, stmt.source);
				});
			});
			test.test('compound value types’ constituents are compared using same operand.', () => {
				foldOperations(new Map([
					['(   42.0,)  === (   42,)',   VALUE.FALSE],
					['(   42.0,)  ==  (   42,)',   VALUE.TRUE],
					['(a= 42.0)   === (a= 42)',    VALUE.FALSE],
					['(a= 42.0)   ==  (a= 42)',    VALUE.TRUE],
					['(    0.0,)  === (   -0.0,)', VALUE.FALSE],
					['(    0.0,)  ==  (   -0.0,)', VALUE.TRUE],
					['(a=  0.0)   === (a= -0.0)',  VALUE.FALSE],
					['(a=  0.0)   ==  (a= -0.0)',  VALUE.TRUE],
				]));
			});
		});
	});



	test.suite('OperationBinaryLogical', () => {
		test.suite('#type', () => {
			test.test('with constant folding on.', () => {
				typeOperations(new Map<string, TYPE.Type>([
					['null     && false',    TYPE.NULL],
					['false    && null',     TYPE.FALSE],
					['true     && null',     TYPE.NULL],
					['@nothing && @x',       new TYPE.Unit(new VALUE.Symbol(0x100n, 'x'))],
					['@x       && @nothing', TYPE.SYM_NOTHING],
					['@nothing || @y',       TYPE.SYM_NOTHING],
					['@y       || @nothing', new TYPE.Unit(new VALUE.Symbol(0x100n, 'y'))],
					['@z       && false',    TYPE.FALSE],
					['true     && @z',       new TYPE.Unit(new VALUE.Symbol(0x100n, 'z'))],
					['false    && 42',       TYPE.FALSE],
					['4.2      && true',     TYPE.TRUE],
					['null     || false',    TYPE.FALSE],
					['false    || null',     TYPE.NULL],
					['true     || null',     TYPE.TRUE],
					['false    || 42',       new TYPE.Unit(new VALUE.Integer(42n))],
					['4.2      || true',     new TYPE.Unit(new VALUE.Float(4.2))],
				]));
			});
			test.suite('with constant folding off.', () => {
				test.suite('[operator=AND]', () => {
					test.test('returns `left` if it’s a subtype of `null | false`.', () => {
						assertEqualTypes(setupScript(`{
							val mut a: null = null;
							val mut b: null | false = null;
							a && 42;
							b && 42;
						}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL,
							TYPE.NULL.union(TYPE.FALSE),
						]);
					});
					test.test('returns `T | right` if left is a supertype of `T narrows null | false`.', () => {
						const hello: TYPE.Unit<VALUE.String> = typeUnit('hello');
						return assertEqualTypes(setupScript(`{
							val mut a: null | int = null;
							val mut b: null | int = 42;
							val mut c: bool = false;
							val mut d: bool | float = 4.2;
							a && "hello";
							b && "hello";
							c && "hello";
							d && "hello";
						}`, {build: false}).stmts.slice(4).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL.union(hello),
							TYPE.NULL.union(hello),
							TYPE.FALSE.union(hello),
							TYPE.FALSE.union(hello),
						]);
					});
					test.test('returns `right` if left does not contain `null` nor `false`.', () => {
						assertEqualTypes(setupScript(`{
							val mut a: int = 42;
							val mut b: float = 4.2;
							a && true;
							b && null;
						}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.TRUE,
							TYPE.NULL,
						]);
					});
				});
				test.suite('[operator=OR]', () => {
					test.test('returns `right` if left is a subtype of `null | false`.', () => {
						assertEqualTypes(setupScript(`{
							val mut a: null = null;
							val mut b: null | false = null;
							a || false;
							b || 42;
						}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.FALSE,
							typeUnit(42n),
						]);
					});
					test.test('returns `(left - T) | right` if left is a supertype of `T narrows null | false`.', () => {
						const hello: TYPE.Unit<VALUE.String> = typeUnit('hello');
						assertEqualTypes(setupScript(`{
							val mut a: null | int = null;
							val mut b: null | int = 42;
							val mut c: bool = false;
							val mut d: bool | float = 4.2;
							a || "hello";
							b || "hello";
							c || "hello";
							d || "hello";
						}`, {build: false}).stmts.slice(4).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.INT.union(hello),
							TYPE.INT.union(hello),
							TYPE.TRUE.union(hello),
							TYPE.TRUE.union(TYPE.FLOAT).union(hello),
						]);
					});
					test.test('returns `left` if it does not contain `null` nor `false`.', () => {
						assertEqualTypes(setupScript(`{
							val mut a: int = 42;
							val mut b: float = 4.2;
							a || true;
							b || null;
						}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.INT,
							TYPE.FLOAT,
						]);
					});
				});
			});
		});


		test.test('#fold', () => {
			foldOperations(new Map<string, VALUE.Value>([
				['@nothing && @x',       new VALUE.Symbol(0x100n, 'x')],
				['@x       && @nothing', VALUE.SYM_NOTHING],
				['@nothing || @y',       VALUE.SYM_NOTHING],
				['@y       || @nothing', new VALUE.Symbol(0x100n, 'y')],
				['@z       && false',    VALUE.FALSE],
				['true     && @z',       new VALUE.Symbol(0x100n, 'z')],
				['null     && 5',        VALUE.NULL],
				['null     || 5',        new VALUE.Integer(5n)],
				['5        && null',     VALUE.NULL],
				['5        || null',     new VALUE.Integer(5n)],
				['5.1      && true',     VALUE.TRUE],
				['5.1      || true',     new VALUE.Float(5.1)],
				['3.1      && 5',        new VALUE.Integer(5n)],
				['3.1      || 5',        new VALUE.Float(3.1)],
				['false    && null',     VALUE.FALSE],
				['false    || null',     VALUE.NULL],
			]));
		});
	});



	test.suite('OperationTernary', () => {
		test.suite('#type', () => {
			test.suite('with constant folding on.', () => {
				test.test('computes type for for conditionals.', () => {
					typeOperations(new Map<string, TYPE.Type>([
						['if true then false else 2',          TYPE.FALSE],
						['if false then 3.0 else null',        TYPE.NULL],
						['if true then 2 else 3.0',            new TYPE.Unit(new VALUE.Integer(2n))],
						['if false then 2 + 3 else 1.0 * 2.0', TYPE.FLOAT],
					]));
				});
			});
			test.test('returns `nothing` when condition is `nothing`.', () => {
				const ternary: AST.EXPR.OperationTernary = AST.EXPR.OperationTernary.fromSource('if n as <nothing> then true else false');
				ternary.validator.addSymbol(new SymbolSchemaVar((ternary.operand0 as AST.EXPR.Claim).operand as AST.EXPR.Variable, false, false));
				return assert.ok(ternary.type().isBottomType);
			});
			test.test('throws when condition is not a subtype of `boolean`.', () => {
				assert.throws(() => AST.EXPR.OperationTernary.fromSource('if 2 then true else false').type(), TypeErrorInvalidOperation);
			});
		});


		test.test('#fold', () => {
			foldOperations(new Map<string, VALUE.Value>([
				['if true then false else 2',          VALUE.FALSE],
				['if false then 3.0 else null',        VALUE.NULL],
				['if true then 2 else 3.0',            new VALUE.Integer(2n)],
				['if false then 2 + 3 else 1.0 * 2.0', new VALUE.Float(2.0)],
			]));
		});
	});
});
