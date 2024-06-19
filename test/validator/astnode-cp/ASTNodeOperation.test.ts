import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	OBJ,
	TYPE,
	Builder,
	BinVect,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {
	assertEqualTypes,
	assertEqualBins,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	CONFIG_COERCION_OFF,
	CONFIG_FOLDING_COERCION_OFF,
	typeUnitInt,
	typeUnitFloat,
	typeUnitStr,
	buildConst,
} from '../../helpers.js';



function typeOperations(tests: ReadonlyMap<string, OBJ.Primitive>, config: CPConfig = CONFIG_DEFAULT): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).type()),
		[...tests.values()].map((expected) => new TYPE.TypeUnit(expected)),
	);
}
function foldOperations(tests: Map<string, OBJ.Object>, config: CPConfig = CONFIG_DEFAULT): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).fold()),
		[...tests.values()],
	);
}
function buildOperations(tests: ReadonlyMap<string, binaryen.ExpressionRef>, config: CPConfig = CONFIG_FOLDING_OFF): void {
	return assertEqualBins(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).build()),
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

	const CALL = {
		vnot: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot', [arg], binaryen.v128),
		vemp: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp', [arg], binaryen.v128),
		vneg: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg', [arg], binaryen.v128),

		vexp: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vexp', [arg0, arg1], binaryen.v128),
		vmul: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vmul', [arg0, arg1], binaryen.v128),
		vdiv: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vdiv', [arg0, arg1], binaryen.v128),
		vadd: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vadd', [arg0, arg1], binaryen.v128),
		vlt:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt',  [arg0, arg1], binaryen.v128),
		vgt:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt',  [arg0, arg1], binaryen.v128),
		vle:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle',  [arg0, arg1], binaryen.v128),
		vge:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge',  [arg0, arg1], binaryen.v128),
		vid:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid',  [arg0, arg1], binaryen.v128),
		veq:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq',  [arg0, arg1], binaryen.v128),
		veqq: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veqq', [arg0, arg1], binaryen.v128),
	} as const;




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



	describe('#build', () => {
		it('compound expression.', () => {
			const bldr = new Builder();
			const mod = new binaryen.Module();
			return buildOperations(new Map([
				['42 ^ 2 * 420;', CALL.vmul(
					mod,
					CALL.vexp(mod, buildConst(bldr, 42n), buildConst(bldr, 2n)),
					buildConst(bldr, 420n),
				)],
				['2 * 3.0 + 5;', CALL.vadd(
					mod,
					CALL.vmul(mod, buildConst(bldr, 2n), buildConst(bldr, 3.0)),
					buildConst(bldr, 5n),
				)],
			]));
		});
	});



	describe('ASTNodeOperationUnary', () => {
		describe('#type', () => {
			context('with constant folding on.', () => {
				it('returns a constant Boolean type for boolean unary operation of anything.', () => {
					typeOperations(new Map<string, OBJ.Boolean>([
						['!false;',  OBJ.Boolean.TRUE],
						['!true;',   OBJ.Boolean.FALSE],
						['!null;',   OBJ.Boolean.TRUE],
						['!42;',     OBJ.Boolean.FALSE],
						['!4.2e+1;', OBJ.Boolean.FALSE],
						['?false;',  OBJ.Boolean.TRUE],
						['?true;',   OBJ.Boolean.FALSE],
						['?null;',   OBJ.Boolean.TRUE],
						['?42;',     OBJ.Boolean.FALSE],
						['?4.2e+1;', OBJ.Boolean.FALSE],

						['![];',         OBJ.Boolean.FALSE],
						['![42];',       OBJ.Boolean.FALSE],
						['![a= 42];',    OBJ.Boolean.FALSE],
						['!{};',         OBJ.Boolean.FALSE],
						['!{42};',       OBJ.Boolean.FALSE],
						['!{41 -> 42};', OBJ.Boolean.FALSE],
						['?[];',         OBJ.Boolean.TRUE],
						['?[42];',       OBJ.Boolean.FALSE],
						['?[a= 42];',    OBJ.Boolean.FALSE],
						['?{};',         OBJ.Boolean.TRUE],
						['?{42};',       OBJ.Boolean.FALSE],
						['?{41 -> 42};', OBJ.Boolean.FALSE],
					]));
				});
			});

			context('with constant folding off.', () => {
				describe('[operator=NOT]', () => {
					it('returns type `true` for a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: null = null;
							let var b: null | false = null;
							let var c: null | void = null;
							!a;
							!b;
							!c;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(3).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), OBJ.Boolean.TRUETYPE);
						});
					});
					it('returns type `bool` for a supertype of `void` or a supertype of `null` or a supertype of `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: null | int = null;
							let var b: null | int = 42;
							let var c: bool = false;
							let var d: bool | float = 4.2;
							let var e: str | void = "hello";
							!a;
							!b;
							!c;
							!d;
							!e;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(5).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), TYPE.BOOL);
						});
					});
					it('returns type `false` for any type not a supertype of `null` or `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: int = 42;
							let var b: float = 4.2;
							!a;
							!b;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(2).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), OBJ.Boolean.FALSETYPE);
						});
					});
					it('[literalCollection] returns type `false` for any type not a supertype of `null` or `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							![];
							![42];
							![a= 42];
							!{41 -> 42};
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), OBJ.Boolean.FALSETYPE);
						});
					});
				});
				describe('[operator=EMP]', () => {
					it('always returns type `bool`.', () => {
						[
							'?false;',
							'?true;',
							'?null;',
							'?42;',
							'?4.2e+1;',

							'?[];',
							'?[42];',
							'?[a= 42];',
							'?{41 -> 42};',
						].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).type()).forEach((typ) => {
							assert.deepStrictEqual(typ, TYPE.BOOL);
						});
					});
				});
			});
		});


		describe('#fold', () => {
			specify('[operator=NOT]', () => {
				foldOperations(new Map([
					['!false;',               OBJ.Boolean.TRUE],
					['!true;',                OBJ.Boolean.FALSE],
					['!null;',                OBJ.Boolean.TRUE],
					['!0;',                   OBJ.Boolean.FALSE],
					['!42;',                  OBJ.Boolean.FALSE],
					['!0.0;',                 OBJ.Boolean.FALSE],
					['!-0.0;',                OBJ.Boolean.FALSE],
					['!4.2e+1;',              OBJ.Boolean.FALSE],
					['!"";',                  OBJ.Boolean.FALSE],
					['!"hello";',             OBJ.Boolean.FALSE],
					['![];',                  OBJ.Boolean.FALSE],
					['![42];',                OBJ.Boolean.FALSE],
					['![a= 42];',             OBJ.Boolean.FALSE],
					['!List.<int>([]);',      OBJ.Boolean.FALSE],
					['!List.<int>([42]);',    OBJ.Boolean.FALSE],
					['!Dict.<int>([a= 42]);', OBJ.Boolean.FALSE],
					['!{};',                  OBJ.Boolean.FALSE],
					['!{42};',                OBJ.Boolean.FALSE],
					['!{41 -> 42};',          OBJ.Boolean.FALSE],
				]));
			});
			specify('[operator=EMP]', () => {
				foldOperations(new Map([
					['?false;',               OBJ.Boolean.TRUE],
					['?true;',                OBJ.Boolean.FALSE],
					['?null;',                OBJ.Boolean.TRUE],
					['?0;',                   OBJ.Boolean.TRUE],
					['?42;',                  OBJ.Boolean.FALSE],
					['?0.0;',                 OBJ.Boolean.TRUE],
					['?-0.0;',                OBJ.Boolean.TRUE],
					['?4.2e+1;',              OBJ.Boolean.FALSE],
					['?"";',                  OBJ.Boolean.TRUE],
					['?"hello";',             OBJ.Boolean.FALSE],
					['?[];',                  OBJ.Boolean.TRUE],
					['?[42];',                OBJ.Boolean.FALSE],
					['?[a= 42];',             OBJ.Boolean.FALSE],
					['?List.<int>([]);',      OBJ.Boolean.TRUE],
					['?List.<int>([42]);',    OBJ.Boolean.FALSE],
					['?Dict.<int>([a= 42]);', OBJ.Boolean.FALSE],
					['?{};',                  OBJ.Boolean.TRUE],
					['?{42};',                OBJ.Boolean.FALSE],
					['?{41 -> 42};',          OBJ.Boolean.FALSE],
				]));
			});
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['!null;',  CALL.vnot(mod, buildConst(bldr))],
					['!false;', CALL.vnot(mod, buildConst(bldr, false))],
					['!true;',  CALL.vnot(mod, buildConst(bldr, true))],
					['!42;',    CALL.vnot(mod, buildConst(bldr, 42n))],
					['!4.2;',   CALL.vnot(mod, buildConst(bldr, 4.2))],
					['?null;',  CALL.vemp(mod, buildConst(bldr))],
					['?false;', CALL.vemp(mod, buildConst(bldr, false))],
					['?true;',  CALL.vemp(mod, buildConst(bldr, true))],
					['?42;',    CALL.vemp(mod, buildConst(bldr, 42n))],
					['?4.2;',   CALL.vemp(mod, buildConst(bldr, 4.2))],
					['-(4);',   CALL.vneg(mod, buildConst(bldr, 4n))],
					['-(4.2);', CALL.vneg(mod, buildConst(bldr, 4.2))],
				]));
			});
			it('works with vects.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let var x: int | float = 42;
					let var y: int | float = 4.2;

					!x;
					!y;

					?x;
					?y;

					-x;
					-y;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const extracts: readonly binaryen.ExpressionRef[] = goal.children.slice(2).map((stmt) => (
					((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand.build()
				));
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build()),
					[
						CALL.vnot(goal.builder.module, extracts[0]),
						CALL.vnot(goal.builder.module, extracts[1]),
						CALL.vemp(goal.builder.module, extracts[2]),
						CALL.vemp(goal.builder.module, extracts[3]),
						CALL.vneg(goal.builder.module, extracts[4]),
						CALL.vneg(goal.builder.module, extracts[5]),
					].map((expected) => goal.builder.module.drop(expected)),
				);
			});
			it('multiple operations.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let var x: int | float = 42;
					let var y: int | float = 4.2;

					!!x;
					??y;

					!-x;
					?-y;

					--x;
					--y;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const extracts: readonly binaryen.ExpressionRef[] = goal.children.slice(2).map((stmt) => (
					(((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand as AST.ASTNodeOperationUnary).operand.build()
				));
				assertEqualBins(
					goal.children.slice(4).map((stmt) => (
						((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand.build()
					)),
					extracts.slice(2).map((extract) => CALL.vneg(goal.builder.module, extract)),
				);
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build()),
					[
						CALL.vnot(goal.builder.module, CALL.vnot(goal.builder.module, extracts[0])),
						CALL.vemp(goal.builder.module, CALL.vemp(goal.builder.module, extracts[1])),
						CALL.vnot(goal.builder.module, CALL.vneg(goal.builder.module, extracts[2])),
						CALL.vemp(goal.builder.module, CALL.vneg(goal.builder.module, extracts[3])),
						CALL.vneg(goal.builder.module, CALL.vneg(goal.builder.module, extracts[4])),
						CALL.vneg(goal.builder.module, CALL.vneg(goal.builder.module, extracts[5])),
					].map((expected) => goal.builder.module.drop(expected)),
				);
			});
		});
	});



	describe('ASTNodeOperationBinary', () => {
		describe('#build', () => {
			it('works with vects.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let var x: int | float = 42;
					let var y: int | float = 4.2;

					x * 2;
					y * 2;
					x * 2.4;
					y * 2.4;

					x < 2;
					y < 2;
					x < 2.4;
					y < 2.4;

					x == 2;
					y == 2;
					x == 2.4;
					y == 2.4;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const extracts: readonly binaryen.ExpressionRef[] = goal.children.slice(2).map((stmt) => (
					((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0.build()
				));
				/* eslint-disable quote-props */
				const const_ = {
					'2':   buildConst(goal.builder, 2n),
					'2.4': buildConst(goal.builder, 2.4),
				} as const;
				/* eslint-enable quote-props */
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build()),
					[
						CALL.vmul(goal.builder.module, extracts[0], const_['2']),
						CALL.vmul(goal.builder.module, extracts[1], const_['2']),
						CALL.vmul(goal.builder.module, extracts[2], const_['2.4']),
						CALL.vmul(goal.builder.module, extracts[3], const_['2.4']),

						CALL.vlt(goal.builder.module, extracts[4], const_['2']),
						CALL.vlt(goal.builder.module, extracts[5], const_['2']),
						CALL.vlt(goal.builder.module, extracts[6], const_['2.4']),
						CALL.vlt(goal.builder.module, extracts[7], const_['2.4']),

						CALL.veq(goal.builder.module, extracts[ 8], const_['2']),
						CALL.veq(goal.builder.module, extracts[ 9], const_['2']),
						CALL.veq(goal.builder.module, extracts[10], const_['2.4']),
						CALL.veq(goal.builder.module, extracts[11], const_['2.4']),
					].map((expected) => goal.builder.module.drop(expected)),
				);
			});
			it('multiple unions.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let var x: int | float = 42;
					let var y: int | float = 4.2;
					x * y;
					x > y;
					x == y;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const extracts: readonly (readonly binaryen.ExpressionRef[])[] = goal.children.slice(2).map((stmt) => { //
					const binexp = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary;
					return [
						binexp.operand0.build(),
						binexp.operand1.build(),
					];
				});
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build()),
					[
						CALL.vmul(goal.builder.module, extracts[0][0], extracts[0][1]),
						CALL.vgt (goal.builder.module, extracts[1][0], extracts[1][1]),
						CALL.veq (goal.builder.module, extracts[2][0], extracts[2][1]),
					].map((expected) => goal.builder.module.drop(expected)),
				);
			});
			it('multiple operations.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let var x: int | float = 42;
					let var y: int | float = 4.2;
					x + 2 + 3;
					2 + y + 3;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const extracts: readonly binaryen.ExpressionRef[] = [
					(((goal.children[2] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0 as AST.ASTNodeOperationBinary).operand0.build(),
					(((goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0 as AST.ASTNodeOperationBinary).operand1.build(),
				];
				/* eslint-disable quote-props */
				const const_ = {
					'2': buildConst(goal.builder, 2n),
					'3': buildConst(goal.builder, 3n),
				} as const;
				/* eslint-enable quote-props */
				const inners: readonly binaryen.ExpressionRef[] = [
					CALL.vadd(goal.builder.module, extracts[0], const_['2']),
					CALL.vadd(goal.builder.module, const_['2'], extracts[1]),
				];
				assertEqualBins(
					goal.children.slice(2).map((stmt) => (
						((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0.build()
					)),
					inners,
				);
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build()),
					inners.map((inner) => goal.builder.module.drop(CALL.vadd(goal.builder.module, inner, const_['3']))),
				);
			});
		});
	});



	describe('ASTNodeOperationBinaryArithmetic', () => {
		describe('#type', () => {
			context('with constant folding and int coersion on.', () => {
				it('returns a constant Integer type for any operation of integers.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource('7 * 3 * 2;').type(), typeUnitInt(7n * 3n * 2n));
				});
				it('returns a constant Float type for any operation of mix of integers and floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource('3.0 * 2.7;')   .type(), typeUnitFloat(3.0 * 2.7));
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource('7 * 3.0 * 2;') .type(), typeUnitFloat(7 * 3.0 * 2));
				});
			});
			context('with folding off but int coersion on.', () => {
				it('returns Integer for integer arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource('(7 + 3) * 2;', CONFIG_FOLDING_OFF);
					assert.deepStrictEqual(node.type(), TYPE.INT);
					assert.deepStrictEqual(
						[node.operand0.type(), node.operand1.type()],
						[TYPE.INT,             typeUnitInt(2n)],
					);
				});
				it('returns Float for float arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource('7 * 3.0 ^ 2;', CONFIG_FOLDING_OFF);
					assert.deepStrictEqual(node.type(), TYPE.FLOAT);
					assert.deepStrictEqual(
						[node.operand0.type(), node.operand1.type()],
						[typeUnitInt(7n),      TYPE.FLOAT],
					);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `Integer` if both operands are ints.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource('7 * 3;'), TYPE.INT);
				});
				it('returns `Float` if both operands are floats.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource('7.0 - 3.0;'), TYPE.FLOAT);
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
					['42 + 420;',           new OBJ.Integer(42n + 420n)],
					['42 - 420;',           new OBJ.Integer(42n + -420n)],
					[' 126 /  3;',          new OBJ.Integer(BigInt(Math.trunc( 126 /  3)))],
					['-126 /  3;',          new OBJ.Integer(BigInt(Math.trunc(-126 /  3)))],
					[' 126 / -3;',          new OBJ.Integer(BigInt(Math.trunc( 126 / -3)))],
					['-126 / -3;',          new OBJ.Integer(BigInt(Math.trunc(-126 / -3)))],
					[' 200 /  3;',          new OBJ.Integer(BigInt(Math.trunc( 200 /  3)))],
					[' 200 / -3;',          new OBJ.Integer(BigInt(Math.trunc( 200 / -3)))],
					['-200 /  3;',          new OBJ.Integer(BigInt(Math.trunc(-200 /  3)))],
					['-200 / -3;',          new OBJ.Integer(BigInt(Math.trunc(-200 / -3)))],
					['42 ^ 2 * 420;',       new OBJ.Integer((42n ** 2n * 420n) % (2n ** 16n))],
					['2 ^ 15 + 2 ^ 14;',    new OBJ.Integer(-(2n ** 14n))],
					['-(2 ^ 14) - 2 ^ 15;', new OBJ.Integer(2n ** 14n)],
					['-(5) ^ +(2 * 3);',    new OBJ.Integer((-5n) ** (2n * 3n))],
				]));
			});
			it('overflows integers properly.', () => {
				assert.deepStrictEqual([
					'2 ^ 15 + 2 ^ 14;',
					'-(2 ^ 14) - 2 ^ 15;',
				].map((src) => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).fold()), [
					new OBJ.Integer(-(2n ** 14n)),
					new OBJ.Integer(2n ** 14n),
				]);
			});
			it('computes the value of a float operation of constants.', () => {
				foldOperations(new Map<string, OBJ.Object>([
					['3.0e1 - 201.0e-1;', new OBJ.Float(30 - 20.1)],
					['3 * 2.1;',          new OBJ.Float(3 * 2.1)],
				]));
			});
			it('throws when performing an operation that does not yield a valid number.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource('42 / 0;')    .fold(), NanErrorDivZero);
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource('-4 ^ -0.5;') .fold(), NanErrorInvalid);
			});
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 + 420;', CALL.vadd(mod, buildConst(bldr, 42n), buildConst(bldr, 420n))],
					['3 * 2.1;',  CALL.vmul(mod, buildConst(bldr, 3n),  buildConst(bldr, 2.1))],

					[' 126 /  3;', CALL.vdiv(mod, buildConst(bldr,  126n), buildConst(bldr,  3n))],
					['-126 /  3;', CALL.vdiv(mod, buildConst(bldr, -126n), buildConst(bldr,  3n))],
					[' 126 / -3;', CALL.vdiv(mod, buildConst(bldr,  126n), buildConst(bldr, -3n))],
					['-126 / -3;', CALL.vdiv(mod, buildConst(bldr, -126n), buildConst(bldr, -3n))],
					[' 200 /  3;', CALL.vdiv(mod, buildConst(bldr,  200n), buildConst(bldr,  3n))],
					[' 200 / -3;', CALL.vdiv(mod, buildConst(bldr,  200n), buildConst(bldr, -3n))],
					['-200 /  3;', CALL.vdiv(mod, buildConst(bldr, -200n), buildConst(bldr,  3n))],
					['-200 / -3;', CALL.vdiv(mod, buildConst(bldr, -200n), buildConst(bldr, -3n))],

					['42  - 420;',  CALL.vadd(mod, buildConst(bldr, 42n), CALL.vneg(mod, buildConst(bldr, 420n)))],
					['4.2 - 42.0;', CALL.vadd(mod, buildConst(bldr, 4.2), CALL.vneg(mod, buildConst(bldr, 42.0)))],
					['4.2 - 42;',   CALL.vadd(mod, buildConst(bldr, 4.2), CALL.vneg(mod, buildConst(bldr, 42n)))],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryComparative', () => {
		describe('#type', () => {
			it('with folding and int coersion on.', () => {
				typeOperations(new Map<string, OBJ.Boolean>([
					['2 <  3;', OBJ.Boolean.TRUE],
					['2 >  3;', OBJ.Boolean.FALSE],
					['2 <= 3;', OBJ.Boolean.TRUE],
					['2 >= 3;', OBJ.Boolean.FALSE],
					['2 !< 3;', OBJ.Boolean.FALSE],
					['2 !> 3;', OBJ.Boolean.TRUE],
				]));
			});
			context('with folding off but int coersion on.', () => {
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryComparative.fromSource('7.0 > 3;', CONFIG_FOLDING_OFF).type(), TYPE.BOOL);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `Boolean` if both operands are of the same numeric type.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource('7   <  3;'),   TYPE.BOOL);
					assert.deepStrictEqual(typeOfOperationFromSource('7.0 >= 3.0;'), TYPE.BOOL);
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
				['3   <  3;',   OBJ.Boolean.FALSE],
				['3   >  3;',   OBJ.Boolean.FALSE],
				['3   <= 3;',   OBJ.Boolean.TRUE],
				['3   >= 3;',   OBJ.Boolean.TRUE],
				['5.2 <  7.0;', OBJ.Boolean.TRUE],
				['5.2 >  7.0;', OBJ.Boolean.FALSE],
				['5.2 <= 7.0;', OBJ.Boolean.TRUE],
				['5.2 >= 7.0;', OBJ.Boolean.FALSE],
				['5.2 <  9;',   OBJ.Boolean.TRUE],
				['5.2 >  9;',   OBJ.Boolean.FALSE],
				['5.2 <= 9;',   OBJ.Boolean.TRUE],
				['5.2 >= 9;',   OBJ.Boolean.FALSE],
				['5   <  9.2;', OBJ.Boolean.TRUE],
				['5   >  9.2;', OBJ.Boolean.FALSE],
				['5   <= 9.2;', OBJ.Boolean.TRUE],
				['5   >= 9.2;', OBJ.Boolean.FALSE],
				['3.0 <  3;',   OBJ.Boolean.FALSE],
				['3.0 >  3;',   OBJ.Boolean.FALSE],
				['3.0 <= 3;',   OBJ.Boolean.TRUE],
				['3.0 >= 3;',   OBJ.Boolean.TRUE],
				['3   <  3.0;', OBJ.Boolean.FALSE],
				['3   >  3.0;', OBJ.Boolean.FALSE],
				['3   <= 3.0;', OBJ.Boolean.TRUE],
				['3   >= 3.0;', OBJ.Boolean.TRUE],
			]));
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['3   <  3;',   CALL.vlt(mod, buildConst(bldr, 3n),  buildConst(bldr, 3n))],
					['3   >  3;',   CALL.vgt(mod, buildConst(bldr, 3n),  buildConst(bldr, 3n))],
					['3   <= 3;',   CALL.vle(mod, buildConst(bldr, 3n),  buildConst(bldr, 3n))],
					['3   >= 3;',   CALL.vge(mod, buildConst(bldr, 3n),  buildConst(bldr, 3n))],
					['5   <  9.2;', CALL.vlt(mod, buildConst(bldr, 5n),  buildConst(bldr, 9.2))],
					['5   >  9.2;', CALL.vgt(mod, buildConst(bldr, 5n),  buildConst(bldr, 9.2))],
					['5   <= 9.2;', CALL.vle(mod, buildConst(bldr, 5n),  buildConst(bldr, 9.2))],
					['5   >= 9.2;', CALL.vge(mod, buildConst(bldr, 5n),  buildConst(bldr, 9.2))],
					['5.2 <  3;',   CALL.vlt(mod, buildConst(bldr, 5.2), buildConst(bldr, 3n))],
					['5.2 >  3;',   CALL.vgt(mod, buildConst(bldr, 5.2), buildConst(bldr, 3n))],
					['5.2 <= 3;',   CALL.vle(mod, buildConst(bldr, 5.2), buildConst(bldr, 3n))],
					['5.2 >= 3;',   CALL.vge(mod, buildConst(bldr, 5.2), buildConst(bldr, 3n))],
					['5.2 <  9.2;', CALL.vlt(mod, buildConst(bldr, 5.2), buildConst(bldr, 9.2))],
					['5.2 >  9.2;', CALL.vgt(mod, buildConst(bldr, 5.2), buildConst(bldr, 9.2))],
					['5.2 <= 9.2;', CALL.vle(mod, buildConst(bldr, 5.2), buildConst(bldr, 9.2))],
					['5.2 >= 9.2;', CALL.vge(mod, buildConst(bldr, 5.2), buildConst(bldr, 9.2))],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryEquality', () => {
		describe('#type', () => {
			context('with folding and int coersion on.', () => {
				it('for numeric literals.', () => {
					typeOperations(new Map<string, OBJ.Boolean>([
						[' 2   ===  3;',   OBJ.Boolean.FALSE],
						[' 2   !==  3;',   OBJ.Boolean.TRUE],
						[' 2   ==   3;',   OBJ.Boolean.FALSE],
						[' 2   !=   3;',   OBJ.Boolean.TRUE],
						[' 0   === -0;',   OBJ.Boolean.TRUE],
						[' 0   ==  -0;',   OBJ.Boolean.TRUE],
						[' 0.0 ===  0;',   OBJ.Boolean.FALSE],
						[' 0.0 ==   0;',   OBJ.Boolean.TRUE],
						[' 0.0 === -0;',   OBJ.Boolean.FALSE],
						[' 0.0 ==  -0;',   OBJ.Boolean.TRUE],
						['-0.0 ===  0;',   OBJ.Boolean.FALSE],
						['-0.0 ==   0;',   OBJ.Boolean.TRUE],
						['-0.0 ===  0.0;', OBJ.Boolean.FALSE],
						['-0.0 ==   0.0;', OBJ.Boolean.TRUE],
					]));
				});
				it('returns the result of `this#fold`, wrapped in a `new TypeUnit`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let a: Object = [];
						let b: Object = [42];
						let c: Object = [x= 42];
						let d: Object = {41 -> 42};
						a !== [];
						b !== [42];
						c !== [x= 42];
						d !== {41 -> 42};
						a === a;
						b === b;
						c === c;
						d === d;
						a == [];
						b == [42];
						c == [x= 42];
						d == {41 -> 42};
						b != [42, 43];
						c != [x= 43];
						c != [y= 42];
						d != {41 -> 43};
						d != {43 -> 42};
					`);
					goal.varCheck();
					goal.typeCheck();
					goal.children.slice(4).forEach((stmt) => {
						const expr: AST.ASTNodeOperationBinaryEquality = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinaryEquality;
						const fold: OBJ.Object | null = expr.fold();
						// @ts-expect-error --- `OBJ.Boolean` has a private constructor
						assert_instanceof(fold, OBJ.Boolean);
						assert.deepStrictEqual(
							expr.type(),
							new TYPE.TypeUnit<OBJ.Boolean>(fold),
						);
					});
				});
			});
			context('with folding off but int coersion on.', () => {
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('7 == 7.0;', CONFIG_FOLDING_OFF).type(), TYPE.BOOL);
				});
				it('returns `false` if operands are of different numeric types.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('7 === 7.0;', CONFIG_FOLDING_OFF).type(), OBJ.Boolean.FALSETYPE);
				});
			});
			context('with folding on but int coersion off.', () => {
				it('returns `false` if operands are of different numeric types.', () => {
					typeOperations(new Map([
						['7   === 7.0;', OBJ.Boolean.FALSE],
						['7   ==  7.0;', OBJ.Boolean.FALSE],
						['7.0 === 7;',   OBJ.Boolean.FALSE],
						['7.0 ==  7;',   OBJ.Boolean.FALSE],
					]), CONFIG_COERCION_OFF);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `false` if operands are of different numeric types.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource('7 == 7.0;'), OBJ.Boolean.FALSETYPE);
				});
				it('returns `false` if operands are of disjoint types in general.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource('7 == null;'), OBJ.Boolean.FALSETYPE);
				});
			});
		});


		describe('#fold', () => {
			it('simple types.', () => {
				foldOperations(new Map([
					['null === null;',                          OBJ.Boolean.TRUE],
					['null ==  null;',                          OBJ.Boolean.TRUE],
					['null === 5;',                             OBJ.Boolean.FALSE],
					['null ==  5;',                             OBJ.Boolean.FALSE],
					['true === 1;',                             OBJ.Boolean.FALSE],
					['true ==  1;',                             OBJ.Boolean.FALSE],
					['true === 1.0;',                           OBJ.Boolean.FALSE],
					['true ==  1.0;',                           OBJ.Boolean.FALSE],
					['true === 5.1;',                           OBJ.Boolean.FALSE],
					['true ==  5.1;',                           OBJ.Boolean.FALSE],
					['true === true;',                          OBJ.Boolean.TRUE],
					['true ==  true;',                          OBJ.Boolean.TRUE],
					['3.0 === 3;',                              OBJ.Boolean.FALSE],
					['3.0 ==  3;',                              OBJ.Boolean.TRUE],
					['3 === 3.0;',                              OBJ.Boolean.FALSE],
					['3 ==  3.0;',                              OBJ.Boolean.TRUE],
					['0.0 === 0.0;',                            OBJ.Boolean.TRUE],
					['0.0 ==  0.0;',                            OBJ.Boolean.TRUE],
					['0.0 === -0.0;',                           OBJ.Boolean.FALSE],
					['0.0 ==  -0.0;',                           OBJ.Boolean.TRUE],
					['0 === -0;',                               OBJ.Boolean.TRUE],
					['0 ==  -0;',                               OBJ.Boolean.TRUE],
					['0.0 === 0;',                              OBJ.Boolean.FALSE],
					['0.0 ==  0;',                              OBJ.Boolean.TRUE],
					['0.0 === -0;',                             OBJ.Boolean.FALSE],
					['0.0 ==  -0;',                             OBJ.Boolean.TRUE],
					['-0.0 === 0;',                             OBJ.Boolean.FALSE],
					['-0.0 ==  0;',                             OBJ.Boolean.TRUE],
					['-0.0 === 0.0;',                           OBJ.Boolean.FALSE],
					['-0.0 ==  0.0;',                           OBJ.Boolean.TRUE],
					['"" == "";',                               OBJ.Boolean.TRUE],
					['"a" === "a";',                            OBJ.Boolean.TRUE],
					['"a" ==  "a";',                            OBJ.Boolean.TRUE],
					['"hello\\u{20}world" === "hello world";',  OBJ.Boolean.TRUE],
					['"hello\\u{20}world" ==  "hello world";',  OBJ.Boolean.TRUE],
					['"a" !== "b";',                            OBJ.Boolean.TRUE],
					['"a" !=  "b";',                            OBJ.Boolean.TRUE],
					['"hello\\u{20}world" !== "hello20world";', OBJ.Boolean.TRUE],
					['"hello\\u{20}world" !=  "hello20world";', OBJ.Boolean.TRUE],
				]));
			});
			it('with int coercion off, does not coerce ints into floats.', () => {
				foldOperations(new Map<string, OBJ.Object>([
					['7   === 7.0;', OBJ.Boolean.FALSE],
					['7   ==  7.0;', OBJ.Boolean.FALSE],
					['7.0 === 7;',   OBJ.Boolean.FALSE],
					['7.0 ==  7;',   OBJ.Boolean.FALSE],
				]), CONFIG_COERCION_OFF);
			});
			it('compound types.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let a: Object = [];
					let b: Object = [42];
					let c: Object = [x= 42];
					let d: Object = List.<int>([]);
					let e: Object = List.<int>([42]);
					let f: Object = Dict.<int>([x= 42]);
					let g: Object = {};
					let h: Object = {42};
					let i: Object = {41 -> 42};

					let bb: Object = [[42]];
					let cc: Object = [x= [42]];
					let hh: Object = {[42]};
					let ii: Object = {[41] -> [42]};

					a === [];
					b === [42];
					c === [x= 42];
					d !== List.<int>([]);
					e !== List.<int>([42]);
					f !== Dict.<int>([x= 42]);
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
					a == [];
					b == [42];
					c == [x= 42];
					d == List.<int>([]);
					e == List.<int>([42]);
					f == Dict.<int>([x= 42]);
					g == {};
					h == {42};
					i == {41 -> 42};

					bb === [[42]];
					cc === [x= [42]];
					hh !== {[42]};
					ii !== {[41] -> [42]};
					bb === bb;
					cc === cc;
					hh === hh;
					ii === ii;
					bb == [[42]];
					cc == [x= [42]];
					hh == {[42]};
					ii == {[41] -> [42]};

					b != [42, 43];
					c != [x= 43];
					c != [y= 42];
					i != {41 -> 43};
					i != {43 -> 42};
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.children.slice(13).forEach((stmt) => {
					assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.fold(), OBJ.Boolean.TRUE, stmt.source);
				});
			});
			it('compound value types’ constituents are compared using same operand.', () => {
				foldOperations(new Map([
					['[   42.0] === [   42];',   OBJ.Boolean.FALSE],
					['[   42.0] ==  [   42];',   OBJ.Boolean.TRUE],
					['[a= 42.0] === [a= 42];',   OBJ.Boolean.FALSE],
					['[a= 42.0] ==  [a= 42];',   OBJ.Boolean.TRUE],
					['[    0.0] === [   -0.0];', OBJ.Boolean.FALSE],
					['[    0.0] ==  [   -0.0];', OBJ.Boolean.TRUE],
					['[a=  0.0] === [a= -0.0];', OBJ.Boolean.FALSE],
					['[a=  0.0] ==  [a= -0.0];', OBJ.Boolean.TRUE],
				]));
			});
		});


		describe('#build', () => {
			it('with int coercion on, coerces ints into floats when needed.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 === 420;', CALL.vid(mod, buildConst(bldr, 42n), buildConst(bldr, 420n))],
					['42 ==  420;', CALL.veq(mod, buildConst(bldr, 42n), buildConst(bldr, 420n))],
					['42 === 4.2;', CALL.vid(mod, buildConst(bldr, 42n), buildConst(bldr, 4.2))],
					['42 ==  4.2;', CALL.veq(mod, buildConst(bldr, 42n), buildConst(bldr, 4.2))],

					['4.2 === 42;',   CALL.vid(mod, buildConst(bldr, 4.2), buildConst(bldr, 42n))],
					['4.2 ==  42;',   CALL.veq(mod, buildConst(bldr, 4.2), buildConst(bldr, 42n))],
					['4.2 === 42.0;', CALL.vid(mod, buildConst(bldr, 4.2), buildConst(bldr, 42.0))],
					['4.2 ==  42.0;', CALL.veq(mod, buildConst(bldr, 4.2), buildConst(bldr, 42.0))],

					['null === 0;',   CALL.vid(mod, buildConst(bldr), buildConst(bldr, 0n))],
					['null ==  0;',   CALL.veq(mod, buildConst(bldr), buildConst(bldr, 0n))],
					['null === 0.0;', CALL.vid(mod, buildConst(bldr), buildConst(bldr, 0.0))],
					['null ==  0.0;', CALL.veq(mod, buildConst(bldr), buildConst(bldr, 0.0))],

					['null === false;', CALL.vid(mod, buildConst(bldr), buildConst(bldr, false))],
					['null ==  false;', CALL.veq(mod, buildConst(bldr), buildConst(bldr, false))],
					['null === true;',  CALL.vid(mod, buildConst(bldr), buildConst(bldr, true))],
					['null ==  true;',  CALL.veq(mod, buildConst(bldr), buildConst(bldr, true))],

					['false === 0;',   CALL.vid(mod, buildConst(bldr, false), buildConst(bldr, 0n))],
					['false ==  0;',   CALL.veq(mod, buildConst(bldr, false), buildConst(bldr, 0n))],
					['false === 0.0;', CALL.vid(mod, buildConst(bldr, false), buildConst(bldr, 0.0))],
					['false ==  0.0;', CALL.veq(mod, buildConst(bldr, false), buildConst(bldr, 0.0))],

					['true === 1;',   CALL.vid(mod, buildConst(bldr, true), buildConst(bldr, 1n))],
					['true ==  1;',   CALL.veq(mod, buildConst(bldr, true), buildConst(bldr, 1n))],
					['true === 1.0;', CALL.vid(mod, buildConst(bldr, true), buildConst(bldr, 1.0))],
					['true ==  1.0;', CALL.veq(mod, buildConst(bldr, true), buildConst(bldr, 1.0))],
				]));
			});
			it('with int coercion off, does not coerce ints into floats.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 === 4.2;', CALL.vid (mod, buildConst(bldr, 42n), buildConst(bldr, 4.2))],
					['42 ==  4.2;', CALL.veqq(mod, buildConst(bldr, 42n), buildConst(bldr, 4.2))],

					['4.2 === 42;', CALL.vid (mod, buildConst(bldr, 4.2), buildConst(bldr, 42n))],
					['4.2 ==  42;', CALL.veqq(mod, buildConst(bldr, 4.2), buildConst(bldr, 42n))],

					['null === 0.0;', CALL.vid  (mod, buildConst(bldr), buildConst(bldr, 0.0))],
					['null ==  0.0;', CALL.veqq (mod, buildConst(bldr), buildConst(bldr, 0.0))],

					['false === 0.0;', CALL.vid (mod, buildConst(bldr, false), buildConst(bldr, 0.0))],
					['false ==  0.0;', CALL.veqq(mod, buildConst(bldr, false), buildConst(bldr, 0.0))],

					['true === 1.0;', CALL.vid (mod, buildConst(bldr, true), buildConst(bldr, 1.0))],
					['true ==  1.0;', CALL.veqq(mod, buildConst(bldr, true), buildConst(bldr, 1.0))],
				]), CONFIG_FOLDING_COERCION_OFF);
			});
		});
	});



	describe('ASTNodeOperationBinaryLogical', () => {
		describe('#type', () => {
			it('with constant folding on.', () => {
				typeOperations(new Map<string, OBJ.Primitive>([
					['null  && false;', OBJ.Null.NULL],
					['false && null;',  OBJ.Boolean.FALSE],
					['true  && null;',  OBJ.Null.NULL],
					['false && 42;',    OBJ.Boolean.FALSE],
					['4.2   && true;',  OBJ.Boolean.TRUE],
					['null  || false;', OBJ.Boolean.FALSE],
					['false || null;',  OBJ.Null.NULL],
					['true  || null;',  OBJ.Boolean.TRUE],
					['false || 42;',    new OBJ.Integer(42n)],
					['4.2   || true;',  new OBJ.Float(4.2)],
				]));
			});
			context('with constant folding off.', () => {
				describe('[operator=AND]', () => {
					it('returns `left` if it’s a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: null = null;
							let var b: null | false = null;
							let var c: null | void = null;
							a && 42;
							b && 42;
							c && 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(3).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL,
							TYPE.NULL.union(OBJ.Boolean.FALSETYPE),
							TYPE.NULL.union(TYPE.VOID),
						]);
					});
					it('returns `T | right` if left is a supertype of `T narrows void | null | false`.', () => {
						const hello: TYPE.TypeUnit<OBJ.String> = typeUnitStr('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: null | int = null;
							let var b: null | int = 42;
							let var c: bool = false;
							let var d: bool | float = 4.2;
							let var e: str | void = "hello";
							a && "hello";
							b && "hello";
							c && "hello";
							d && "hello";
							e && 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						return assertEqualTypes(goal.children.slice(5).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL.union(hello),
							TYPE.NULL.union(hello),
							OBJ.Boolean.FALSETYPE.union(hello),
							OBJ.Boolean.FALSETYPE.union(hello),
							TYPE.VOID.union(typeUnitInt(42n)),
						]);
					});
					it('returns `right` if left does not contain `void` nor `null` nor `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: int = 42;
							let var b: float = 4.2;
							a && true;
							b && null;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							OBJ.Boolean.TRUETYPE,
							TYPE.NULL,
						]);
					});
				});
				describe('[operator=OR]', () => {
					it('returns `right` if it’s a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: null = null;
							let var b: null | false = null;
							let var c: null | void = null;
							a || false;
							b || 42;
							c || 4.2;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(3).map((stmt) => typeOfStmtExpr(stmt)), [
							OBJ.Boolean.FALSETYPE,
							typeUnitInt(42n),
							typeUnitFloat(4.2),
						]);
					});
					it('returns `(left - T) | right` if left is a supertype of `T narrows void | null | false`.', () => {
						const hello: TYPE.TypeUnit<OBJ.String> = typeUnitStr('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: null | int = null;
							let var b: null | int = 42;
							let var c: bool = false;
							let var d: bool | float = 4.2;
							let var e: str | void = "hello";
							a || "hello";
							b || "hello";
							c || "hello";
							d || "hello";
							e || 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assertEqualTypes(goal.children.slice(5).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.INT.union(hello),
							TYPE.INT.union(hello),
							OBJ.Boolean.TRUETYPE.union(hello),
							OBJ.Boolean.TRUETYPE.union(TYPE.FLOAT).union(hello),
							TYPE.STR.union(typeUnitInt(42n)),
						]);
					});
					it('returns `left` if it does not contain `void` nor `null` nor `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let var a: int = 42;
							let var b: float = 4.2;
							a || true;
							b || null;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.INT,
							TYPE.FLOAT,
						]);
					});
				});
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, OBJ.Object>([
				['null && 5;',     OBJ.Null.NULL],
				['null || 5;',     new OBJ.Integer(5n)],
				['5 && null;',     OBJ.Null.NULL],
				['5 || null;',     new OBJ.Integer(5n)],
				['5.1 && true;',   OBJ.Boolean.TRUE],
				['5.1 || true;',   new OBJ.Float(5.1)],
				['3.1 && 5;',      new OBJ.Integer(5n)],
				['3.1 || 5;',      new OBJ.Float(3.1)],
				['false && null;', OBJ.Boolean.FALSE],
				['false || null;', OBJ.Null.NULL],
			]));
		});


		describe('#build', () => {
			/**
			 * A helper for creating a conditional expression.
			 * Given a value to tee and callbacks to perform giving the condition and branches,
			 * return an `(if)` whose condition and branches are given by the callback.
			 * @param mod       the module to perform the conditional
			 * @param tee       parameters for teeing the value:
			 *                  [
			 *                  	the local index to tee the value,
			 *                  	the value,
			 *                  	the value’s type,
			 *                  ]
			 * @param branches  the callback to perform; given a getter, returns two branches: [if_true, if_false]
			 * @return          the new `(if)` expression
			 */
			function create_if(
				mod:                binaryen.Module,
				[index, arg, type]: [number, binaryen.ExpressionRef, binaryen.Type],
				branches:           (local_get: binaryen.ExpressionRef) => [binaryen.ExpressionRef, binaryen.ExpressionRef],
			): binaryen.ExpressionRef {
				return mod.if(
					new BinVect(mod, mod.call(
						'vnot',
						[mod.local.tee(index, arg, type)],
						binaryen.v128,
					)).isSpecial(false),
					...branches.call(null, mod.local.get(index, type)),
				);
			}

			it('returns a special case of `(if)`.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 && 420;', create_if(
						mod,
						[0, buildConst(bldr, 42n), binaryen.v128],
						(getter) => [buildConst(bldr, 420n), getter],
					)],
					['4.2 || -420;', create_if(
						mod,
						[0, buildConst(bldr, 4.2), binaryen.v128],
						(getter) => [getter, buildConst(bldr, -420n)],
					)],
					['null && 201.0e-1;', create_if(
						mod,
						[0, buildConst(bldr), binaryen.v128],
						(getter) => [buildConst(bldr, 20.1), getter],
					)],
					['false || null;', create_if(
						mod,
						[0, buildConst(bldr, false), binaryen.v128],
						(getter) => [getter, buildConst(bldr)],
					)],
					['true && 201.0e-1;', create_if(
						mod,
						[0, buildConst(bldr, true), binaryen.v128],
						(getter) => [buildConst(bldr, 20.1), getter],
					)],
				]));
			});

			it('counts internal variables correctly.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['1 && 2 || 3 && 4;', create_if(
						mod,
						[2, create_if(
							mod,
							[0, buildConst(bldr, 1n), binaryen.v128],
							(getter) => [buildConst(bldr, 2n), getter],
						), binaryen.v128],
						(getter) => [getter, create_if(
							mod,
							[1, buildConst(bldr, 3n), binaryen.v128],
							(getter_) => [buildConst(bldr, 4n), getter_],
						)],
					)],
					['1 && 2.0 || 3 && 4.0;', create_if(
						mod,
						[2, create_if(
							mod,
							[0, buildConst(bldr, 1n), binaryen.v128],
							(getter) => [buildConst(bldr, 2.0), getter],
						), binaryen.v128],
						(getter) => [
							getter,
							create_if(
								mod,
								[1, buildConst(bldr, 3n), binaryen.v128],
								(getter_) => [buildConst(bldr, 4.0), getter_],
							),
						],
					)],
				]));
			});

			it('nested unions.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['1 && 2.0 || 3.0 && 4;', create_if(
						mod,
						[2, create_if(
							mod,
							[0, buildConst(bldr, 1n), binaryen.v128],
							(getter) => [buildConst(bldr, 2.0), getter],
						), binaryen.v128],
						(getter) => [
							getter,
							create_if(
								mod,
								[1, buildConst(bldr, 3.0), binaryen.v128],
								(getter_) => [buildConst(bldr, 4n), getter_],
							),
						],
					)],
				]));
			});
		});
	});



	describe('ASTNodeOperationTernary', () => {
		describe('#type', () => {
			context('with constant folding on', () => {
				it('computes type for for conditionals', () => {
					typeOperations(new Map<string, OBJ.Primitive>([
						['if true then false else 2;',          OBJ.Boolean.FALSE],
						['if false then 3.0 else null;',        OBJ.Null.NULL],
						['if true then 2 else 3.0;',            new OBJ.Integer(2n)],
						['if false then 2 + 3.0 else 1.0 * 2;', new OBJ.Float(2.0)],
					]));
				});
			});
			it('throws when condition is not a subtype of `boolean`.', () => {
				assert.throws(() => AST.ASTNodeOperationTernary.fromSource('if 2 then true else false;').type(), TypeErrorInvalidOperation);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, OBJ.Object>([
				['if true then false else 2;',          OBJ.Boolean.FALSE],
				['if false then 3.0 else null;',        OBJ.Null.NULL],
				['if true then 2 else 3.0;',            new OBJ.Integer(2n)],
				['if false then 2 + 3.0 else 1.0 * 2;', new OBJ.Float(2.0)],
			]));
		});


		describe('#build', () => {
			it('returns `(if)`.', () => {
				const bldr = new Builder();
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['if true  then false else 2;',    mod.if(buildConst(bldr, true),  buildConst(bldr, false), buildConst(bldr, 2n))],
					['if true  then 2     else 3.0;',  mod.if(buildConst(bldr, true),  buildConst(bldr, 2n),    buildConst(bldr, 3.0))],
					['if false then 3.0   else null;', mod.if(buildConst(bldr, false), buildConst(bldr, 3.0),   buildConst(bldr))],
				]));
			});
		});
	});
});
