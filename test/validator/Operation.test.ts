import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	INTRINSICS,
	Validator,
	AST,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
} from '../../src/index.ts';
import {
	extract_lines,
	repeat,
	assert_shallowStrictEqual,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../utils.ts';



test.suite('Operation', () => {
	const VISITOR = new AST.ExprVisitorType();

	function typeOperations(tests: ReadonlyMap<string, TYPE.Type>): void {
		return assertEqualTypes(
			[...tests.keys()].map((src) => VISITOR.visit(AST.EXPR.Operation.fromSource(src))),
			[...tests.values()],
		);
	}

	function typeOfStmtExpr(stmt: AST.STMT.Statement): TYPE.Type | null {
		assert_instanceof(stmt, AST.STMT.StatementExpression);
		return VISITOR.visit(stmt.expr!);
	}



	test.suite('#type', () => {
		test.suite('OperationUnary', () => {
			test.test('[operator=UN_MAYBE]', () => {
				assertEqualTypes(setupScript(`{
					val mut x?: int;
					val mut y?: nat;
					val mut z?: float;
					set y = +42;
					set z = 4.2;
					delete y;
					x;
					y;
					z;
					x~?;
					y~?;
					z~?;
				}`, {build: false}).stmts.slice(6).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)!), [
					new TYPE.Maybe(TYPE.INT),
					new TYPE.Maybe(TYPE.NAT),
					new TYPE.Maybe(TYPE.FLOAT),
					TYPE.INT,
					TYPE.NAT,
					TYPE.FLOAT,
				]);
			});

			test.test('[operator=UN_RESULT]', () => {
				assertEqualTypes(setupScript(`{
					val x: int! = Fail.<int>(Exception.("42"));
					val y: Result.<nat> = Ok.<nat>(+42);
					val z: Result.<float, Exception> = Ok.<float>(4.2);
					x;
					y;
					z;
					x~!;
					y~!;
					z~!;
				}`, {build: false}).stmts.slice(3).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)!), [
					new TYPE.Result(TYPE.INT),
					new TYPE.Result(TYPE.NAT),
					new TYPE.Result(TYPE.FLOAT, TYPE.EXCP),
					TYPE.INT,
					TYPE.NAT,
					TYPE.FLOAT,
				]);
			});

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
						}`, {build: false}).stmts.slice(11).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						repeat(TYPE.BOOL, 11),
					);
				});
			});
		});


		test.suite('OperationBinaryCast', () => {
			test.test('[operator=IS] always returns `bool`.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val n: null = null;
						${INTRINSICS.map((t) => `n is ${t};`).join('\n')}
					}`, {build: false}).stmts.slice(1).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					repeat(TYPE.BOOL, 20),
				);
			});

			test.suite('[operator=CAST]', () => {
				test.test('returns the referenced type.', () => {
					assertEqualTypes(
						setupScript(`{
							val n: anything = null;
							${INTRINSICS.map((t) => `n as ${t};`).join('\n')}
						}`, {build: false}).stmts.slice(1).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						[
							TYPE.NULL,
							TYPE.BOOL,
							TYPE.SYM,
							TYPE.INT,
							TYPE.NAT,
							TYPE.FLOAT,
							TYPE.STR,
							TYPE.OBJ,
							new TYPE.List(TYPE.ANYTHING),
							new TYPE.Dict(TYPE.ANYTHING),
							new TYPE.Set(TYPE.ANYTHING),
							new TYPE.Map(TYPE.ANYTHING, TYPE.ANYTHING),
							TYPE.EXCP,
							new TYPE.Maybe(TYPE.ANYTHING),
							new TYPE.None(TYPE.ANYTHING),
							new TYPE.Some(TYPE.ANYTHING),
							new TYPE.Result(TYPE.ANYTHING),
							new TYPE.Fail(TYPE.ANYTHING),
							new TYPE.Ok(TYPE.ANYTHING),
							new TYPE.Function(undefined, undefined, TYPE.ANYTHING),
						],
					);
				});
				test.test('throws when the assigned type is not equal or narrower.', () => {
					const {stmts, visitors} = setupScript(`{
						val n: int = 42;
						n as Float;
					}`, {typeCheck: false});
					visitors.typeCheck.visit(stmts[0]);
					return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorNotNarrow);
				});
			});

			test.suite('[operator=MAYBE]', () => {
				test.test('returns the referenced type, wrapped in a Maybe.', () => {
					assertEqualTypes(
						setupScript(`{
							val n: anything = null;
							${INTRINSICS.map((t) => `n as? ${t};`).join('\n')}
						}`, {build: false}).stmts.slice(1).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						[
							new TYPE.Maybe(TYPE.NULL),
							new TYPE.Maybe(TYPE.BOOL),
							new TYPE.Maybe(TYPE.SYM),
							new TYPE.Maybe(TYPE.INT),
							new TYPE.Maybe(TYPE.NAT),
							new TYPE.Maybe(TYPE.FLOAT),
							new TYPE.Maybe(TYPE.STR),
							new TYPE.Maybe(TYPE.OBJ),
							new TYPE.Maybe(new TYPE.List(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Dict(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Set(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Map(TYPE.ANYTHING, TYPE.ANYTHING)),
							new TYPE.Maybe(TYPE.EXCP),
							new TYPE.Maybe(new TYPE.Maybe(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.None(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Some(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Result(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Fail(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Ok(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Function(undefined, undefined, TYPE.ANYTHING)),
						],
					);
				});
				test.test('throws when the assigned type is not equal or narrower.', () => {
					const {stmts, visitors} = setupScript(`{
						val n: int = 42;
						n as? Float;
					}`, {typeCheck: false});
					visitors.typeCheck.visit(stmts[0]);
					return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorNotNarrow);
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
					}`, {build: false}).stmts.slice(9).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					[TYPE.INT, TYPE.NAT, TYPE.FLOAT],
				);
			});
		});


		test.suite('OperationBinaryComparative', () => {
			test.test('returns `bool` for numeric operands.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val mut i1: int   = 7;
						val mut i2: int   = 3;
						val mut n1: nat   = +7;
						val mut n2: nat   = +3;
						val mut f1: float = 7.1;
						val mut f2: float = 3.1;

						${['i1', 'n1', 'f1'].flatMap((left) => ['i2', 'n2', 'f2'].flatMap((right) => ['<', '>', '<=', '>=', '!<', '!>'].map((op) => `${left} ${op} ${right};`))).join('\n')}
					}`).stmts.slice(6).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
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
				`, (expr) => assert.strictEqual(VISITOR.visit(AST.EXPR.Operation.fromSource(expr)), TYPE.FALSE));
			});
			test.test('returns `false` if operands are of disjoint types in general.', () => {
				assert.strictEqual(VISITOR.visit(AST.EXPR.Operation.fromSource('7      == null')), TYPE.FALSE);
				assert.strictEqual(VISITOR.visit(AST.EXPR.Operation.fromSource('@symb1 == 256')),  TYPE.FALSE);
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
					}`).stmts.slice(6).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
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
						}`).stmts.slice(3).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
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
						}`).stmts.slice(3).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						repeat(TYPE.BOOL, 3),
					);
				});
			});
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
					assert.throws(() => VISITOR.visit(AST.EXPR.Operation.fromSource('-+42')), TypeErrorInvalidOperation);
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
					const {stmts, visitors} = setupScript(`{
						val mut n: nat = +42;
						-n;
					}`, {typeCheck: false});
					visitors.typeCheck.visit(stmts[0]); // assert does not throw
					assert.throws(() => VISITOR.visit((stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.OperationUnary), TypeErrorInvalidOperation);
				});
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
				xjs.Array.forEachAggregated(extract_lines`
					+3 * 2
					+3 * 2.7
					3 * 2.7
					7 * 3.0 * 2
				`, (src) => {
					const op = AST.EXPR.OperationBinaryArithmetic.fromSource(src);
					return assert.throws(() => VISITOR.visit(op), TypeErrorInvalidOperation);
				});
			});
			test.test('throws for arithmetic operation of non-numbers.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					null + 5
					5 * null
					false - 2
					2 / true
					null ^ false
					"hello" + 5
				`, (src) => {
					const op = AST.EXPR.OperationBinaryArithmetic.fromSource(src);
					return assert.throws(() => VISITOR.visit(op), TypeErrorInvalidOperation);
				});
			});
		});
	});



	test.suite('OperationBinaryComparative', () => {
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
				`, (src) => assert.strictEqual(VISITOR.visit(AST.EXPR.Operation.fromSource(src)), TYPE.BOOL));
			});
			test.test('throws for comparative operation of non-numbers.', () => {
				assert.throws(() => VISITOR.visit(AST.EXPR.OperationBinaryComparative.fromSource('7.0 <= null')), TypeErrorInvalidOperation);
			});
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
						VISITOR.visit((stmt as AST.STMT.StatementExpression).expr as AST.EXPR.OperationBinaryEquality),
						TYPE.BOOL,
					));
				});
			});
		});
	});



	test.suite('OperationBinaryLogical', () => {
		test.suite('#type', () => {
			test.test('with constant folding on.', () => {
				typeOperations(new Map<string, TYPE.Type>([
					['null  && false',    TYPE.NULL],
					['false && null',     TYPE.FALSE],
					['true  && null',     TYPE.NULL],
					['@x    && @y',       typeUnit('y', 'sym')],
					['@x    || @y',       typeUnit('x', 'sym')],
					['@z    && false',    TYPE.FALSE],
					['true  && @z',       typeUnit('z', 'sym')],
					['false && 42',       TYPE.FALSE],
					['4.2   && true',     TYPE.TRUE],
					['null  || false',    TYPE.FALSE],
					['false || null',     TYPE.NULL],
					['true  || null',     TYPE.TRUE],
					['false || 42',       typeUnit(42n)],
					['4.2   || true',     typeUnit(4.2)],
				]));
			});
			test.suite('with constant folding off.', () => {
				test.test('throws when left operand is void.', () => {
					const {stmts, visitors} = setupScript(`{
						func f(): void { return; }
						f.() && true;
						f.() || true;
					}`, {typeCheck: false});
					visitors.typeCheck.visit(stmts[0]);
					return xjs.Array.forEachAggregated(
						stmts.slice(1).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!),
						(expr) => assert.throws(() => VISITOR.visit(expr), TypeErrorInvalidOperation),
					);
				});
				test.test('returns no type when right operand is void.', () => {
					const {stmts, visitors} = setupScript(`{
						func f(): void { return; }
						true && f.();
						true || f.();
					}`, {typeCheck: false});
					visitors.typeCheck.visit(stmts[0]);
					return assertEqualTypes(
						stmts.slice(1).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						repeat(null, 2),
					);
				});
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
				ternary.validator.addSymbol(new SymbolSchemaVar(Validator.cookTokenIdentifier('n'), (ternary.operand0 as AST.EXPR.Claim).operand, false, false));
				return assert.ok(VISITOR.visit(ternary)!.isBottomType);
			});
			test.test('returns no type when consequent/alternative is void.', () => {
				const {stmts, visitors} = setupScript(`{
					func f(): void { return; }
					func g(): void { return; }
					if true then f.() else 4.3;
					if true then 42 else g.();
					if true then f.() else g.();
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				visitors.typeCheck.visit(stmts[1]);
				return assertEqualTypes(
					stmts.slice(2).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					repeat(null, 3),
				);
			});
			test.test('throws when condition is void.', () => {
				const {stmts, visitors} = setupScript(`{
					func f(): void { return; }
					if f.() then 42 else 4.3;
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				return assert.throws(() => VISITOR.visit((stmts[1] as AST.STMT.StatementExpression).expr!), TypeErrorInvalidOperation);
			});
			test.test('throws when condition is not a subtype of `boolean`.', () => {
				assert.throws(() => VISITOR.visit(AST.EXPR.OperationTernary.fromSource('if 2 then true else false')), TypeErrorInvalidOperation);
			});
		});
	});
});
