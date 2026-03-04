import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	bigint_to_i64,
	drop_then,
	type Builder,
	BinVect,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
} from '../../../src/index.ts';
import {
	assert_shallowStrictEqual,
	assertEqualTypes,
	assertEqualBins,
} from '../../assert-helpers.ts';
import {
	setupScript,
	typeUnit,
	buildConst,
} from '../../helpers.ts';
import {
	extract_lines,
	repeat,
} from '../../utils.ts';



function typeOperations(tests: ReadonlyMap<string, VALUE.Primitive>): void {
	return assertEqualTypes(
		[...tests.keys()].map((src) => AST.Operation.fromSource(src).type()),
		[...tests.values()].map((expected) => new TYPE.Unit(expected)),
	);
}
function foldOperations(tests: Map<string, VALUE.Value>): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.Operation.fromSource(src).fold()),
		[...tests.values()],
	);
}
function buildOperations(tests: ReadonlyMap<string, (builder: Builder, get_op0: binaryen.ExpressionRef) => binaryen.ExpressionRef>): void {
	return xjs.Map.forEachAggregated(tests, (expected_fn, src) => {
		const splits: readonly string[] = src.trim().split(/\s+/);
		let goal:  AST.Goal; // eslint-disable-line @typescript-eslint/init-declarations
		let stmts: readonly AST.Statement[] = [];
		switch (splits.length) {
			case 2: {
				// unary prefix operator
				({goal, stmts} = setupScript(`{
					val mut a: ${ AST.Constant.fromSource(splits[1]) .type().toString() } = ${ splits[1] };
					${ splits[0] } a;
				}`));
				break;
			}
			default: {
				// any operator where operand comes first
				({goal, stmts} = setupScript(`{
					val mut a: ${ AST.Constant.fromSource(splits[0]) .type().toString() } = ${ splits[0] };
					a ${ splits.slice(1).join('') };
				}`));
				break;
			}
		}
		return assertEqualBins(
			(stmts[1] as AST.StatementExpression).expr!.build(),
			expected_fn.call(null, goal!.builder, goal!.builder.module.local.get(0, binaryen.v128)),
		);
	});
}



test.suite('Operation', () => {
	function typeOfStmtExpr(stmt: AST.Statement): TYPE.Type {
		assert_instanceof(stmt, AST.StatementExpression);
		return stmt.expr!.type();
	}

	const CALL = {
		vnot: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot', [arg], binaryen.v128),
		vemp: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp', [arg], binaryen.v128),
		vneg: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg', [arg], binaryen.v128),
		vtoi: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtoi', [arg], binaryen.v128),
		vton: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vton', [arg], binaryen.v128),
		vtof: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtof', [arg], binaryen.v128),

		viexp:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('viexp',   [arg0, arg1], binaryen.v128),
		vimul:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vimul',   [arg0, arg1], binaryen.v128),
		vfmul:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfmul',   [arg0, arg1], binaryen.v128),
		vidiv_s: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vidiv_s', [arg0, arg1], binaryen.v128),
		vidiv_u: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vidiv_u', [arg0, arg1], binaryen.v128),
		vfdiv:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfdiv',   [arg0, arg1], binaryen.v128),
		viadd:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('viadd',   [arg0, arg1], binaryen.v128),
		vfadd:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfadd',   [arg0, arg1], binaryen.v128),
		visub_s: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('visub_s', [arg0, arg1], binaryen.v128),
		visub_u: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('visub_u', [arg0, arg1], binaryen.v128),
		vfsub:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfsub',   [arg0, arg1], binaryen.v128),
		vlt:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt',     [arg0, arg1], binaryen.v128),
		vgt:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt',     [arg0, arg1], binaryen.v128),
		vle:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle',     [arg0, arg1], binaryen.v128),
		vge:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge',     [arg0, arg1], binaryen.v128),
		vid:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid',     [arg0, arg1], binaryen.v128),
		veq:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq',     [arg0, arg1], binaryen.v128),
	} as const;

	/**
	 * The type of a helper for creating outputs for short-circuited operations.
	 * @param mod   the module to perform the operation
	 * @param tee   parameters for teeing the first (left-hand) operand; either a 3-tuple:
	 *              ```
	 *              [
	 *              	value, // the operand value
	 *              	index, // the local index to tee the value (default `0`)
	 *              	type,  // the value’s type (default `binaryen.v128`)
	 *              ]
	 *              ```
	 *              or a plain value, which is converted to a tuple with the above defaults.
	 * @param arg1  the second (right-hand) operand
	 * @param fnref the helper function to call
	 * @return      the new binaryen expression
	 */
	type OperationHelper<FnRef extends boolean = false> = FnRef extends true ? (
		mod:   binaryen.Module,
		tee:   binaryen.ExpressionRef | [value: binaryen.ExpressionRef, index?: number, type?: binaryen.Type],
		arg1:  binaryen.ExpressionRef,
		fnref: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
	) => binaryen.ExpressionRef : (
		mod:   binaryen.Module,
		tee:   binaryen.ExpressionRef | [value: binaryen.ExpressionRef, index?: number, type?: binaryen.Type],
		arg1:  binaryen.ExpressionRef,
	) => binaryen.ExpressionRef;

	function normalizeTee(tee: binaryen.ExpressionRef | [value: binaryen.ExpressionRef, index?: number, type?: binaryen.Type]): {readonly value: binaryen.ExpressionRef, readonly index: number, readonly type: binaryen.Type} {
		// eslint-disable-next-line prefer-const --- some of them are reassigned
		let [value, index, type]: [value: binaryen.ExpressionRef, index?: number | undefined, type?: binaryen.Type | undefined] = typeof tee === 'object' ? tee : [tee];
		index ??= 0;
		type  ??= binaryen.v128;
		return {value, index, type};
	}

	const BINOP = {
		mul: ((mod, tee, op1, fnref) => {
			const {value, index, type} = normalizeTee(tee);

			const local_tee: binaryen.ExpressionRef = mod.local.tee(index, value, type);
			const local_get: binaryen.ExpressionRef = mod.local.get(index, type);
			const teeer                             = new BinVect(mod, local_tee);
			const getter                            = new BinVect(mod, local_get);
			return mod.if(
				mod.i32.or(
					mod.i32.and(teeer.isInt,    mod.i64.eqz(getter.intValue)),
					mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(0.0))), // also takes care of the `-0.0` case
				),
				local_get,
				mod.if(
					mod.i32.or(
						mod.i32.and(getter.isInt,   mod.i64.eq(getter.intValue,   bigint_to_i64(mod, 1n))),
						mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(1.0))),
					),
					op1,
					fnref.call(null, mod, local_get, op1),
				),
			);
		}) as OperationHelper<true>,

		add: ((mod, tee, op1, fnref) => {
			const {value, index, type} = normalizeTee(tee);

			const local_tee: binaryen.ExpressionRef = mod.local.tee(index, value, type);
			const local_get: binaryen.ExpressionRef = mod.local.get(index, type);
			const teeer                             = new BinVect(mod, local_tee);
			const getter                            = new BinVect(mod, local_get);
			return mod.if(
				mod.i32.or(
					mod.i32.and(teeer.isInt,    mod.i64.eqz(getter.intValue)),
					mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(0.0))), // also takes care of the `-0.0` case
				),
				op1,
				fnref.call(null, mod, local_get, op1),
			);
		}) as OperationHelper<true>,

		and: ((mod, tee, op1) => {
			const {value, index, type} = normalizeTee(tee);
			return mod.if(
				new BinVect(mod, CALL.vnot(mod, mod.local.tee(index, value, type))).isSpecial(false),
				op1,
				mod.local.get(index, type),
			);
		}) as OperationHelper,

		or: ((mod, tee, op1) => {
			const {value, index, type} = normalizeTee(tee);
			return mod.if(
				new BinVect(mod, CALL.vnot(mod, mod.local.tee(index, value, type))).isSpecial(false),
				mod.local.get(index, type),
				op1,
			);
		}) as OperationHelper,
	} as const;



	test.suite('#type', () => {
		test.test('returns `nothing` for NanErrors.', () => {
			[
				AST.OperationBinaryArithmetic.fromSource('-4.0 ^ -0.5').type(),
				AST.OperationBinaryArithmetic.fromSource('1.5 / 0.0').type(),
			].forEach((typ) => {
				assert.ok(typ.isBottomType);
			});
		});


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
						}`, {build: false}).stmts.slice(11).map((stmt) => (stmt as AST.StatementExpression).expr!.type()),
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
					}`, {build: false}).stmts.slice(9).map((stmt) => (stmt as AST.StatementExpression).expr!.type()),
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
					}`).stmts.slice(6).map((stmt) => (stmt as AST.StatementExpression).expr!.type()),
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
				`, (expr) => assert.strictEqual(AST.Operation.fromSource(expr).type(), TYPE.FALSE));
			});
			test.test('returns `false` if operands are of disjoint types in general.', () => {
				assert.strictEqual(AST.Operation.fromSource('7      == null').type(), TYPE.FALSE);
				assert.strictEqual(AST.Operation.fromSource('@symb1 == 256').type(),  TYPE.FALSE);
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
					}`).stmts.slice(6).map((stmt) => (stmt as AST.StatementExpression).expr!.type()),
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
						}`).stmts.slice(3).map((stmt) => (stmt as AST.StatementExpression).expr!.type()),
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
						}`).stmts.slice(3).map((stmt) => (stmt as AST.StatementExpression).expr!.type()),
						repeat(TYPE.BOOL, 3),
					);
				});
			});
		});
	});



	test.suite('#lower', () => {
		test.test('AST.OperationUnary[operator=NOT]', () => {
			assert.strictEqual(setupScript(`{
				!42;
				val y: int = 42 / 7;
				!(42 + y);
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DROP (NOT (INT.CONST 42)))
				(DECL <int> y (INT.DIV (INT.CONST 42) (INT.CONST 7)))
				(DECL <int> $0 (INT.ADD (INT.CONST 42) (GET y)))
				(DROP (NOT (GET $0)))
			`.join('\n'));
		});
		test.test('AST.OperationUnary[operator=EMP]', () => {
			assert.strictEqual(setupScript(`{
				val x: int = 42;
				?x;
				val y: int = x / 7;
				?(x + y);
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL <int> x (INT.CONST 42))
				(DROP (EMP (GET x)))
				(DECL <int> y (INT.DIV (GET x) (INT.CONST 7)))
				(DECL <int> $0 (INT.ADD (GET x) (GET y)))
				(DROP (EMP (GET $0)))
			`.join('\n'));
		});
		test.test('AST.OperationUnary[operator=NEG]', () => {
			assert.strictEqual(setupScript(`{
				val mut x: int = 42;
				-x;
				val mut y: float = 42.0 / 7.0;
				-(3.0 + y);
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL <int> x (INT.CONST 42))
				(DROP (INT.NEG (GET x)))
				(DECL <float> y (FLOAT.DIV (FLOAT.CONST 42.0) (FLOAT.CONST 7.0)))
				(DECL <float> $0 (FLOAT.ADD (FLOAT.CONST 3.0) (GET y)))
				(DROP (FLOAT.NEG (GET $0)))
			`.join('\n'));
		});

		test.test('AST.OperationBinaryArithmetic', () => {
			assert.strictEqual(setupScript(`{
				val mut x: int = 42;
				3 + x^2 / 2^3;
			}`, {lower: true, build: false}).opt.print(), extract_lines`
				(DECL <int> x (INT.CONST 42))
				(DECL <int> $0 (INT.EXP (GET x) (INT.CONST 2)))
				(DECL <int> $1 (INT.EXP (INT.CONST 2) (INT.CONST 3)))
				(DECL <int> $2 (INT.DIV (GET $0) (GET $1)))
				(DROP (INT.ADD (INT.CONST 3) (GET $2)))
			`.join('\n'));
		});

		test.test('AST.OperationBinaryComparative', () => {
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
			}`, {lower: true, build: false}).opt.print(), extract_lines`
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

		test.test('AST.OperationBinaryEquality', () => {
			assert.strictEqual(setupScript(`{
				val mut a: null  = null;
				val mut b: bool  = false;
				val mut c: int   = 10;
				val mut d: float = 0.1;
				a === b;
				c ==  d;
				c !== a;
				d !=  b;
			}`, {lower: true, build: false}).opt.print(), extract_lines`
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

		test.suite('AST.OperationBinaryLogical', () => {
			test.test('[operator=AND]', () => {
				assert.strictEqual(setupScript(`{
					val mut a: null  = null;
					val mut b: bool  = false;
					a && b;
					!a && !b;
				}`, {lower: true, build: false}).opt.print(), extract_lines`
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
			test.test('[operator=OR]', () => {
				assert.strictEqual(setupScript(`{
					val mut c: int   = 10;
					val mut d: float = 0.1;
					c || d;
					-c + 1 || 1.0 - d;
				}`, {lower: true, build: false}).opt.print(), extract_lines`
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
					(DECL <int> $2 (INT.NEG (GET c)))
					(DECL <int> $3 (INT.ADD (GET $2) (INT.CONST 1)))
					if_false (TOBOOL (GET $3)), goto "block-4".
					"block-3":
					(DECL <int> $4 (GET $3))
					goto "block-5".
					"block-4":
					(DECL <float> $5 (FLOAT.SUB (FLOAT.CONST 1.0) (GET d)))
					"block-5":
					(DROP (PHI "block-3"->(GET $4) "block-4"->(GET $5)))
				`.join('\n'));
			});
			test.test('[operator=NAND]', () => {
				assert.strictEqual(setupScript(`{
					val mut a: null  = null;
					val mut b: bool  = false;
					a !& b;
				}`, {lower: true, build: false}).opt.print(), extract_lines`
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
			test.test('[operator=NOR]', () => {
				assert.strictEqual(setupScript(`{
					val mut c: int   = 10;
					val mut d: float = 0.1;
					c !| d;
				}`, {lower: true, build: false}).opt.print(), extract_lines`
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
		test.test('AST.OperationTernary', () => {
			assert.strictEqual(setupScript(`{
				val mut x: bool  = false;
				val mut y: float = 0.5;
				val mut z: float = 0.2;
				if x then y else z;
				if y < z then 0.03 + y * 2.0 else 3.0 * z + 0.02;
			}`, {lower: true, build: false}).opt.print(), extract_lines`
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



	test.suite('#build', () => {
		test.test('compound expression.', () => {
			const {goal, stmts, mod} = setupScript(`{
				val mut a: int   = 42;
				val mut b: float = 2.1;
				a ^ 2 / 420;
				b / 3.1 - 5.1;
			}`);
			return assertEqualBins(
				stmts.slice(2).map((stmt) => (stmt as AST.StatementExpression).expr!.build()),
				[CALL.vidiv_s(
					mod,
					CALL.viexp(mod, mod.local.get(0, binaryen.v128), buildConst(goal.builder, 2n)),
					buildConst(goal.builder, 420n),
				), CALL.vfsub(
					mod,
					CALL.vfdiv(mod, mod.local.get(1, binaryen.v128), buildConst(goal.builder, 3.1)),
					buildConst(goal.builder, 5.1),
				)],
			);
		});
		test.test('with block-expressions.', () => {
			const {stmts, mod} = setupScript(`{
				val mut x: int = 42;
				val mut y: int = 69;
				x + { x; y; };
			}`);
			return assertEqualBins((stmts[2] as AST.StatementExpression).expr!.build(), BINOP.add(
				mod,
				[mod.local.get(0, binaryen.v128), 2],
				mod.block(null, [
					mod.drop(mod.local.get(0, binaryen.v128)),
					mod.local.get(1, binaryen.v128),
				], binaryen.v128),
				CALL.viadd,
			));
		});
	});



	test.suite('OperationUnary', () => {
		test.suite('#type', () => {
			test.suite('with constant folding on.', () => {
				test.test('returns a constant Boolean type for boolean unary operation of anything.', () => {
					typeOperations(new Map<string, VALUE.Boolean>([
						['!null',   VALUE.TRUE],
						['!false',  VALUE.TRUE],
						['!true',   VALUE.FALSE],
						['!@hello', VALUE.FALSE],
						['!42',     VALUE.FALSE],
						['!4.2e+1', VALUE.FALSE],
						['?null',   VALUE.TRUE],
						['?false',  VALUE.TRUE],
						['?true',   VALUE.FALSE],
						['?@hello', VALUE.FALSE],
						['?42',     VALUE.FALSE],
						['?4.2e+1', VALUE.FALSE],

						['!()',         VALUE.FALSE],
						['!(42,)',      VALUE.FALSE],
						['!(a= 42)',    VALUE.FALSE],
						['!{}',         VALUE.FALSE],
						['!{42}',       VALUE.FALSE],
						['!{41 -> 42}', VALUE.FALSE],
						['?()',         VALUE.TRUE],
						['?(42,)',      VALUE.FALSE],
						['?(a= 42)',    VALUE.FALSE],
						['?{}',         VALUE.TRUE],
						['?{42}',       VALUE.FALSE],
						['?{41 -> 42}', VALUE.FALSE],
					]));
				});
				test.test('[operator=NEG] throws for Natural number literals (foldable).', () => {
					assert.throws(() => AST.Operation.fromSource('-+42').type(), TypeErrorInvalidOperation);
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
					assert.throws(() => ((stmts[1] as AST.StatementExpression).expr as AST.OperationUnary).type(), TypeErrorInvalidOperation);
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
					`, (src) => assert.throws(() => AST.OperationUnary.fromSource(src).type(), TypeErrorInvalidOperation));
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
				const exprs: readonly AST.OperationUnary[] = setupScript(`{
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
				}`, {build: false}).stmts.slice(3).map((stmt) => (stmt as AST.StatementExpression).expr as AST.OperationUnary);
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


		test.suite('#build', () => {
			test.test('optimizes by evaluating operand type.', () => {
				buildOperations(new Map([
					['! null',   (builder, get_op0) => drop_then(builder.module, [get_op0], true)],
					['! false',  (builder, get_op0) => drop_then(builder.module, [get_op0], true)],
					['! true',   (builder, get_op0) => drop_then(builder.module, [get_op0], false)],
					['! @hello', (builder, get_op0) => drop_then(builder.module, [get_op0], false)],
					['! 42',     (builder, get_op0) => drop_then(builder.module, [get_op0], false)],
					['! 4.2',    (builder, get_op0) => drop_then(builder.module, [get_op0], false)],
					['? null',   (builder, get_op0) => drop_then(builder.module, [get_op0], true)],
					['? false',  (builder, get_op0) => drop_then(builder.module, [get_op0], true)],
				]));
				// eslint-disable-next-line no-constant-binary-expression, @typescript-eslint/no-unnecessary-condition
				false && buildOperations(new Map([
					['! ()',     (builder, get_op0) => drop_then(builder.module, [get_op0], false)],
					['! (4.2,)', (builder, get_op0) => drop_then(builder.module, [get_op0], false)],
				]));
			});
			test.test('returns the correct operation.', () => {
				buildOperations(new Map([
					['? true',  (builder, get_op0) => CALL.vemp(builder.module, get_op0)],
					['? @hi',   (builder, get_op0) => CALL.vemp(builder.module, get_op0)],
					['? 42',    (builder, get_op0) => CALL.vemp(builder.module, get_op0)],
					['? 4.2',   (builder, get_op0) => CALL.vemp(builder.module, get_op0)],
					['? 0',     (builder, get_op0) => CALL.vemp(builder.module, get_op0)],
					['? 0.0',   (builder, get_op0) => CALL.vemp(builder.module, get_op0)],
					['- (4)',   (builder, get_op0) => CALL.vneg(builder.module, get_op0)],
					['- (4.2)', (builder, get_op0) => CALL.vneg(builder.module, get_op0)],
				]));
				// eslint-disable-next-line no-constant-binary-expression, @typescript-eslint/no-unnecessary-condition
				false && buildOperations(new Map([
					['? ()',     (builder, get_op0) => CALL.vemp(builder.module, get_op0)],
					['? (4.2,)', (builder, get_op0) => CALL.vemp(builder.module, get_op0)],
				]));
				const {stmts, mod} = setupScript(`{
					val mut f: bool = false;
					val mut t: bool = true;
					!f;
					!t;
					?f;
					?t;
				}`);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => (stmt as AST.StatementExpression).expr!.build()),
					[
						CALL.vnot(mod, mod.local.get(0, binaryen.v128)),
						CALL.vnot(mod, mod.local.get(1, binaryen.v128)),
						CALL.vemp(mod, mod.local.get(0, binaryen.v128)),
						CALL.vemp(mod, mod.local.get(1, binaryen.v128)),
					],
				);
			});
			test.test('works with vects.', () => {
				const {stmts, mod} = setupScript(`{
					val mut x: int | float = 42;
					val mut y: int | float = 4.2;

					!x;
					!y;

					?x;
					?y;

					-x;
					-y;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = stmts.slice(2).map((stmt) => (
					((stmt as AST.StatementExpression).expr as AST.OperationUnary).operand.build()
				));
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						drop_then(mod, [extracts[0]], false),
						drop_then(mod, [extracts[1]], false),
						CALL.vemp(mod, extracts[2]),
						CALL.vemp(mod, extracts[3]),
						CALL.vneg(mod, extracts[4]),
						CALL.vneg(mod, extracts[5]),
					].map((expected) => mod.drop(expected)),
				);
			});
			test.test('multiple operations.', () => {
				const {stmts, mod} = setupScript(`{
					val mut x: int | float = 42;
					val mut y: int | float = 4.2;

					!!x;
					??y;

					!-x;
					?-y;

					--x;
					--y;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = stmts.slice(2).map((stmt) => (
					(((stmt as AST.StatementExpression).expr as AST.OperationUnary).operand as AST.OperationUnary).operand.build()
				));
				assertEqualBins(
					stmts.slice(4).map((stmt) => (
						((stmt as AST.StatementExpression).expr as AST.OperationUnary).operand.build()
					)),
					extracts.slice(2).map((extract) => CALL.vneg(mod, extract)),
				);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						drop_then(mod, [drop_then(mod, [extracts[0]], false)], true),
						CALL.vemp(mod, CALL.vemp(mod, extracts[1])),
						drop_then(mod, [CALL.vneg(mod, extracts[2])], false),
						CALL.vemp(mod, CALL.vneg(mod, extracts[3])),
						CALL.vneg(mod, CALL.vneg(mod, extracts[4])),
						CALL.vneg(mod, CALL.vneg(mod, extracts[5])),
					].map((expected) => mod.drop(expected)),
				);
			});
			test.test('[operator=INT | NAT | FLOAT]: returns a numeric conversion.', () => {
				const {stmts, mod} = setupScript(`{
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
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = stmts.slice(3).map((stmt) => (
					((stmt as AST.StatementExpression).expr as AST.OperationUnary).operand.build()
				));
				return assertEqualBins(stmts.slice(3).map((stmt) => stmt.build()), [
					mod.drop(CALL.vtoi(mod, extracts[0])),
					mod.drop(CALL.vtoi(mod, extracts[1])),
					mod.drop(CALL.vtoi(mod, extracts[2])),
					mod.drop(CALL.vton(mod, extracts[3])),
					mod.drop(CALL.vton(mod, extracts[4])),
					mod.drop(CALL.vton(mod, extracts[5])),
					mod.drop(CALL.vtof(mod, extracts[6])),
					mod.drop(CALL.vtof(mod, extracts[7])),
					mod.drop(CALL.vtof(mod, extracts[8])),
				]);
			});
		});
	});



	test.suite('OperationBinary', () => {
		test.suite('#build', () => {
			test.test('works with vects.', () => {
				const {goal, stmts, mod} = setupScript(`{
					val mut x: int   = 42;
					val mut y: float = 4.2;

					x * 2;
					y * 2.4;

					x + 2;
					y + 2.4;

					x < 2;
					y < 2.4;

					x == 2;
					y == 2;
					x == 2.4;
					y == 2.4;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = stmts.slice(2).map((stmt) => (
					((stmt as AST.StatementExpression).expr as AST.OperationBinary).operand0.build()
				));
				/* eslint-disable @stylistic/quote-props */
				const const_ = {
					'2':   buildConst(goal.builder, 2n),
					'2.4': buildConst(goal.builder, 2.4),
				} as const;
				/* eslint-enable @stylistic/quote-props */
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						BINOP.mul(mod, [extracts[0], 2], const_['2'],   CALL.vimul),
						BINOP.mul(mod, [extracts[1], 3], const_['2.4'], CALL.vfmul),

						BINOP.add(mod, [extracts[2], 4], const_['2'],   CALL.viadd),
						BINOP.add(mod, [extracts[3], 5], const_['2.4'], CALL.vfadd),

						CALL.vlt(mod, extracts[4], const_['2']),
						CALL.vlt(mod, extracts[5], const_['2.4']),

						CALL.veq(mod, extracts[6], const_['2']),
						CALL.veq(mod, extracts[7], const_['2']),
						CALL.veq(mod, extracts[8], const_['2.4']),
						CALL.veq(mod, extracts[9], const_['2.4']),
					].map((expected) => mod.drop(expected)),
				);
			});
			test.test('multiple unions.', () => {
				const {stmts, mod} = setupScript(`{
					val mut x: int | float = 42;
					val mut y: int | float = 4.2;
					x == y;
				}`);
				const extracts: readonly (readonly binaryen.ExpressionRef[])[] = stmts.slice(2).map((stmt) => {
					const binexp = (stmt as AST.StatementExpression).expr as AST.OperationBinary;
					return [
						binexp.operand0.build(),
						binexp.operand1.build(),
					];
				});
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						CALL.veq(mod, extracts[0][0], extracts[0][1]),
					].map((expected) => mod.drop(expected)),
				);
			});
			test.test('multiple operations.', () => {
				const {goal, stmts, mod} = setupScript(`{
					val mut x: int   = 42;
					val mut y: float = 4.2;
					x + 2 + 3;
					2.0 + y + 3.0;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = [
					(((stmts[2] as AST.StatementExpression).expr as AST.OperationBinary).operand0 as AST.OperationBinary).operand0.build(),
					(((stmts[3] as AST.StatementExpression).expr as AST.OperationBinary).operand0 as AST.OperationBinary).operand1.build(),
				];
				const const_ = {
					'2':   buildConst(goal.builder, 2n),
					'3':   buildConst(goal.builder, 3n),
					'2.0': buildConst(goal.builder, 2.0),
					'3.0': buildConst(goal.builder, 3.0),
				} as const;
				const inners: readonly binaryen.ExpressionRef[] = [
					BINOP.add(mod, [extracts[0], 2], const_['2'], CALL.viadd),
					CALL.vfadd(mod, const_['2.0'],    extracts[1]),
				];
				assertEqualBins(
					stmts.slice(2).map((stmt) => (
						((stmt as AST.StatementExpression).expr as AST.OperationBinary).operand0.build()
					)),
					inners,
				);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					inners.map((inner, i) => mod.drop([
						BINOP.add(mod, [inner, 3], const_['3'],   CALL.viadd),
						BINOP.add(mod, [inner, 4], const_['3.0'], CALL.vfadd),
					][i])),
				);
			});
		});
	});



	test.suite('OperationBinaryArithmetic', () => {
		test.suite('#type', () => {
			test.suite('with constant folding on.', () => {
				test.test('returns a constant Integer type for any operation of integers.', () => {
					assertEqualTypes(AST.OperationBinaryArithmetic.fromSource('7 * 3 * 2').type(), typeUnit(7n * 3n * 2n));
				});
				test.test('returns a constant Natural type for any operation of naturals.', () => {
					assertEqualTypes(AST.OperationBinaryArithmetic.fromSource('+7 * +3 * +2').type(), typeUnit(7n * 3n * 2n, 'nat'));
				});
				test.test('returns a constant Float type for any operation of floats.', () => {
					assertEqualTypes(AST.OperationBinaryArithmetic.fromSource('7.1 * 3.1 * 2.1').type(), typeUnit(7.1 * 3.1 * 2.1));
				});
				test.test('[operator=SUB] caps at `+0` for subtraction of naturals.', () => {
					assertEqualTypes(AST.OperationBinaryArithmetic.fromSource('+5 - +9').type(), typeUnit(0n, 'nat'));
				});
			});
			test.test('throws for any operation of mix of numeric types.', () => {
				assert.throws(() => AST.OperationBinaryArithmetic.fromSource('+3 * 2')      .type(), TypeErrorInvalidOperation);
				assert.throws(() => AST.OperationBinaryArithmetic.fromSource('+3 * 2.7')    .type(), TypeErrorInvalidOperation);
				assert.throws(() => AST.OperationBinaryArithmetic.fromSource('3 * 2.7')     .type(), TypeErrorInvalidOperation);
				assert.throws(() => AST.OperationBinaryArithmetic.fromSource('7 * 3.0 * 2') .type(), TypeErrorInvalidOperation);
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
					assert.throws(() => AST.OperationBinaryArithmetic.fromSource(src).type(), TypeErrorInvalidOperation);
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
				].map((src) => AST.OperationBinaryArithmetic.fromSource(src).fold()), [
					new VALUE.Integer(-(2n ** 62n)),
					new VALUE.Integer(2n ** 62n),
					new VALUE.Integer((42n ** 2n * 420n) % (2n ** 64n)),
				]);
			});
			test.test('overflows naturals properly.', () => {
				assert.deepStrictEqual(
					AST.OperationBinaryArithmetic.fromSource('+2 ^ +63  +  +2 ^ +62  +  +2 ^ +63').fold(),
					new VALUE.Natural(2n ** 63n + 2n ** 62n + 2n ** 63n),
				);
			});
			test.test('does not underflow naturals.', () => {
				assert.deepStrictEqual(AST.OperationBinaryArithmetic.fromSource('+5 - +9').fold(), VALUE.NAT_0);
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
				const exprs:     readonly AST.Expression[] = stmts.slice(2).map((stmt) => ((stmt as AST.StatementExpression).expr!));
				const expecteds: readonly (VALUE.Value | null)[]  = exprs.slice(0, 3).map((op) => (op as AST.OperationBinaryArithmetic).operand0.fold());
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
				assert.throws(() => AST.OperationBinaryArithmetic.fromSource('42 / 0')     .fold(), NanErrorDivZero);
				assert.throws(() => AST.OperationBinaryArithmetic.fromSource('-4.0 ^ -0.5').fold(), NanErrorInvalid);
			});
		});


		test.suite('#build', () => {
			test.test('calls the correct WASM function.', () => {
				buildOperations(new Map([
					['42 + 420', (builder, get_op0) => BINOP.add(builder.module, [get_op0, 1], buildConst(builder, 420n), CALL.viadd)],

					[' 126 /  3', (builder, get_op0) => CALL.vidiv_s(builder.module, get_op0, buildConst(builder,  3n))],
					['-126 /  3', (builder, get_op0) => CALL.vidiv_s(builder.module, get_op0, buildConst(builder,  3n))],
					[' 126 / -3', (builder, get_op0) => CALL.vidiv_s(builder.module, get_op0, buildConst(builder, -3n))],
					['-126 / -3', (builder, get_op0) => CALL.vidiv_s(builder.module, get_op0, buildConst(builder, -3n))],
					[' 200 /  3', (builder, get_op0) => CALL.vidiv_s(builder.module, get_op0, buildConst(builder,  3n))],
					[' 200 / -3', (builder, get_op0) => CALL.vidiv_s(builder.module, get_op0, buildConst(builder, -3n))],
					['-200 /  3', (builder, get_op0) => CALL.vidiv_s(builder.module, get_op0, buildConst(builder,  3n))],
					['-200 / -3', (builder, get_op0) => CALL.vidiv_s(builder.module, get_op0, buildConst(builder, -3n))],

					['+126 / +3', (builder, get_op0) => CALL.vidiv_u(builder.module, get_op0, buildConst(builder, 3n, 'nat'))],
					['+200 / +3', (builder, get_op0) => CALL.vidiv_u(builder.module, get_op0, buildConst(builder, 3n, 'nat'))],

					[' 126.1 /  3.1', (builder, get_op0) => CALL.vfdiv(builder.module, get_op0, buildConst(builder,  3.1))],
					['-126.1 /  3.1', (builder, get_op0) => CALL.vfdiv(builder.module, get_op0, buildConst(builder,  3.1))],
					[' 126.1 / -3.1', (builder, get_op0) => CALL.vfdiv(builder.module, get_op0, buildConst(builder, -3.1))],
					['-126.1 / -3.1', (builder, get_op0) => CALL.vfdiv(builder.module, get_op0, buildConst(builder, -3.1))],
					[' 200.1 /  3.1', (builder, get_op0) => CALL.vfdiv(builder.module, get_op0, buildConst(builder,  3.1))],
					[' 200.1 / -3.1', (builder, get_op0) => CALL.vfdiv(builder.module, get_op0, buildConst(builder, -3.1))],
					['-200.1 /  3.1', (builder, get_op0) => CALL.vfdiv(builder.module, get_op0, buildConst(builder,  3.1))],
					['-200.1 / -3.1', (builder, get_op0) => CALL.vfdiv(builder.module, get_op0, buildConst(builder, -3.1))],

					['42  - 420',  (builder, get_op0) => CALL.visub_s(builder.module, get_op0, buildConst(builder, 420n))],
					['+42 - +420', (builder, get_op0) => CALL.visub_u(builder.module, get_op0, buildConst(builder, 420n, 'nat'))],
					['4.2 - 42.0', (builder, get_op0) => CALL.vfsub  (builder.module, get_op0, buildConst(builder, 42.0))],
				]));
			});
			test.test('does not compile the first operand if it is foldable and an identity element.', () => {
				const {stmts, mod} = setupScript(`{
					val mut x: int   = 42;
					val mut y: float = 4.2;

					1 * x;
					0.0 + y;
				}`);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					stmts.slice(2).map((stmt) => (mod.drop(((stmt as AST.StatementExpression).expr as AST.OperationBinary).operand1.build()))),
				);
			});
		});
	});



	test.suite('OperationBinaryComparative', () => {
		test.test.todo('OperationUnary[operator=IS]', () => {
			assert.ok('TODO:');
		});
		test.suite('#type', () => {
			test.test('with folding on, returns a constant value.', () => {
				typeOperations(new Map<string, VALUE.Boolean>([
					['2   <  3',   VALUE.TRUE],
					['2   >  3',   VALUE.FALSE],
					['2   <= 3',   VALUE.TRUE],
					['2   >= 3',   VALUE.FALSE],
					['2   !< 3',   VALUE.FALSE],
					['2   !> 3',   VALUE.TRUE],
					['2.0 <  3',   VALUE.TRUE],
					['2.0 >  3',   VALUE.FALSE],
					['2.0 <= 3',   VALUE.TRUE],
					['2.0 >= 3',   VALUE.FALSE],
					['2.0 !< 3',   VALUE.FALSE],
					['2.0 !> 3',   VALUE.TRUE],
					['2   <  3.0', VALUE.TRUE],
					['2   >  3.0', VALUE.FALSE],
					['2   <= 3.0', VALUE.TRUE],
					['2   >= 3.0', VALUE.FALSE],
					['2   !< 3.0', VALUE.FALSE],
					['2   !> 3.0', VALUE.TRUE],
				]));
			});
			test.test('throws for comparative operation of non-numbers.', () => {
				assert.throws(() => AST.OperationBinaryComparative.fromSource('7.0 <= null').type(), TypeErrorInvalidOperation);
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


		test.suite('#build', () => {
			test.test('returns the correct operation.', () => {
				buildOperations(new Map([
					['3   <  3',   (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 3n))],
					['3   >  3',   (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 3n))],
					['3   <= 3',   (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 3n))],
					['3   >= 3',   (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 3n))],
					['+3  <  +3',  (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 3n, 'nat'))],
					['+3  >  +3',  (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 3n, 'nat'))],
					['+3  <= +3',  (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 3n, 'nat'))],
					['+3  >= +3',  (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 3n, 'nat'))],
					['5.2 <  9.2', (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 9.2))],
					['5.2 >  9.2', (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 9.2))],
					['5.2 <= 9.2', (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 9.2))],
					['5.2 >= 9.2', (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 9.2))],
					['5   <  +9',  (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 9n, 'nat'))],
					['5   >  +9',  (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 9n, 'nat'))],
					['5   <= +9',  (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 9n, 'nat'))],
					['5   >= +9',  (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 9n, 'nat'))],
					['+5  <  9',   (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 9n))],
					['+5  >  9',   (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 9n))],
					['+5  <= 9',   (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 9n))],
					['+5  >= 9',   (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 9n))],
					['5   <  9.2', (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 9.2))],
					['5   >  9.2', (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 9.2))],
					['5   <= 9.2', (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 9.2))],
					['5   >= 9.2', (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 9.2))],
					['5.2 <  3',   (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 3n))],
					['5.2 >  3',   (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 3n))],
					['5.2 <= 3',   (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 3n))],
					['5.2 >= 3',   (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 3n))],
					['5.2 <  +9',  (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 9n, 'nat'))],
					['5.2 >  +9',  (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 9n, 'nat'))],
					['5.2 <= +9',  (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 9n, 'nat'))],
					['5.2 >= +9',  (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 9n, 'nat'))],
					['+5  <  9.2', (builder, get_op0) => CALL.vlt(builder.module, get_op0, buildConst(builder, 9.2))],
					['+5  >  9.2', (builder, get_op0) => CALL.vgt(builder.module, get_op0, buildConst(builder, 9.2))],
					['+5  <= 9.2', (builder, get_op0) => CALL.vle(builder.module, get_op0, buildConst(builder, 9.2))],
					['+5  >= 9.2', (builder, get_op0) => CALL.vge(builder.module, get_op0, buildConst(builder, 9.2))],
				]));
			});
		});
	});



	test.suite('OperationBinaryEquality', () => {
		test.suite('#type', () => {
			test.suite('with folding on.', () => {
				test.test('for numeric literals.', () => {
					typeOperations(new Map<string, VALUE.Boolean>([
						['0   === -0',   VALUE.TRUE],
						['0.0 === -0.0', VALUE.FALSE],
						['0   === 0.0',  VALUE.FALSE],
						['0   === -0.0', VALUE.FALSE],
						['-0  === 0.0',  VALUE.FALSE],
						['-0  === -0.0', VALUE.FALSE],
						['3   === 3.0',  VALUE.FALSE],

						['0   == -0',   VALUE.TRUE],
						['0.0 == -0.0', VALUE.TRUE],
						['0   == 0.0',  VALUE.TRUE],
						['0   == -0.0', VALUE.TRUE],
						['-0  == 0.0',  VALUE.TRUE],
						['-0  == -0.0', VALUE.TRUE],
						['3   == 3.0',  VALUE.TRUE],
					]));
				});
				test.test('returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
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
					}`, {build: false}).stmts.slice(4).forEach((stmt) => {
						const expr: AST.OperationBinaryEquality = (stmt as AST.StatementExpression).expr as AST.OperationBinaryEquality;
						const fold: VALUE.Value | null = expr.fold();
						assert_instanceof(fold, VALUE.Boolean);
						assertEqualTypes(
							expr.type(),
							new TYPE.Unit<VALUE.Boolean>(fold),
						);
					});
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
					assert.strictEqual((stmt as AST.StatementExpression).expr!.fold(), VALUE.TRUE, stmt.source);
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


		test.suite('#build', () => {
			function drop_then_false(mod: binaryen.Module, expr1: binaryen.ExpressionRef, expr2: binaryen.ExpressionRef): binaryen.ExpressionRef {
				return drop_then(mod, [expr1, expr2], false);
			}

			test.suite('identity (`===`).', () => {
				test.test('optimizes by evaluating operand types.', () => {
					buildOperations(new Map([
						['42  === 420',  (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 420n))],
						['4.2 === 42.0', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 42.0))],

						['42  === 4.2', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 4.2))],
						['4.2 === 42',  (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 42n))],

						['null === 0',   (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0n))],
						['null === 0.0', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0.0))],

						['null  === false', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, false))],
						['null  === true',  (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, true))],
						['false === true',  (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, true))],

						['false === 0',   (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0n))],
						['false === 0.0', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0.0))],

						['true === 1',   (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 1n))],
						['true === 1.0', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 1.0))],

						['@a === null',   (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder))],
						['@a === false',  (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, false))],
						['@a === \\x100', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0x100n))],
						['@a === @b',     (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, Symbol(0x101)))],
					]));
				});
				test.test('calls `vid` when operands are same numeric type.', () => {
					const {stmts, mod} = setupScript(`{
						val mut i1: int   = 42;
						val mut i2: int   = 420;
						val mut f1: float = 4.2;
						val mut f2: float = 42.0;
						i1 === i2;
						f1 === f2;
					}`);
					return assertEqualBins(new Map(stmts.slice(4).map((stmt, i) => [
						(stmt as AST.StatementExpression).expr!.build(),
						CALL.vid(
							mod,
							mod.local.get(2 * i,     binaryen.v128),
							mod.local.get(2 * i + 1, binaryen.v128),
						),
					])));
				});
				test.test('calls `vid` when operands are same primitive type.', () => {
					buildOperations(new Map([
						['@a === @a', (builder, get_op0) => CALL.vid(builder.module, get_op0, buildConst(builder, Symbol(0x100)))],
					]));
				});
			});

			test.suite('equality (`==`).', () => {
				test.test('optimizes by evaluating operand types, ignoring numeric types.', () => {
					buildOperations(new Map([
						['null == 0',   (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0n))],
						['null == 0.0', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0.0))],

						['null  == false', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, false))],
						['null  == true',  (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, true))],
						['false == true',  (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, true))],

						['false == 0',   (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0n))],
						['false == 0.0', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0.0))],

						['true == 1',   (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 1n))],
						['true == 1.0', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 1.0))],

						['@a == null',   (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder))],
						['@a == false',  (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, false))],
						['@a == \\x100', (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, 0x100n))],
						['@a == @b',     (builder, get_op0) => drop_then_false(builder.module, get_op0, buildConst(builder, Symbol(0x101)))],
					]));
				});
				test.test('calls `veq` when operands are numeric types.', () => {
					buildOperations(new Map([
						['42  == 420',  (builder, get_op0) => CALL.veq(builder.module, get_op0, buildConst(builder, 420n))],
						['42  == 4.2',  (builder, get_op0) => CALL.veq(builder.module, get_op0, buildConst(builder, 4.2))],
						['4.2 == 42',   (builder, get_op0) => CALL.veq(builder.module, get_op0, buildConst(builder, 42n))],
						['4.2 == 42.0', (builder, get_op0) => CALL.veq(builder.module, get_op0, buildConst(builder, 42.0))],
					]));
					const {stmts, mod} = setupScript(`{
						val mut i1: int   = 42;
						val mut i2: int   = 420;
						val mut f1: float = 4.2;
						val mut f2: float = 42.0;
						i1 == i2;
						f1 == f2;
					}`);
					return assertEqualBins(new Map(stmts.slice(4).map((stmt, i) => [
						(stmt as AST.StatementExpression).expr!.build(),
						CALL.veq(
							mod,
							mod.local.get(2 * i,     binaryen.v128),
							mod.local.get(2 * i + 1, binaryen.v128),
						),
					])));
				});
				test.test('calls `veq` when operands are same primitive type.', () => {
					buildOperations(new Map([
						['@a == @a', (builder, get_op0) => CALL.veq(builder.module, get_op0, buildConst(builder, Symbol(0x100)))],
					]));
				});
			});
		});
	});



	test.suite('OperationBinaryLogical', () => {
		test.suite('#type', () => {
			test.test('with constant folding on.', () => {
				typeOperations(new Map<string, VALUE.Primitive>([
					['null     && false',    VALUE.NULL],
					['false    && null',     VALUE.FALSE],
					['true     && null',     VALUE.NULL],
					['@nothing && @x',       new VALUE.Symbol(0x100n, 'x')],
					['@x       && @nothing', VALUE.SYM_NOTHING],
					['@nothing || @y',       VALUE.SYM_NOTHING],
					['@y       || @nothing', new VALUE.Symbol(0x100n, 'y')],
					['@z       && false',    VALUE.FALSE],
					['true     && @z',       new VALUE.Symbol(0x100n, 'z')],
					['false    && 42',       VALUE.FALSE],
					['4.2      && true',     VALUE.TRUE],
					['null     || false',    VALUE.FALSE],
					['false    || null',     VALUE.NULL],
					['true     || null',     VALUE.TRUE],
					['false    || 42',       new VALUE.Integer(42n)],
					['4.2      || true',     new VALUE.Float(4.2)],
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


		test.suite('#build', () => {
			test.test('optimizes by evaluating left operand type.', () => {
				buildOperations(new Map([
					['42 && 420',        (builder, get_op0) => drop_then(builder.module, [get_op0], buildConst(builder, 420n))],
					['4.2 || -420',      (_,       get_op0) => get_op0],
					['null && 201.0e-1', (_,       get_op0) => get_op0],
					['false || null',    (builder, get_op0) => drop_then(builder.module, [get_op0], buildConst(builder))],
					['true && 201.0e-1', (builder, get_op0) => drop_then(builder.module, [get_op0], buildConst(builder, 20.1))],
				]));
				const {goal, stmts, mod} = setupScript(`{
					val mut a: int  = 1;
					val mut c: int  = 3;
					val mut n: null = null;

					a && 2 || 3 && 4;
					n && 2 || c && null;

					(a || 2)    && (c || 4);
					(a || null) && (n || 4);
				}`);
				return assertEqualBins(
					stmts.slice(3).map((stmt) => (stmt as AST.StatementExpression).expr!.build()),
					[
						drop_then(
							mod,
							[mod.local.get(0, binaryen.v128)],
							buildConst(goal.builder, 2n),
						),
						drop_then(
							mod,
							[mod.local.get(2, binaryen.v128)],
							drop_then(
								mod,
								[mod.local.get(1, binaryen.v128)],
								buildConst(goal.builder),
							),
						),
						drop_then(
							mod,
							[mod.local.get(0, binaryen.v128)],
							mod.local.get(1, binaryen.v128),
						),
						drop_then(
							mod,
							[mod.local.get(0, binaryen.v128)],
							drop_then(
								mod,
								[mod.local.get(2, binaryen.v128)],
								buildConst(goal.builder, 4n),
							),
						),
					],
				);
			});

			test.test('returns a special case of `(if)`.', () => {
				const {stmts, mod} = setupScript(`{
					val mut a: anything = 42;
					val mut b: anything = 4.2;
					val mut c: anything = null;
					val mut d: anything = false;
					val mut e: anything = true;

					a && 420;
					b || -420;
					c && 201.0e-1;
					d || null;
					e && 201.0e-1;
				}`);
				const extracts: readonly (readonly binaryen.ExpressionRef[])[] = stmts.slice(5).map((stmt) => {
					const binexp = (stmt as AST.StatementExpression).expr as AST.OperationBinary;
					return [
						binexp.operand0.build(),
						binexp.operand1.build(),
					];
				});
				return assertEqualBins(
					stmts.slice(5).map((stmt) => stmt.build()),
					[
						BINOP.and(
							mod,
							[extracts[0][0], 5],
							extracts[0][1],
						),
						BINOP.or(
							mod,
							[extracts[1][0], 6],
							extracts[1][1],
						),
						BINOP.and(
							mod,
							[extracts[2][0], 7],
							extracts[2][1],
						),
						BINOP.or(
							mod,
							[extracts[3][0], 8],
							extracts[3][1],
						),
						BINOP.and(
							mod,
							[extracts[4][0], 9],
							extracts[4][1],
						),
					].map((expected) => mod.drop(expected)),
				);
			});

			test.test('counts internal variables correctly.', () => {
				const {stmts, mod} = setupScript(`{
					val mut a: anything = 1;
					val mut b: anything = 2;
					val mut c: anything = 3;
					val mut d: anything = 4;

					a && b || c && d;
					(a || b) && (c || d);
				}`);
				const extracts: readonly (readonly (readonly binaryen.ExpressionRef[])[])[] = stmts.slice(4).map((stmt) => {
					const binexp = (stmt as AST.StatementExpression).expr as AST.OperationBinary;
					const outer0 = binexp.operand0 as AST.OperationBinary;
					const outer1 = binexp.operand1 as AST.OperationBinary;
					return [
						[outer0.operand0.build(), outer0.operand1.build()],
						[outer1.operand0.build(), outer1.operand1.build()],
					];
				});
				return assertEqualBins(
					stmts.slice(4).map((stmt) => stmt.build()),
					[
						BINOP.or(
							mod,
							[BINOP.and(
								mod,
								[extracts[0][0][0], 4],
								extracts[0][0][1],
							), 6],
							BINOP.and(
								mod,
								[extracts[0][1][0], 5],
								extracts[0][1][1],
							),
						),
						BINOP.and(
							mod,
							[BINOP.or(
								mod,
								[extracts[1][0][0], 7],
								extracts[1][0][1],
							), 9],
							BINOP.or(
								mod,
								[extracts[1][1][0], 8],
								extracts[1][1][1],
							),
						),
					].map((expected) => mod.drop(expected)),
				);
			});
		});
	});



	test.suite('OperationTernary', () => {
		test.suite('#type', () => {
			test.suite('with constant folding on.', () => {
				test.test('computes type for for conditionals.', () => {
					typeOperations(new Map<string, VALUE.Primitive>([
						['if true then false else 2',          VALUE.FALSE],
						['if false then 3.0 else null',        VALUE.NULL],
						['if true then 2 else 3.0',            new VALUE.Integer(2n)],
						['if false then 2 + 3 else 1.0 * 2.0', new VALUE.Float(2.0)],
					]));
				});
			});
			test.test('returns `nothing` when condition is `nothing`.', () => {
				const ternary: AST.OperationTernary = AST.OperationTernary.fromSource('if n as <nothing> then true else false');
				ternary.validator.addSymbol(new SymbolSchemaVar((ternary.operand0 as AST.Claim).operand as AST.Variable, false, false));
				return assert.ok(ternary.type().isBottomType);
			});
			test.test('throws when condition is not a subtype of `boolean`.', () => {
				assert.throws(() => AST.OperationTernary.fromSource('if 2 then true else false').type(), TypeErrorInvalidOperation);
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


		test.suite('#build', () => {
			test.test('optimizes by evaluating condition operand type.', () => {
				const {goal, stmts, mod} = setupScript(`{
					val mut tr: true  = true;
					val mut fa: false = false;

					if tr then false else 2;
					if tr then 2     else 3.0;
					if fa then 3.0   else null;
				}`);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => (stmt as AST.StatementExpression).expr!.build()),
					[
						drop_then(mod, [mod.local.get(0, binaryen.v128)], buildConst(goal.builder, false)),
						drop_then(mod, [mod.local.get(0, binaryen.v128)], buildConst(goal.builder, 2n)),
						drop_then(mod, [mod.local.get(1, binaryen.v128)], buildConst(goal.builder)),
					],
				);
			});
			test.test('returns `(if)`.', () => {
				const {stmts, mod} = setupScript(`{
					val mut a: bool = true;
					val mut b: bool = false;

					if a then 1 else 2;
					if b then 3 else 4;
				}`);
				const extracts: readonly (readonly binaryen.ExpressionRef[])[] = stmts.slice(2).map((stmt) => {
					const terexp = (stmt as AST.StatementExpression).expr as AST.OperationTernary;
					return [
						terexp.operand0.build(),
						terexp.operand1.build(),
						terexp.operand2.build(),
					];
				});
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						mod.if(new BinVect(mod, extracts[0][0]).isSpecial(true), extracts[0][1], extracts[0][2]),
						mod.if(new BinVect(mod, extracts[1][0]).isSpecial(true), extracts[1][1], extracts[1][2]),
					].map((expected) => mod.drop(expected)),
				);
			});
		});
	});
});
