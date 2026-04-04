import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	VALUE,
	TYPE,
	Optimizer,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
} from '../../../src/index.ts';
import {assertEqualTypes} from '../../assert-helpers.ts';
import {
	CONFIG_FOLDING_OFF,
	CONFIG_COERCION_OFF,
	CONFIG_FOLDING_COERCION_OFF,
	setupScript,
	typeUnit,
} from '../../helpers.ts';
import {extract_lines} from '../../utils.ts';



function typeOperations(tests: ReadonlyMap<string, VALUE.Primitive>, config: CPConfig = CONFIG_DEFAULT): void {
	return assertEqualTypes(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).type()),
		[...tests.values()].map((expected) => new TYPE.Unit(expected)),
	);
}
function foldOperations(tests: Map<string, VALUE.Value>, config: CPConfig = CONFIG_DEFAULT): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).fold()),
		[...tests.values()],
	);
}
function typeOfOperationFromSource(src: string): TYPE.Type {
	return AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_COERCION_OFF).type();
}



describe('ASTNodeOperation', () => {
	function typeOfStmtExpr(stmt: AST.ASTNodeStatement): TYPE.Type {
		assert_instanceof(stmt, AST.ASTNodeStatementExpression);
		return stmt.expr!.type();
	}



	describe('#type', () => {
		it('returns Never for NanErrors.', () => {
			[
				AST.ASTNodeOperationBinaryArithmetic.fromSource('-4 ^ -0.5;').type(),
				AST.ASTNodeOperationBinaryArithmetic.fromSource('1.5 / 0.0;').type(),
			].forEach((typ) => {
				assert.ok(typ.isBottomType);
			});
		});
	});



	describe('#lower', () => {
		it('AST.OperationUnary[operator=NOT]', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				!42;
				val y: int = 42 / 7;
				!(42 + y);
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
			return assert.strictEqual(opt.print(), extract_lines`
				(DROP (NOT (INT.CONST 42)))
				(DECL <int> y (INT.DIV (INT.CONST 42) (INT.CONST 7)))
				(DECL <int> $0 (INT.ADD (INT.CONST 42) (GET y)))
				(DROP (NOT (GET $0)))
			`.join('\n'));
		});
		it('AST.OperationUnary[operator=EMP]', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val x: int = 42;
				?x;
				val y: int = x / 7;
				?(x + y);
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
			return assert.strictEqual(opt.print(), extract_lines`
				(DECL <int> x (INT.CONST 42))
				(DROP (EMP (GET x)))
				(DECL <int> y (INT.DIV (GET x) (INT.CONST 7)))
				(DECL <int> $0 (INT.ADD (GET x) (GET y)))
				(DROP (EMP (GET $0)))
			`.join('\n'));
		});
		it('AST.OperationUnary[operator=NEG]', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut x: int = 42;
				-x;
				val mut y: float = 42.0 / 7.0;
				-(3.0 + y);
				val mut z: int | float = if false then 42 else 4.2;
				-z;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
			return assert.strictEqual(opt.print(), extract_lines`
				(DECL <int> x (INT.CONST 42))
				(DROP (NEG (GET x)))
				(DECL <float> y (FLOAT.DIV (FLOAT.CONST 42.0) (FLOAT.CONST 7.0)))
				(DECL <float> $0 (FLOAT.ADD (FLOAT.CONST 3.0) (GET y)))
				(DROP (NEG (GET $0)))
				if_false (BOOL.CONST false), goto "block-1".
				"block-0":
				(DECL <int> $1 (INT.CONST 42))
				goto "block-2".
				"block-1":
				(DECL <float> $2 (FLOAT.CONST 4.2))
				"block-2":
				(DECL <anything> z (PHI "block-0"->(GET $1) "block-1"->(GET $2)))
				(DROP (NEG (GET z)))
			`.join('\n'));
		});

		describe('AST.OperationBinaryArithmetic', () => {
			it('returns the correct operation.', () => {
				const opt = new Optimizer();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int = 42;
					3 + x^2 / 2^3;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.lower(opt);
				return assert.strictEqual(opt.print(), extract_lines`
					(DECL <int> x (INT.CONST 42))
					(DECL <int> $0 (INT.EXP (GET x) (INT.CONST 2)))
					(DECL <int> $1 (INT.EXP (INT.CONST 2) (INT.CONST 3)))
					(DECL <int> $2 (INT.DIV (GET $0) (GET $1)))
					(DROP (INT.ADD (INT.CONST 3) (GET $2)))
				`.join('\n'));
			});
			it('throws validation error when types mismatch.', () => {
				const opt = new Optimizer();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					3.5 + 4.2 / 2;
				`);
				goal.varCheck();
				goal.typeCheck();
				return assert.throws(() => goal.lower(opt), assert.AssertionError);
			});
		});

		it('AST.OperationBinaryComparative', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
			return assert.strictEqual(opt.print(), extract_lines`
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
			`.join('\n'));
		});

		it('AST.OperationBinaryEquality', () => {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut a: null  = null;
				val mut b: bool  = false;
				val mut c: int   = 10;
				val mut d: float = 0.1;
				a === b;
				c ==  d;
				c !== a;
				d !=  b;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
			return assert.strictEqual(opt.print(), extract_lines`
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
			`.join('\n'));
		});

		describe('AST.OperationBinaryLogical', () => {
			it('[operator=AND]', () => {
				assert.strictEqual(setupScript(`{
					val mut a: null  = null;
					val mut b: bool  = false;
					a && b;
					!a && !b;
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <null> a (NULL.CONST null))
					(DECL <bool> b (BOOL.CONST false))
					if_false (TOBOOL (GET a)), goto "block-1".
					"block-0":
					(DECL <bool> $0 (GET b))
					goto "block-2".
					"block-1":
					(DECL <null> $1 (GET a))
					"block-2":
					(DROP (PHI "block-0"->(GET $0) "block-1"->(GET $1)))
					(DECL <bool> $2 (NOT (GET a)))
					if_false (TOBOOL (GET $2)), goto "block-4".
					"block-3":
					(DECL <bool> $3 (NOT (GET b)))
					goto "block-5".
					"block-4":
					(DECL <bool> $4 (GET $2))
					"block-5":
					(DROP (PHI "block-3"->(GET $3) "block-4"->(GET $4)))
				`.join('\n'));
			});
			it('[operator=OR]', () => {
				assert.strictEqual(setupScript(`{
					val mut c: int   = 10;
					val mut d: float = 0.1;
					c || d;
					-c + 1 || 1.0 - d;
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <int> c (INT.CONST 10))
					(DECL <float> d (FLOAT.CONST 0.1))
					if_false (TOBOOL (GET c)), goto "block-1".
					"block-0":
					(DECL <int> $0 (GET c))
					goto "block-2".
					"block-1":
					(DECL <float> $1 (GET d))
					"block-2":
					(DROP (PHI "block-0"->(GET $0) "block-1"->(GET $1)))
					(DECL <int> $2 (NEG (GET c)))
					(DECL <int> $3 (INT.ADD (GET $2) (INT.CONST 1)))
					if_false (TOBOOL (GET $3)), goto "block-4".
					"block-3":
					(DECL <int> $4 (GET $3))
					goto "block-5".
					"block-4":
					(DECL <float> $5 (NEG (GET d)))
					(DECL <float> $6 (FLOAT.ADD (FLOAT.CONST 1.0) (GET $5)))
					"block-5":
					(DROP (PHI "block-3"->(GET $4) "block-4"->(GET $6)))
				`.join('\n'));
			});
			it('[operator=NAND]', () => {
				assert.strictEqual(setupScript(`{
					val mut a: null  = null;
					val mut b: bool  = false;
					a !& b;
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <null> a (NULL.CONST null))
					(DECL <bool> b (BOOL.CONST false))
					if_false (TOBOOL (GET a)), goto "block-1".
					"block-0":
					(DECL <bool> $0 (GET b))
					goto "block-2".
					"block-1":
					(DECL <null> $1 (GET a))
					"block-2":
					(DECL <anything> $2 (PHI "block-0"->(GET $0) "block-1"->(GET $1)))
					(DROP (NOT (GET $2)))
				`.join('\n'));
			});
			it('[operator=NOR]', () => {
				assert.strictEqual(setupScript(`{
					val mut c: int   = 10;
					val mut d: float = 0.1;
					c !| d;
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <int> c (INT.CONST 10))
					(DECL <float> d (FLOAT.CONST 0.1))
					if_false (TOBOOL (GET c)), goto "block-1".
					"block-0":
					(DECL <int> $0 (GET c))
					goto "block-2".
					"block-1":
					(DECL <float> $1 (GET d))
					"block-2":
					(DECL <anything> $2 (PHI "block-0"->(GET $0) "block-1"->(GET $1)))
					(DROP (NOT (GET $2)))
				`.join('\n'));
			});
		});
		it('AST.OperationTernary', () => {
			assert.strictEqual(setupScript(`{
				val mut x: bool  = false;
				val mut y: float = 0.5;
				val mut z: float = 0.2;
				if x then y else z;
				if y < z then 0.03 + y * 2.0 else 3.0 * z + 0.02;
			}`, {codegen: false}).opt.print(), extract_lines`
				(DECL <bool> x (BOOL.CONST false))
				(DECL <float> y (FLOAT.CONST 0.5))
				(DECL <float> z (FLOAT.CONST 0.2))
				if_false (GET x), goto "block-1".
				"block-0":
				(DECL <float> $0 (GET y))
				goto "block-2".
				"block-1":
				(DECL <float> $1 (GET z))
				"block-2":
				(DROP (PHI "block-0"->(GET $0) "block-1"->(GET $1)))
				if_false (LT (GET y) (GET z)), goto "block-4".
				"block-3":
				(DECL <float> $2 (FLOAT.MUL (GET y) (FLOAT.CONST 2.0)))
				(DECL <float> $3 (FLOAT.ADD (FLOAT.CONST 0.03) (GET $2)))
				goto "block-5".
				"block-4":
				(DECL <float> $4 (FLOAT.MUL (FLOAT.CONST 3.0) (GET z)))
				(DECL <float> $5 (FLOAT.ADD (GET $4) (FLOAT.CONST 0.02)))
				"block-5":
				(DROP (PHI "block-3"->(GET $3) "block-4"->(GET $5)))
			`.join('\n'));
		});
	});



	describe('ASTNodeOperationUnary', () => {
		describe('#type', () => {
			context('with constant folding on.', () => {
				it('returns a constant Boolean type for boolean unary operation of anything.', () => {
					typeOperations(new Map<string, VALUE.Boolean>([
						['!null;',   VALUE.TRUE],
						['!false;',  VALUE.TRUE],
						['!true;',   VALUE.FALSE],
						['!@hello;', VALUE.FALSE],
						['!42;',     VALUE.FALSE],
						['!4.2e+1;', VALUE.FALSE],
						['?null;',   VALUE.TRUE],
						['?false;',  VALUE.TRUE],
						['?true;',   VALUE.FALSE],
						['?@hello;', VALUE.FALSE],
						['?42;',     VALUE.FALSE],
						['?4.2e+1;', VALUE.FALSE],

						['!();',         VALUE.FALSE],
						['!(42,);',      VALUE.FALSE],
						['!(a= 42);',    VALUE.FALSE],
						['!{};',         VALUE.FALSE],
						['!{42};',       VALUE.FALSE],
						['!{41 -> 42};', VALUE.FALSE],
						['?();',         VALUE.TRUE],
						['?(42,);',      VALUE.FALSE],
						['?(a= 42);',    VALUE.FALSE],
						['?{};',         VALUE.TRUE],
						['?{42};',       VALUE.FALSE],
						['?{41 -> 42};', VALUE.FALSE],
					]));
				});
			});

			context('with constant folding off.', () => {
				describe('[operator=NOT]', () => {
					it('returns type `true` for a subtype of `null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: null = null;
							val mut b: null | false = null;
							!a;
							!b;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						return xjs.Array.forEachAggregated(goal.children.slice(2), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.TRUE));
					});
					it('returns type `bool` for a supertype of `T narrows null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: null | int = null;
							val mut b: null | int = 42;
							val mut c: bool = false;
							val mut d: bool | float = 4.2;
							!a;
							!b;
							!c;
							!d;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						return xjs.Array.forEachAggregated(goal.children.slice(4), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.BOOL));
					});
					it('returns type `false` for any type not a supertype of `null` or `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: int = 42;
							val mut b: float = 4.2;
							val mut c: sym = @hello;
							!a;
							!b;
							!c;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						return xjs.Array.forEachAggregated(goal.children.slice(3), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.FALSE));
					});
					it('[literalCollection] returns type `false` for any type not a supertype of `null` or `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							!();
							!(42,);
							!(a= 42);
							!{41 -> 42};
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						return xjs.Array.forEachAggregated(goal.children, (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.FALSE));
					});
				});
				describe('[operator=EMP]', () => {
					it('returns type `true` for a subtype of `null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: null = null;
							val mut b: null | false = null;
							?a;
							?b;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						return xjs.Array.forEachAggregated(goal.children.slice(2), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.TRUE));
					});
					it('returns type `bool` for anything else.', () => {
						[
							'?true;',
							'?@hello;',
							'?42;',
							'?4.2e+1;',

							'?();',
							'?(42,);',
							'?(a= 42);',
							'?{41 -> 42};',
						].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).type()).forEach((typ) => assert.strictEqual(typ, TYPE.BOOL));
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: null | int = null;
							val mut b: null | int = 42;
							val mut c: bool = false;
							val mut d: bool | float = 4.2;
							val mut f: int = 42;
							val mut g: float = 4.2;
							?a;
							?b;
							?c;
							?d;
							?f;
							?g;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						return xjs.Array.forEachAggregated(goal.children.slice(6), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.BOOL));
					});
				});
			});
		});


		describe('#fold', () => {
			specify('[operator=NOT]', () => {
				foldOperations(new Map([
					['!false;',      VALUE.TRUE],
					['!true;',       VALUE.FALSE],
					['!null;',       VALUE.TRUE],
					['!0;',          VALUE.FALSE],
					['!42;',         VALUE.FALSE],
					['!0.0;',        VALUE.FALSE],
					['!-0.0;',       VALUE.FALSE],
					['!4.2e+1;',     VALUE.FALSE],
					['!"";',         VALUE.FALSE],
					['!"hello";',    VALUE.FALSE],
					['!();',         VALUE.FALSE],
					['!(42,);',      VALUE.FALSE],
					['!(a= 42);',    VALUE.FALSE],
					['![];',         VALUE.FALSE],
					['![42];',       VALUE.FALSE],
					['![a= 42];',    VALUE.FALSE],
					['!{};',         VALUE.FALSE],
					['!{42};',       VALUE.FALSE],
					['!{41 -> 42};', VALUE.FALSE],
				]));
			});
			specify('[operator=EMP]', () => {
				foldOperations(new Map([
					['?false;',      VALUE.TRUE],
					['?true;',       VALUE.FALSE],
					['?null;',       VALUE.TRUE],
					['?0;',          VALUE.TRUE],
					['?42;',         VALUE.FALSE],
					['?0.0;',        VALUE.TRUE],
					['?-0.0;',       VALUE.TRUE],
					['?4.2e+1;',     VALUE.FALSE],
					['?"";',         VALUE.TRUE],
					['?"hello";',    VALUE.FALSE],
					['?();',         VALUE.TRUE],
					['?(42,);',      VALUE.FALSE],
					['?(a= 42);',    VALUE.FALSE],
					['?[];',         VALUE.TRUE],
					['?[42];',       VALUE.FALSE],
					['?[a= 42];',    VALUE.FALSE],
					['?{};',         VALUE.TRUE],
					['?{42};',       VALUE.FALSE],
					['?{41 -> 42};', VALUE.FALSE],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryArithmetic', () => {
		describe('#type', () => {
			context('with constant folding and int coersion on.', () => {
				it('returns a constant Integer type for any operation of integers.', () => {
					assertEqualTypes(AST.ASTNodeOperationBinaryArithmetic.fromSource('7 * 3 * 2;').type(), typeUnit(7n * 3n * 2n));
				});
				it('returns a constant Float type for any operation of mix of integers and floats.', () => {
					assertEqualTypes(AST.ASTNodeOperationBinaryArithmetic.fromSource('3.0 * 2.7;')   .type(), typeUnit(3.0 * 2.7));
					assertEqualTypes(AST.ASTNodeOperationBinaryArithmetic.fromSource('7 * 3.0 * 2;') .type(), typeUnit(7 * 3.0 * 2));
				});
			});
			context('with folding off but int coersion on.', () => {
				it('returns Integer for integer arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource('(7 + 3) * 2;', CONFIG_FOLDING_OFF);
					assert.strictEqual(node.type(), TYPE.INT);
					assertEqualTypes(
						[node.operand0.type(), node.operand1.type()],
						[TYPE.INT,             typeUnit(2n)],
					);
				});
				it('returns Float for float arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource('7 * 3.0 ^ 2;', CONFIG_FOLDING_OFF);
					assert.strictEqual(node.type(), TYPE.FLOAT);
					assertEqualTypes(
						[node.operand0.type(), node.operand1.type()],
						[typeUnit(7n),         TYPE.FLOAT],
					);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `Integer` if both operands are ints.', () => {
					assert.strictEqual(typeOfOperationFromSource('7 * 3;'), TYPE.INT);
				});
				it('returns `Float` if both operands are floats.', () => {
					assert.strictEqual(typeOfOperationFromSource('7.0 - 3.0;'), TYPE.FLOAT);
				});
				it('throws TypeError for invalid type operations.', () => {
					assert.throws(() => typeOfOperationFromSource('7.0 + 3;'), TypeErrorInvalidOperation);
				});
			});
			it('throws for arithmetic operation of non-numbers.', () => {
				[
					'null + 5;',
					'5 * null;',
					'false - 2;',
					'2 / true;',
					'null ^ false;',
					'"hello" + 5;',
				].forEach((src) => {
					assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).type(), TypeErrorInvalidOperation);
				});
			});
		});


		describe('#fold', () => {
			it('computes the value of an integer operation of constants.', () => {
				foldOperations(new Map([
					['42 + 420;',           new VALUE.Integer(42n + 420n)],
					['42 - 420;',           new VALUE.Integer(42n + -420n)],
					[' 126 /  3;',          new VALUE.Integer(BigInt(Math.trunc( 126 /  3)))],
					['-126 /  3;',          new VALUE.Integer(BigInt(Math.trunc(-126 /  3)))],
					[' 126 / -3;',          new VALUE.Integer(BigInt(Math.trunc( 126 / -3)))],
					['-126 / -3;',          new VALUE.Integer(BigInt(Math.trunc(-126 / -3)))],
					[' 200 /  3;',          new VALUE.Integer(BigInt(Math.trunc( 200 /  3)))],
					[' 200 / -3;',          new VALUE.Integer(BigInt(Math.trunc( 200 / -3)))],
					['-200 /  3;',          new VALUE.Integer(BigInt(Math.trunc(-200 /  3)))],
					['-200 / -3;',          new VALUE.Integer(BigInt(Math.trunc(-200 / -3)))],
					['42 ^ 2 * 420;',       new VALUE.Integer((42n ** 2n * 420n) % (2n ** 16n))],
					['2 ^ 15 + 2 ^ 14;',    new VALUE.Integer(-(2n ** 14n))],
					['-(2 ^ 14) - 2 ^ 15;', new VALUE.Integer(2n ** 14n)],
					['-(5) ^ +(2 * 3);',    new VALUE.Integer((-5n) ** (2n * 3n))],
				]));
			});
			it('overflows integers properly.', () => {
				assert.deepStrictEqual([
					'2 ^ 15 + 2 ^ 14;',
					'-(2 ^ 14) - 2 ^ 15;',
				].map((src) => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).fold()), [
					new VALUE.Integer(-(2n ** 14n)),
					new VALUE.Integer(2n ** 14n),
				]);
			});
			it('computes the value of a float operation of constants.', () => {
				foldOperations(new Map<string, VALUE.Value>([
					['3.0e1 - 201.0e-1;', new VALUE.Float(30 - 20.1)],
					['3 * 2.1;',          new VALUE.Float(3 * 2.1)],
				]));
			});
			it('throws when performing an operation that does not yield a valid number.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource('42 / 0;')    .fold(), NanErrorDivZero);
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource('-4 ^ -0.5;') .fold(), NanErrorInvalid);
			});
		});
	});



	describe('ASTNodeOperationBinaryComparative', () => {
		describe('#type', () => {
			it('with folding and int coersion on.', () => {
				typeOperations(new Map<string, VALUE.Boolean>([
					['2 <  3;', VALUE.TRUE],
					['2 >  3;', VALUE.FALSE],
					['2 <= 3;', VALUE.TRUE],
					['2 >= 3;', VALUE.FALSE],
					['2 !< 3;', VALUE.FALSE],
					['2 !> 3;', VALUE.TRUE],
				]));
			});
			context('with folding off but int coersion on.', () => {
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.strictEqual(AST.ASTNodeOperationBinaryComparative.fromSource('7.0 > 3;', CONFIG_FOLDING_OFF).type(), TYPE.BOOL);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `Boolean` if both operands are of the same numeric type.', () => {
					assert.strictEqual(typeOfOperationFromSource('7   <  3;'),   TYPE.BOOL);
					assert.strictEqual(typeOfOperationFromSource('7.0 >= 3.0;'), TYPE.BOOL);
				});
				it('throws TypeError if operands have different types.', () => {
					assert.throws(() => typeOfOperationFromSource('7.0 <= 3;'), TypeErrorInvalidOperation);
				});
			});
			it('throws for comparative operation of non-numbers.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryComparative.fromSource('7.0 <= null;').type(), TypeErrorInvalidOperation);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map([
				['3   <  3;',   VALUE.FALSE],
				['3   >  3;',   VALUE.FALSE],
				['3   <= 3;',   VALUE.TRUE],
				['3   >= 3;',   VALUE.TRUE],
				['5.2 <  7.0;', VALUE.TRUE],
				['5.2 >  7.0;', VALUE.FALSE],
				['5.2 <= 7.0;', VALUE.TRUE],
				['5.2 >= 7.0;', VALUE.FALSE],
				['5.2 <  9;',   VALUE.TRUE],
				['5.2 >  9;',   VALUE.FALSE],
				['5.2 <= 9;',   VALUE.TRUE],
				['5.2 >= 9;',   VALUE.FALSE],
				['5   <  9.2;', VALUE.TRUE],
				['5   >  9.2;', VALUE.FALSE],
				['5   <= 9.2;', VALUE.TRUE],
				['5   >= 9.2;', VALUE.FALSE],
				['3.0 <  3;',   VALUE.FALSE],
				['3.0 >  3;',   VALUE.FALSE],
				['3.0 <= 3;',   VALUE.TRUE],
				['3.0 >= 3;',   VALUE.TRUE],
				['3   <  3.0;', VALUE.FALSE],
				['3   >  3.0;', VALUE.FALSE],
				['3   <= 3.0;', VALUE.TRUE],
				['3   >= 3.0;', VALUE.TRUE],
			]));
		});
	});



	describe('ASTNodeOperationBinaryEquality', () => {
		describe('#type', () => {
			context('with folding and int coersion on.', () => {
				it('for numeric literals.', () => {
					typeOperations(new Map<string, VALUE.Boolean>([
						[' 2   ===  3;',   VALUE.FALSE],
						[' 2   !==  3;',   VALUE.TRUE],
						[' 2   ==   3;',   VALUE.FALSE],
						[' 2   !=   3;',   VALUE.TRUE],
						[' 0   === -0;',   VALUE.TRUE],
						[' 0   ==  -0;',   VALUE.TRUE],
						[' 0.0 ===  0;',   VALUE.FALSE],
						[' 0.0 ==   0;',   VALUE.TRUE],
						[' 0.0 === -0;',   VALUE.FALSE],
						[' 0.0 ==  -0;',   VALUE.TRUE],
						['-0.0 ===  0;',   VALUE.FALSE],
						['-0.0 ==   0;',   VALUE.TRUE],
						['-0.0 ===  0.0;', VALUE.FALSE],
						['-0.0 ==   0.0;', VALUE.TRUE],
					]));
				});
				it('returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						val a: unknown = ();
						val b: unknown = (42,);
						val c: unknown = (x= 42);
						val d: Object  = {41 -> 42};
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
					`);
					goal.varCheck();
					goal.typeCheck();
					goal.children.slice(4).forEach((stmt) => {
						const expr: AST.ASTNodeOperationBinaryEquality = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinaryEquality;
						const fold: VALUE.Value | null = expr.fold();
						assert_instanceof(fold, VALUE.Boolean);
						assertEqualTypes(
							expr.type(),
							new TYPE.Unit<VALUE.Boolean>(fold),
						);
					});
				});
			});
			context('with folding off but int coersion on.', () => {
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.strictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('7 == 7.0;', CONFIG_FOLDING_OFF).type(), TYPE.BOOL);
					assert.strictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('1 == 2;',   CONFIG_FOLDING_OFF).type(), TYPE.BOOL);
				});
				it('returns `false` if operands are of different numeric types.', () => {
					assert.strictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('7 === 7.0;', CONFIG_FOLDING_OFF).type(), TYPE.FALSE);
					assert.strictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('1 === 2;',   CONFIG_FOLDING_OFF).type(), TYPE.FALSE);
				});
				it('returns `bool` when operands are same numeric type.', () => {
					xjs.Array.forEachAggregated(`
						1 === 1;
						1 ==  1;
					`.split('\n').slice(1, -1), (expr) => assert.strictEqual(typeOfOperationFromSource(expr), TYPE.BOOL));
				});
				it('returns `false` when operands are of the same primitive type but have different values.', () => {
					xjs.Array.forEachAggregated(`
						@symb1  === @symb2;
						"hello" === "world";
						@symb1  ==  @symb2;
						"hello" ==  "world";
					`.split('\n').slice(1, -1), (expr) => assert.strictEqual(typeOfOperationFromSource(expr), TYPE.FALSE));
				});
				it('returns `bool` when operands are of the same primitive type and have the same value.', () => {
					xjs.Array.forEachAggregated(`
						@symb1  === @symb1;
						"hello" === "hello";
						@symb1  ==  @symb1;
						"hello" ==  "hello";
					`.split('\n').slice(1, -1), (expr) => assert.strictEqual(typeOfOperationFromSource(expr), TYPE.BOOL));
				});
			});
			context('with folding on but int coersion off.', () => {
				it('returns `false` if operands are of different numeric types.', () => {
					typeOperations(new Map([
						['7   === 7.0;', VALUE.FALSE],
						['7   ==  7.0;', VALUE.FALSE],
						['7.0 === 7;',   VALUE.FALSE],
						['7.0 ==  7;',   VALUE.FALSE],
					]), CONFIG_COERCION_OFF);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `false` if operands are of different numeric types.', () => {
					assert.strictEqual(typeOfOperationFromSource('7 == 7.0;'), TYPE.FALSE);
				});
				it('returns `false` if operands are of disjoint types in general.', () => {
					assert.strictEqual(typeOfOperationFromSource('7      == null;'), TYPE.FALSE);
					assert.strictEqual(typeOfOperationFromSource('@symb1 == 256;'),  TYPE.FALSE);
				});
			});
		});


		describe('#fold', () => {
			it('simple types.', () => {
				foldOperations(new Map([
					['null === null;',                          VALUE.TRUE],
					['null ==  null;',                          VALUE.TRUE],
					['null === 5;',                             VALUE.FALSE],
					['null ==  5;',                             VALUE.FALSE],
					['true === 1;',                             VALUE.FALSE],
					['true ==  1;',                             VALUE.FALSE],
					['true === 1.0;',                           VALUE.FALSE],
					['true ==  1.0;',                           VALUE.FALSE],
					['true === 5.1;',                           VALUE.FALSE],
					['true ==  5.1;',                           VALUE.FALSE],
					['true === true;',                          VALUE.TRUE],
					['true ==  true;',                          VALUE.TRUE],
					['@a === @a;',                              VALUE.TRUE],
					['@a ==  @a;',                              VALUE.TRUE],
					['@a === @b;',                              VALUE.FALSE],
					['@a ==  @b;',                              VALUE.FALSE],
					['@a === 256;',                             VALUE.FALSE], // TODO: turn on integerRadices
					['@a ==  256;',                             VALUE.FALSE], // TODO: turn on integerRadices
					['@a === @\'a\';',                          VALUE.FALSE],
					['@a ==  @\'a\';',                          VALUE.FALSE],
					['@\'a\' === @\'\\u{61}\';',                VALUE.FALSE],
					['@\'a\' ==  @\'\\u{61}\';',                VALUE.FALSE],
					['@\'\\u{61}\' === @\'\\u{61}\';',          VALUE.TRUE],
					['@\'\\u{61}\' ==  @\'\\u{61}\';',          VALUE.TRUE],
					['3.0 === 3;',                              VALUE.FALSE],
					['3.0 ==  3;',                              VALUE.TRUE],
					['3 === 3.0;',                              VALUE.FALSE],
					['3 ==  3.0;',                              VALUE.TRUE],
					['0.0 === 0.0;',                            VALUE.TRUE],
					['0.0 ==  0.0;',                            VALUE.TRUE],
					['0.0 === -0.0;',                           VALUE.FALSE],
					['0.0 ==  -0.0;',                           VALUE.TRUE],
					['0 === -0;',                               VALUE.TRUE],
					['0 ==  -0;',                               VALUE.TRUE],
					['0.0 === 0;',                              VALUE.FALSE],
					['0.0 ==  0;',                              VALUE.TRUE],
					['0.0 === -0;',                             VALUE.FALSE],
					['0.0 ==  -0;',                             VALUE.TRUE],
					['-0.0 === 0;',                             VALUE.FALSE],
					['-0.0 ==  0;',                             VALUE.TRUE],
					['-0.0 === 0.0;',                           VALUE.FALSE],
					['-0.0 ==  0.0;',                           VALUE.TRUE],
					['"" == "";',                               VALUE.TRUE],
					['"a" === "a";',                            VALUE.TRUE],
					['"a" ==  "a";',                            VALUE.TRUE],
					['"hello\\u{20}world" === "hello world";',  VALUE.TRUE],
					['"hello\\u{20}world" ==  "hello world";',  VALUE.TRUE],
					['"a" !== "b";',                            VALUE.TRUE],
					['"a" !=  "b";',                            VALUE.TRUE],
					['"hello\\u{20}world" !== "hello20world";', VALUE.TRUE],
					['"hello\\u{20}world" !=  "hello20world";', VALUE.TRUE],
				]));
			});
			it('with int coercion off, does not coerce ints into floats.', () => {
				foldOperations(new Map<string, VALUE.Value>([
					['7   === 7.0;', VALUE.FALSE],
					['7   ==  7.0;', VALUE.FALSE],
					['7.0 === 7;',   VALUE.FALSE],
					['7.0 ==  7;',   VALUE.FALSE],
				]), CONFIG_COERCION_OFF);
			});
			it('compound types.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val a: unknown = ();
					val b: unknown = (42,);
					val c: unknown = (x= 42);
					val d: Object  = [];
					val e: Object  = [42];
					val f: Object  = [x= 42];
					val g: Object  = {};
					val h: Object  = {42};
					val i: Object  = {41 -> 42};

					val bb: unknown = ((42,),);
					val cc: unknown = (x= (42,));
					val hh: Object  = {(42,)};
					val ii: Object  = {(41,) -> (42,)};

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
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.children.slice(13).forEach((stmt) => {
					assert.strictEqual((stmt as AST.ASTNodeStatementExpression).expr!.fold(), VALUE.TRUE, stmt.source);
				});
			});
			it('compound value types’ constituents are compared using same operand.', () => {
				foldOperations(new Map([
					['(   42.0,)  === (   42,);',   VALUE.FALSE],
					['(   42.0,)  ==  (   42,);',   VALUE.TRUE],
					['(a= 42.0)   === (a= 42);',    VALUE.FALSE],
					['(a= 42.0)   ==  (a= 42);',    VALUE.TRUE],
					['(    0.0,)  === (   -0.0,);', VALUE.FALSE],
					['(    0.0,)  ==  (   -0.0,);', VALUE.TRUE],
					['(a=  0.0)   === (a= -0.0);',  VALUE.FALSE],
					['(a=  0.0)   ==  (a= -0.0);',  VALUE.TRUE],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryLogical', () => {
		describe('#type', () => {
			it('with constant folding on.', () => {
				typeOperations(new Map<string, VALUE.Primitive>([
					['null   && false;',  VALUE.NULL],
					['false  && null;',   VALUE.FALSE],
					['true   && null;',   VALUE.NULL],
					['@never && @x;',     new VALUE.Symbol(0x100n, 'x')],
					['@x     && @never;', VALUE.SYM_NEVER],
					['@never || @y;',     VALUE.SYM_NEVER],
					['@y     || @never;', new VALUE.Symbol(0x100n, 'y')],
					['@z     && false;',  VALUE.FALSE],
					['true   && @z;',     new VALUE.Symbol(0x100n, 'z')],
					['false  && 42;',     VALUE.FALSE],
					['4.2    && true;',   VALUE.TRUE],
					['null   || false;',  VALUE.FALSE],
					['false  || null;',   VALUE.NULL],
					['true   || null;',   VALUE.TRUE],
					['false  || 42;',     new VALUE.Integer(42n)],
					['4.2    || true;',   new VALUE.Float(4.2)],
				]));
			});
			context('with constant folding off.', () => {
				describe('[operator=AND]', () => {
					it('returns `left` if it’s a subtype of `null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: null = null;
							val mut b: null | false = null;
							a && 42;
							b && 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assertEqualTypes(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL,
							TYPE.NULL.union(TYPE.FALSE),
						]);
					});
					it('returns `T | right` if left is a supertype of `T narrows null | false`.', () => {
						const hello: TYPE.Unit<VALUE.String> = typeUnit('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: null | int = null;
							val mut b: null | int = 42;
							val mut c: bool = false;
							val mut d: bool | float = 4.2;
							a && "hello";
							b && "hello";
							c && "hello";
							d && "hello";
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						return assertEqualTypes(goal.children.slice(4).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL.union(hello),
							TYPE.NULL.union(hello),
							TYPE.FALSE.union(hello),
							TYPE.FALSE.union(hello),
						]);
					});
					it('returns `right` if left does not contain `null` nor `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: int = 42;
							val mut b: float = 4.2;
							a && true;
							b && null;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assertEqualTypes(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.TRUE,
							TYPE.NULL,
						]);
					});
				});
				describe('[operator=OR]', () => {
					it('returns `right` if left is a subtype of `null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: null = null;
							val mut b: null | false = null;
							a || false;
							b || 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assertEqualTypes(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.FALSE,
							typeUnit(42n),
						]);
					});
					it('returns `(left - T) | right` if left is a supertype of `T narrows null | false`.', () => {
						const hello: TYPE.Unit<VALUE.String> = typeUnit('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: null | int = null;
							val mut b: null | int = 42;
							val mut c: bool = false;
							val mut d: bool | float = 4.2;
							a || "hello";
							b || "hello";
							c || "hello";
							d || "hello";
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assertEqualTypes(goal.children.slice(4).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.INT.union(hello),
							TYPE.INT.union(hello),
							TYPE.TRUE.union(hello),
							TYPE.TRUE.union(TYPE.FLOAT).union(hello),
						]);
					});
					it('returns `left` if it does not contain `null` nor `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							val mut a: int = 42;
							val mut b: float = 4.2;
							a || true;
							b || null;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assertEqualTypes(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.INT,
							TYPE.FLOAT,
						]);
					});
				});
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, VALUE.Value>([
				['@never && @x;',     new VALUE.Symbol(0x100n, 'x')],
				['@x     && @never;', VALUE.SYM_NEVER],
				['@never || @y;',     VALUE.SYM_NEVER],
				['@y     || @never;', new VALUE.Symbol(0x100n, 'y')],
				['@z     && false;',  VALUE.FALSE],
				['true   && @z;',     new VALUE.Symbol(0x100n, 'z')],
				['null   && 5;',      VALUE.NULL],
				['null   || 5;',      new VALUE.Integer(5n)],
				['5      && null;',   VALUE.NULL],
				['5      || null;',   new VALUE.Integer(5n)],
				['5.1    && true;',   VALUE.TRUE],
				['5.1    || true;',   new VALUE.Float(5.1)],
				['3.1    && 5;',      new VALUE.Integer(5n)],
				['3.1    || 5;',      new VALUE.Float(3.1)],
				['false  && null;',   VALUE.FALSE],
				['false  || null;',   VALUE.NULL],
			]));
		});
	});



	describe('ASTNodeOperationTernary', () => {
		describe('#type', () => {
			context('with constant folding on.', () => {
				it('computes type for for conditionals.', () => {
					typeOperations(new Map<string, VALUE.Primitive>([
						['if true then false else 2;',          VALUE.FALSE],
						['if false then 3.0 else null;',        VALUE.NULL],
						['if true then 2 else 3.0;',            new VALUE.Integer(2n)],
						['if false then 2 + 3.0 else 1.0 * 2;', new VALUE.Float(2.0)],
					]));
				});
			});
			it('throws when condition is not a subtype of `boolean`.', () => {
				assert.throws(() => AST.ASTNodeOperationTernary.fromSource('if 2 then true else false;').type(), TypeErrorInvalidOperation);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, VALUE.Value>([
				['if true then false else 2;',          VALUE.FALSE],
				['if false then 3.0 else null;',        VALUE.NULL],
				['if true then 2 else 3.0;',            new VALUE.Integer(2n)],
				['if false then 2 + 3.0 else 1.0 * 2;', new VALUE.Float(2.0)],
			]));
		});
	});
});
