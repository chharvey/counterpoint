import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	ASTNODE_SOLID as AST,
	SolidType,
	SolidTypeUnit,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	BinVect,
	TypeError01,
	NanError01,
	NanError02,
} from '../../../src/index.js';
import {
	assertEqualTypes,
	assertEqualBins,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	typeConstInt,
	typeConstFloat,
	typeConstStr,
	buildConst,
} from '../../helpers.js';



const CONFIG_FOLDING_COERCION_OFF: SolidConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
		intCoercion: false,
	},
};
function typeOperations(tests: ReadonlyMap<string, SolidObject>, config: SolidConfig = CONFIG_DEFAULT): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).type()),
		[...tests.values()].map((expected) => new SolidTypeUnit(expected)),
	);
}
function foldOperations(tests: Map<string, SolidObject>): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src).fold()),
		[...tests.values()],
	);
}
function buildOperations(tests: ReadonlyMap<string, binaryen.ExpressionRef>, config: SolidConfig = CONFIG_FOLDING_OFF): void {
	return assertEqualBins(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).build()),
		[...tests.values()],
	);
}
function typeOfOperationFromSource(src: string): SolidType {
	return AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_COERCION_OFF).type();
}



describe('ASTNodeOperation', () => {
	function typeOfStmtExpr(stmt: AST.ASTNodeStatement): SolidType {
		assert.ok(stmt instanceof AST.ASTNodeStatementExpression);
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
				AST.ASTNodeOperationBinaryArithmetic.fromSource(`-4 ^ -0.5;`).type(),
				AST.ASTNodeOperationBinaryArithmetic.fromSource(`1.5 / 0.0;`).type(),
			].forEach((typ) => {
				assert.strictEqual(typ, SolidType.NEVER);
			})
		});
	});



	describe('#build', () => {
		it('compound expression.', () => {
			const mod = new binaryen.Module();
			return buildOperations(new Map([
				[`42 ^ 2 * 420;`, CALL.vmul(
					mod,
					CALL.vexp(mod, buildConst(mod, 42n), buildConst(mod, 2n)),
					buildConst(mod, 420n),
				)],
				[`2 * 3.0 + 5;`, CALL.vadd(
					mod,
					CALL.vmul(mod, buildConst(mod, 2n), buildConst(mod, 3.0)),
					buildConst(mod, 5n),
				)],
			]));
		});
	});



	describe('ASTNodeOperationUnary', () => {
		describe('#type', () => {
			context('with constant folding on.', () => {
				it('returns a constant Boolean type for boolean unary operation of anything.', () => {
					typeOperations(new Map([
						[`!false;`,  SolidBoolean.TRUE],
						[`!true;`,   SolidBoolean.FALSE],
						[`!null;`,   SolidBoolean.TRUE],
						[`!42;`,     SolidBoolean.FALSE],
						[`!4.2e+1;`, SolidBoolean.FALSE],
						[`?false;`,  SolidBoolean.TRUE],
						[`?true;`,   SolidBoolean.FALSE],
						[`?null;`,   SolidBoolean.TRUE],
						[`?42;`,     SolidBoolean.FALSE],
						[`?4.2e+1;`, SolidBoolean.FALSE],

						[`![];`,         SolidBoolean.FALSE],
						[`![42];`,       SolidBoolean.FALSE],
						[`![a= 42];`,    SolidBoolean.FALSE],
						[`!{};`,         SolidBoolean.FALSE],
						[`!{42};`,       SolidBoolean.FALSE],
						[`!{41 -> 42};`, SolidBoolean.FALSE],
						[`?[];`,         SolidBoolean.TRUE],
						[`?[42];`,       SolidBoolean.FALSE],
						[`?[a= 42];`,    SolidBoolean.FALSE],
						[`?{};`,         SolidBoolean.TRUE],
						[`?{42};`,       SolidBoolean.FALSE],
						[`?{41 -> 42};`, SolidBoolean.FALSE],
					]));
				});
			});

			context('with constant folding off.', () => {
				describe('[operator=NOT]', () => {
					it('returns type `true` for a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null = null;
							let unfixed b: null | false = null;
							let unfixed c: null | void = null;
							!a;
							!b;
							!c;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(3).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), SolidBoolean.TRUETYPE);
						});
					});
					it('returns type `bool` for a supertype of `void` or a supertype of `null` or a supertype of `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = 'hello';
							!a;
							!b;
							!c;
							!d;
							!e;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(5).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), SolidType.BOOL);
						});
					});
					it('returns type `false` for any type not a supertype of `null` or `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: int = 42;
							let unfixed b: float = 4.2;
							!a;
							!b;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(2).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), SolidBoolean.FALSETYPE);
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
							assert.deepStrictEqual(typeOfStmtExpr(stmt), SolidBoolean.FALSETYPE);
						});
					});
				});
				describe('[operator=EMP]', () => {
					it('always returns type `bool`.', () => {
						[
							`?false;`,
							`?true;`,
							`?null;`,
							`?42;`,
							`?4.2e+1;`,

							`?[];`,
							`?[42];`,
							`?[a= 42];`,
							`?{41 -> 42};`,
						].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).type()).forEach((typ) => {
							assert.deepStrictEqual(typ, SolidType.BOOL);
						});
					});
				});
			});
		});


		describe('#fold', () => {
			specify('[operator=NOT]', () => {
				foldOperations(new Map([
					[`!false;`,  SolidBoolean.TRUE],
					[`!true;`,   SolidBoolean.FALSE],
					[`!null;`,   SolidBoolean.TRUE],
					[`!0;`,      SolidBoolean.FALSE],
					[`!42;`,     SolidBoolean.FALSE],
					[`!0.0;`,    SolidBoolean.FALSE],
					[`!-0.0;`,   SolidBoolean.FALSE],
					[`!4.2e+1;`, SolidBoolean.FALSE],
				]));
				Dev.supports('stringConstant-assess') && foldOperations(new Map([
					[`!'';`,      SolidBoolean.FALSE],
					[`!'hello';`, SolidBoolean.FALSE],
				]));
				foldOperations(new Map([
					[`![];`,                  SolidBoolean.FALSE],
					[`![42];`,                SolidBoolean.FALSE],
					[`![a= 42];`,             SolidBoolean.FALSE],
					[`!List.<int>([]);`,      SolidBoolean.FALSE],
					[`!List.<int>([42]);`,    SolidBoolean.FALSE],
					[`!Dict.<int>([a= 42]);`, SolidBoolean.FALSE],
					[`!{};`,                  SolidBoolean.FALSE],
					[`!{42};`,                SolidBoolean.FALSE],
					[`!{41 -> 42};`,          SolidBoolean.FALSE],
				]));
			});
			specify('[operator=EMP]', () => {
				foldOperations(new Map([
					[`?false;`,  SolidBoolean.TRUE],
					[`?true;`,   SolidBoolean.FALSE],
					[`?null;`,   SolidBoolean.TRUE],
					[`?0;`,      SolidBoolean.TRUE],
					[`?42;`,     SolidBoolean.FALSE],
					[`?0.0;`,    SolidBoolean.TRUE],
					[`?-0.0;`,   SolidBoolean.TRUE],
					[`?4.2e+1;`, SolidBoolean.FALSE],
				]));
				Dev.supports('stringConstant-assess') && foldOperations(new Map([
					[`?'';`,      SolidBoolean.TRUE],
					[`?'hello';`, SolidBoolean.FALSE],
				]));
				foldOperations(new Map([
					[`?[];`,                  SolidBoolean.TRUE],
					[`?[42];`,                SolidBoolean.FALSE],
					[`?[a= 42];`,             SolidBoolean.FALSE],
					[`?List.<int>([]);`,      SolidBoolean.TRUE],
					[`?List.<int>([42]);`,    SolidBoolean.FALSE],
					[`?Dict.<int>([a= 42]);`, SolidBoolean.FALSE],
					[`?{};`,                  SolidBoolean.TRUE],
					[`?{42};`,                SolidBoolean.FALSE],
					[`?{41 -> 42};`,          SolidBoolean.FALSE],
				]));
			});
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					[`!false;`, CALL.vnot(mod, buildConst(mod, false))],
					[`!true;`,  CALL.vnot(mod, buildConst(mod, true))],
					[`!42;`,    CALL.vnot(mod, buildConst(mod, 42n))],
					[`!4.2;`,   CALL.vnot(mod, buildConst(mod, 4.2))],
					[`?false;`, CALL.vemp(mod, buildConst(mod, false))],
					[`?true;`,  CALL.vemp(mod, buildConst(mod, true))],
					[`?42;`,    CALL.vemp(mod, buildConst(mod, 42n))],
					[`?4.2;`,   CALL.vemp(mod, buildConst(mod, 4.2))],
					[`-(4);`,   CALL.vneg(mod, buildConst(mod, 4n))],
					[`-(4.2);`, CALL.vneg(mod, buildConst(mod, 4.2))],
					[`!null;`,  CALL.vnot(mod, buildConst(mod))],
					[`?null;`,  CALL.vemp(mod, buildConst(mod))],
				]));
			});
			it('works with vects.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;

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
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;

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
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;

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
				const const_ = {
					'2':   buildConst(goal.builder.module, 2n),
					'2.4': buildConst(goal.builder.module, 2.4),
				} as const;
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
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;
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
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;
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
				const const_ = {
					'2': buildConst(goal.builder.module, 2n),
					'3': buildConst(goal.builder.module, 3n),
				} as const;
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
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3 * 2;`).type(), typeConstInt(7n * 3n * 2n));
				});
				it('returns a constant Float type for any operation of mix of integers and floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`3.0 * 2.7;`)   .type(), typeConstFloat(3.0 * 2.7));
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3.0 * 2;`) .type(), typeConstFloat(7 * 3.0 * 2));
				});
			});
			context('with folding off but int coersion on.', () => {
				it('returns Integer for integer arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource(`(7 + 3) * 2;`, CONFIG_FOLDING_OFF);
					assert.deepStrictEqual(node.type(), SolidType.INT);
					assert.deepStrictEqual(
						[node.operand0.type(), node.operand1.type()],
						[SolidType.INT,        typeConstInt(2n)],
					);
				});
				it('returns Float for float arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3.0 ^ 2;`, CONFIG_FOLDING_OFF);
					assert.deepStrictEqual(node.type(), SolidType.FLOAT);
					assert.deepStrictEqual(
						[node.operand0.type(), node.operand1.type()],
						[typeConstInt(7n),     SolidType.FLOAT],
					);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `Integer` if both operands are ints.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7 * 3;`), SolidType.INT);
				})
				it('returns `Float` if both operands are floats.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7.0 - 3.0;`), SolidType.FLOAT);
				})
				it('throws TypeError for invalid type operations.', () => {
					assert.throws(() => typeOfOperationFromSource(`7.0 + 3;`), TypeError01);
				});
			});
			it('throws for arithmetic operation of non-numbers.', () => {
				[
					`null + 5;`,
					`5 * null;`,
					`false - 2;`,
					`2 / true;`,
					`null ^ false;`,
					...(Dev.supports('stringConstant-assess') ? [`'hello' + 5;`] : []),
				].forEach((src) => {
					assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).type(), TypeError01);
				});
			});
		});


		describe('#fold', () => {
			it('computes the value of an integer operation of constants.', () => {
				foldOperations(new Map([
					[`42 + 420;`,           new Int16(42n + 420n)],
					[`42 - 420;`,           new Int16(42n + -420n)],
					[` 126 /  3;`,          new Int16(BigInt(Math.trunc( 126 /  3)))],
					[`-126 /  3;`,          new Int16(BigInt(Math.trunc(-126 /  3)))],
					[` 126 / -3;`,          new Int16(BigInt(Math.trunc( 126 / -3)))],
					[`-126 / -3;`,          new Int16(BigInt(Math.trunc(-126 / -3)))],
					[` 200 /  3;`,          new Int16(BigInt(Math.trunc( 200 /  3)))],
					[` 200 / -3;`,          new Int16(BigInt(Math.trunc( 200 / -3)))],
					[`-200 /  3;`,          new Int16(BigInt(Math.trunc(-200 /  3)))],
					[`-200 / -3;`,          new Int16(BigInt(Math.trunc(-200 / -3)))],
					[`42 ^ 2 * 420;`,       new Int16((42n ** 2n * 420n) % (2n ** 16n))],
					[`2 ^ 15 + 2 ^ 14;`,    new Int16(-(2n ** 14n))],
					[`-(2 ^ 14) - 2 ^ 15;`, new Int16(2n ** 14n)],
					[`-(5) ^ +(2 * 3);`,    new Int16((-5n) ** (2n * 3n))],
				]));
			});
			it('overflows integers properly.', () => {
				assert.deepStrictEqual([
					`2 ^ 15 + 2 ^ 14;`,
					`-(2 ^ 14) - 2 ^ 15;`,
				].map((src) => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).fold()), [
					new Int16(-(2n ** 14n)),
					new Int16(2n ** 14n),
				]);
			});
			it('computes the value of a float operation of constants.', () => {
				foldOperations(new Map<string, SolidObject>([
					[`3.0e1 - 201.0e-1;`, new Float64(30 - 20.1)],
					[`3 * 2.1;`,          new Float64(3 * 2.1)],
				]));
			});
			it('throws when performing an operation that does not yield a valid number.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(`42 / 0;`)   .fold(), NanError02);
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(`-4 ^ -0.5;`).fold(), NanError01);
			});
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 + 420;', CALL.vadd(mod, buildConst(mod, 42n), buildConst(mod, 420n))],
					['3 * 2.1;',  CALL.vmul(mod, buildConst(mod, 3n),  buildConst(mod, 2.1))],

					[' 126 /  3;', CALL.vdiv(mod, buildConst(mod,  126n), buildConst(mod,  3n))],
					['-126 /  3;', CALL.vdiv(mod, buildConst(mod, -126n), buildConst(mod,  3n))],
					[' 126 / -3;', CALL.vdiv(mod, buildConst(mod,  126n), buildConst(mod, -3n))],
					['-126 / -3;', CALL.vdiv(mod, buildConst(mod, -126n), buildConst(mod, -3n))],
					[' 200 /  3;', CALL.vdiv(mod, buildConst(mod,  200n), buildConst(mod,  3n))],
					[' 200 / -3;', CALL.vdiv(mod, buildConst(mod,  200n), buildConst(mod, -3n))],
					['-200 /  3;', CALL.vdiv(mod, buildConst(mod, -200n), buildConst(mod,  3n))],
					['-200 / -3;', CALL.vdiv(mod, buildConst(mod, -200n), buildConst(mod, -3n))],

					['42  - 420;',  CALL.vadd(mod, buildConst(mod, 42n), CALL.vneg(mod, buildConst(mod, 420n)))],
					['4.2 - 42.0;', CALL.vadd(mod, buildConst(mod, 4.2), CALL.vneg(mod, buildConst(mod, 42.0)))],
					['4.2 - 42;',   CALL.vadd(mod, buildConst(mod, 4.2), CALL.vneg(mod, buildConst(mod, 42n)))],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryComparative', () => {
		describe('#type', () => {
			it('with folding and int coersion on.', () => {
				typeOperations(new Map([
					[`2 < 3;`,  SolidBoolean.TRUE],
					[`2 > 3;`,  SolidBoolean.FALSE],
					[`2 <= 3;`, SolidBoolean.TRUE],
					[`2 >= 3;`, SolidBoolean.FALSE],
					[`2 !< 3;`, SolidBoolean.FALSE],
					[`2 !> 3;`, SolidBoolean.TRUE],
				]));
			});
			context('with folding off but int coersion on.', () => {
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryComparative.fromSource(`7.0 > 3;`, CONFIG_FOLDING_OFF).type(), SolidType.BOOL);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `Boolean` if both operands are of the same numeric type.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7 < 3;`), SolidType.BOOL);
					assert.deepStrictEqual(typeOfOperationFromSource(`7.0 >= 3.0;`), SolidType.BOOL);
				});
				it('throws TypeError if operands have different types.', () => {
					assert.throws(() => typeOfOperationFromSource(`7.0 <= 3;`), TypeError01);
				});
			});
			it('throws for comparative operation of non-numbers.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryComparative.fromSource(`7.0 <= null;`).type(), TypeError01);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map([
				[`3 <  3;`,     SolidBoolean.FALSE],
				[`3 >  3;`,     SolidBoolean.FALSE],
				[`3 <= 3;`,     SolidBoolean.TRUE],
				[`3 >= 3;`,     SolidBoolean.TRUE],
				[`5.2 <  7.0;`, SolidBoolean.TRUE],
				[`5.2 >  7.0;`, SolidBoolean.FALSE],
				[`5.2 <= 7.0;`, SolidBoolean.TRUE],
				[`5.2 >= 7.0;`, SolidBoolean.FALSE],
				[`5.2 <  9;`,   SolidBoolean.TRUE],
				[`5.2 >  9;`,   SolidBoolean.FALSE],
				[`5.2 <= 9;`,   SolidBoolean.TRUE],
				[`5.2 >= 9;`,   SolidBoolean.FALSE],
				[`5 <  9.2;`,   SolidBoolean.TRUE],
				[`5 >  9.2;`,   SolidBoolean.FALSE],
				[`5 <= 9.2;`,   SolidBoolean.TRUE],
				[`5 >= 9.2;`,   SolidBoolean.FALSE],
				[`3.0 <  3;`,   SolidBoolean.FALSE],
				[`3.0 >  3;`,   SolidBoolean.FALSE],
				[`3.0 <= 3;`,   SolidBoolean.TRUE],
				[`3.0 >= 3;`,   SolidBoolean.TRUE],
				[`3 <  3.0;`,   SolidBoolean.FALSE],
				[`3 >  3.0;`,   SolidBoolean.FALSE],
				[`3 <= 3.0;`,   SolidBoolean.TRUE],
				[`3 >= 3.0;`,   SolidBoolean.TRUE],
			]));
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['3   <  3;',   CALL.vlt(mod, buildConst(mod, 3n),  buildConst(mod, 3n))],
					['3   >  3;',   CALL.vgt(mod, buildConst(mod, 3n),  buildConst(mod, 3n))],
					['3   <= 3;',   CALL.vle(mod, buildConst(mod, 3n),  buildConst(mod, 3n))],
					['3   >= 3;',   CALL.vge(mod, buildConst(mod, 3n),  buildConst(mod, 3n))],
					['5   <  9.2;', CALL.vlt(mod, buildConst(mod, 5n),  buildConst(mod, 9.2))],
					['5   >  9.2;', CALL.vgt(mod, buildConst(mod, 5n),  buildConst(mod, 9.2))],
					['5   <= 9.2;', CALL.vle(mod, buildConst(mod, 5n),  buildConst(mod, 9.2))],
					['5   >= 9.2;', CALL.vge(mod, buildConst(mod, 5n),  buildConst(mod, 9.2))],
					['5.2 <  3;',   CALL.vlt(mod, buildConst(mod, 5.2), buildConst(mod, 3n))],
					['5.2 >  3;',   CALL.vgt(mod, buildConst(mod, 5.2), buildConst(mod, 3n))],
					['5.2 <= 3;',   CALL.vle(mod, buildConst(mod, 5.2), buildConst(mod, 3n))],
					['5.2 >= 3;',   CALL.vge(mod, buildConst(mod, 5.2), buildConst(mod, 3n))],
					['5.2 <  9.2;', CALL.vlt(mod, buildConst(mod, 5.2), buildConst(mod, 9.2))],
					['5.2 >  9.2;', CALL.vgt(mod, buildConst(mod, 5.2), buildConst(mod, 9.2))],
					['5.2 <= 9.2;', CALL.vle(mod, buildConst(mod, 5.2), buildConst(mod, 9.2))],
					['5.2 >= 9.2;', CALL.vge(mod, buildConst(mod, 5.2), buildConst(mod, 9.2))],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryEquality', () => {
		describe('#type', () => {
			context('with folding and int coersion on.', () => {
				it('for numeric literals.', () => {
					typeOperations(new Map([
						[`2 === 3;`,      SolidBoolean.FALSE],
						[`2 !== 3;`,      SolidBoolean.TRUE],
						[`2 == 3;`,       SolidBoolean.FALSE],
						[`2 != 3;`,       SolidBoolean.TRUE],
						[`0 === -0;`,     SolidBoolean.TRUE],
						[`0 == -0;`,      SolidBoolean.TRUE],
						[`0.0 === 0;`,    SolidBoolean.FALSE],
						[`0.0 == 0;`,     SolidBoolean.TRUE],
						[`0.0 === -0;`,   SolidBoolean.FALSE],
						[`0.0 == -0;`,    SolidBoolean.TRUE],
						[`-0.0 === 0;`,   SolidBoolean.FALSE],
						[`-0.0 == 0;`,    SolidBoolean.TRUE],
						[`-0.0 === 0.0;`, SolidBoolean.FALSE],
						[`-0.0 == 0.0;`,  SolidBoolean.TRUE],
					]));
				});
				it('returns the result of `this#fold`, wrapped in a `new SolidTypeUnit`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let a: obj = [];
						let b: obj = [42];
						let c: obj = [x= 42];
						let d: obj = {41 -> 42};
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
						assert.deepStrictEqual(
							expr.type(),
							new SolidTypeUnit(expr.fold()!),
						);
					});
				});
			});
			context('with folding off but int coersion on.', () => {
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource(`7 == 7.0;`, CONFIG_FOLDING_OFF).type(), SolidType.BOOL);
				});
				it('returns `false` if operands are of different numeric types.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource(`7 === 7.0;`, CONFIG_FOLDING_OFF).type(), SolidBoolean.FALSETYPE);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `false` if operands are of different numeric types.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7 == 7.0;`), SolidBoolean.FALSETYPE);
				});
				it('returns `false` if operands are of disjoint types in general.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7 == null;`), SolidBoolean.FALSETYPE);
				});
			});
		});


		describe('#fold', () => {
			it('simple types.', () => {
				foldOperations(new Map([
					[`null === null;`, SolidBoolean.TRUE],
					[`null ==  null;`, SolidBoolean.TRUE],
					[`null === 5;`,    SolidBoolean.FALSE],
					[`null ==  5;`,    SolidBoolean.FALSE],
					[`true === 1;`,    SolidBoolean.FALSE],
					[`true ==  1;`,    SolidBoolean.FALSE],
					[`true === 1.0;`,  SolidBoolean.FALSE],
					[`true ==  1.0;`,  SolidBoolean.FALSE],
					[`true === 5.1;`,  SolidBoolean.FALSE],
					[`true ==  5.1;`,  SolidBoolean.FALSE],
					[`true === true;`, SolidBoolean.TRUE],
					[`true ==  true;`, SolidBoolean.TRUE],
					[`3.0 === 3;`,     SolidBoolean.FALSE],
					[`3.0 ==  3;`,     SolidBoolean.TRUE],
					[`3 === 3.0;`,     SolidBoolean.FALSE],
					[`3 ==  3.0;`,     SolidBoolean.TRUE],
					[`0.0 === 0.0;`,   SolidBoolean.TRUE],
					[`0.0 ==  0.0;`,   SolidBoolean.TRUE],
					[`0.0 === -0.0;`,  SolidBoolean.FALSE],
					[`0.0 ==  -0.0;`,  SolidBoolean.TRUE],
					[`0 === -0;`,      SolidBoolean.TRUE],
					[`0 ==  -0;`,      SolidBoolean.TRUE],
					[`0.0 === 0;`,     SolidBoolean.FALSE],
					[`0.0 ==  0;`,     SolidBoolean.TRUE],
					[`0.0 === -0;`,    SolidBoolean.FALSE],
					[`0.0 ==  -0;`,    SolidBoolean.TRUE],
					[`-0.0 === 0;`,    SolidBoolean.FALSE],
					[`-0.0 ==  0;`,    SolidBoolean.TRUE],
					[`-0.0 === 0.0;`,  SolidBoolean.FALSE],
					[`-0.0 ==  0.0;`,  SolidBoolean.TRUE],
				]));
				Dev.supports('stringConstant-assess') && foldOperations(new Map([
					[`'' == '';`,                               SolidBoolean.TRUE],
					[`'a' === 'a';`,                            SolidBoolean.TRUE],
					[`'a' ==  'a';`,                            SolidBoolean.TRUE],
					[`'hello\\u{20}world' === 'hello world';`,  SolidBoolean.TRUE],
					[`'hello\\u{20}world' ==  'hello world';`,  SolidBoolean.TRUE],
					[`'a' !== 'b';`,                            SolidBoolean.TRUE],
					[`'a' !=  'b';`,                            SolidBoolean.TRUE],
					[`'hello\\u{20}world' !== 'hello20world';`, SolidBoolean.TRUE],
					[`'hello\\u{20}world' !=  'hello20world';`, SolidBoolean.TRUE],
				]));
			});
			it('compound types.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let a: obj = [];
					let b: obj = [42];
					let c: obj = [x= 42];
					let d: obj = List.<int>([]);
					let e: obj = List.<int>([42]);
					let f: obj = Dict.<int>([x= 42]);
					let g: obj = {};
					let h: obj = {42};
					let i: obj = {41 -> 42};

					let bb: obj = [[42]];
					let cc: obj = [x= [42]];
					let hh: obj = {[42]};
					let ii: obj = {[41] -> [42]};

					a !== [];
					b !== [42];
					c !== [x= 42];
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

					bb !== [[42]];
					cc !== [x= [42]];
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
					assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.fold(), SolidBoolean.TRUE, stmt.source);
				});
			});
		});


		describe('#build', () => {
			it('with int coercion on, coerces ints into floats when needed.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 === 420;', CALL.vid(mod, buildConst(mod, 42n), buildConst(mod, 420n))],
					['42 ==  420;', CALL.veq(mod, buildConst(mod, 42n), buildConst(mod, 420n))],
					['42 === 4.2;', CALL.vid(mod, buildConst(mod, 42n), buildConst(mod, 4.2))],
					['42 ==  4.2;', CALL.veq(mod, buildConst(mod, 42n), buildConst(mod, 4.2))],

					['4.2 === 42;',   CALL.vid(mod, buildConst(mod, 4.2), buildConst(mod, 42n))],
					['4.2 ==  42;',   CALL.veq(mod, buildConst(mod, 4.2), buildConst(mod, 42n))],
					['4.2 === 42.0;', CALL.vid(mod, buildConst(mod, 4.2), buildConst(mod, 42.0))],
					['4.2 ==  42.0;', CALL.veq(mod, buildConst(mod, 4.2), buildConst(mod, 42.0))],

					['null === 0;',   CALL.vid(mod, buildConst(mod), buildConst(mod, 0n))],
					['null ==  0;',   CALL.veq(mod, buildConst(mod), buildConst(mod, 0n))],
					['null === 0.0;', CALL.vid(mod, buildConst(mod), buildConst(mod, 0.0))],
					['null ==  0.0;', CALL.veq(mod, buildConst(mod), buildConst(mod, 0.0))],

					['null === false;', CALL.vid(mod, buildConst(mod), buildConst(mod, false))],
					['null ==  false;', CALL.veq(mod, buildConst(mod), buildConst(mod, false))],
					['null === true;',  CALL.vid(mod, buildConst(mod), buildConst(mod, true))],
					['null ==  true;',  CALL.veq(mod, buildConst(mod), buildConst(mod, true))],

					['false === 0;',   CALL.vid(mod, buildConst(mod, false), buildConst(mod, 0n))],
					['false ==  0;',   CALL.veq(mod, buildConst(mod, false), buildConst(mod, 0n))],
					['false === 0.0;', CALL.vid(mod, buildConst(mod, false), buildConst(mod, 0.0))],
					['false ==  0.0;', CALL.veq(mod, buildConst(mod, false), buildConst(mod, 0.0))],

					['true === 1;',   CALL.vid(mod, buildConst(mod, true), buildConst(mod, 1n))],
					['true ==  1;',   CALL.veq(mod, buildConst(mod, true), buildConst(mod, 1n))],
					['true === 1.0;', CALL.vid(mod, buildConst(mod, true), buildConst(mod, 1.0))],
					['true ==  1.0;', CALL.veq(mod, buildConst(mod, true), buildConst(mod, 1.0))],
				]));
			});
			it('with int coercion off, does not coerce ints into floats.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 === 4.2;', CALL.vid (mod, buildConst(mod, 42n), buildConst(mod, 4.2))],
					['42 ==  4.2;', CALL.veqq(mod, buildConst(mod, 42n), buildConst(mod, 4.2))],

					['4.2 === 42;', CALL.vid (mod, buildConst(mod, 4.2), buildConst(mod, 42n))],
					['4.2 ==  42;', CALL.veqq(mod, buildConst(mod, 4.2), buildConst(mod, 42n))],

					['null === 0.0;', CALL.vid  (mod, buildConst(mod), buildConst(mod, 0.0))],
					['null ==  0.0;', CALL.veqq (mod, buildConst(mod), buildConst(mod, 0.0))],

					['false === 0.0;', CALL.vid (mod, buildConst(mod, false), buildConst(mod, 0.0))],
					['false ==  0.0;', CALL.veqq(mod, buildConst(mod, false), buildConst(mod, 0.0))],

					['true === 1.0;', CALL.vid (mod, buildConst(mod, true), buildConst(mod, 1.0))],
					['true ==  1.0;', CALL.veqq(mod, buildConst(mod, true), buildConst(mod, 1.0))],
				]), CONFIG_FOLDING_COERCION_OFF);
			});
		});
	});



	describe('ASTNodeOperationBinaryLogical', () => {
		describe('#type', () => {
			it('with constant folding on.', () => {
				typeOperations(new Map<string, SolidObject>([
					[`null  && false;`, SolidNull.NULL],
					[`false && null;`,  SolidBoolean.FALSE],
					[`true  && null;`,  SolidNull.NULL],
					[`false && 42;`,    SolidBoolean.FALSE],
					[`4.2   && true;`,  SolidBoolean.TRUE],
					[`null  || false;`, SolidBoolean.FALSE],
					[`false || null;`,  SolidNull.NULL],
					[`true  || null;`,  SolidBoolean.TRUE],
					[`false || 42;`,    new Int16(42n)],
					[`4.2   || true;`,  new Float64(4.2)],
				]));
			});
			context('with constant folding off.', () => {
				describe('[operator=AND]', () => {
					it('returns `left` if it’s a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null = null;
							let unfixed b: null | false = null;
							let unfixed c: null | void = null;
							a && 42;
							b && 42;
							c && 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(3).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidType.NULL,
							SolidType.NULL.union(SolidBoolean.FALSETYPE),
							SolidType.NULL.union(SolidType.VOID),
						]);
					});
					it('returns `T | right` if left is a supertype of `T narrows void | null | false`.', () => {
						const hello: SolidTypeUnit<SolidString> = typeConstStr('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = 'hello';
							a && 'hello';
							b && 'hello';
							c && 'hello';
							d && 'hello';
							e && 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(5).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidType.NULL.union(hello),
							SolidType.NULL.union(hello),
							SolidBoolean.FALSETYPE.union(hello),
							SolidBoolean.FALSETYPE.union(hello),
							SolidType.VOID.union(typeConstInt(42n)),
						]);
					});
					it('returns `right` if left does not contain `void` nor `null` nor `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: int = 42;
							let unfixed b: float = 4.2;
							a && true;
							b && null;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidBoolean.TRUETYPE,
							SolidType.NULL,
						]);
					});
				});
				describe('[operator=OR]', () => {
					it('returns `right` if it’s a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null = null;
							let unfixed b: null | false = null;
							let unfixed c: null | void = null;
							a || false;
							b || 42;
							c || 4.2;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(3).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidBoolean.FALSETYPE,
							typeConstInt(42n),
							typeConstFloat(4.2),
						]);
					});
					it('returns `(left - T) | right` if left is a supertype of `T narrows void | null | false`.', () => {
						const hello: SolidTypeUnit<SolidString> = typeConstStr('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = 'hello';
							a || 'hello';
							b || 'hello';
							c || 'hello';
							d || 'hello';
							e || 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assertEqualTypes(goal.children.slice(5).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidType.INT.union(hello),
							SolidType.INT.union(hello),
							SolidBoolean.TRUETYPE.union(hello),
							SolidBoolean.TRUETYPE.union(SolidType.FLOAT).union(hello),
							SolidType.STR.union(typeConstInt(42n)),
						]);
					});
					it('returns `left` if it does not contain `void` nor `null` nor `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: int = 42;
							let unfixed b: float = 4.2;
							a || true;
							b || null;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidType.INT,
							SolidType.FLOAT,
						]);
					});
				});
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, SolidObject>([
				[`null && 5;`,     SolidNull.NULL],
				[`null || 5;`,     new Int16(5n)],
				[`5 && null;`,     SolidNull.NULL],
				[`5 || null;`,     new Int16(5n)],
				[`5.1 && true;`,   SolidBoolean.TRUE],
				[`5.1 || true;`,   new Float64(5.1)],
				[`3.1 && 5;`,      new Int16(5n)],
				[`3.1 || 5;`,      new Float64(3.1)],
				[`false && null;`, SolidBoolean.FALSE],
				[`false || null;`, SolidNull.NULL],
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
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 && 420;', create_if(
						mod,
						[0, buildConst(mod, 42n), binaryen.v128],
						(getter) => [buildConst(mod, 420n), getter],
					)],
					['4.2 || -420;', create_if(
						mod,
						[0, buildConst(mod, 4.2), binaryen.v128],
						(getter) => [getter, buildConst(mod, -420n)],
					)],
					['null && 201.0e-1;', create_if(
						mod,
						[0, buildConst(mod), binaryen.v128],
						(getter) => [buildConst(mod, 20.1), getter],
					)],
					['false || null;', create_if(
						mod,
						[0, buildConst(mod, false), binaryen.v128],
						(getter) => [getter, buildConst(mod)],
					)],
					['true && 201.0e-1;', create_if(
						mod,
						[0, buildConst(mod, true), binaryen.v128],
						(getter) => [buildConst(mod, 20.1), getter],
					)],
				]));
			});

			it('counts internal variables correctly.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['1 && 2 || 3 && 4;', create_if(
						mod,
						[2, create_if(
							mod,
							[0, buildConst(mod, 1n), binaryen.v128],
							(getter) => [buildConst(mod, 2n), getter],
						), binaryen.v128],
						(getter) => [getter, create_if(
							mod,
							[1, buildConst(mod, 3n), binaryen.v128],
							(getter_) => [buildConst(mod, 4n), getter_],
						)],
					)],
					['1 && 2.0 || 3 && 4.0;', create_if(
						mod,
						[2, create_if(
							mod,
							[0, buildConst(mod, 1n), binaryen.v128],
							(getter) => [buildConst(mod, 2.0), getter],
						), binaryen.v128],
						(getter) => [
							getter,
							create_if(
								mod,
								[1, buildConst(mod, 3n), binaryen.v128],
								(getter_) => [buildConst(mod, 4.0), getter_],
							),
						],
					)],
				]));
			});

			it('nested unions.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['1 && 2.0 || 3.0 && 4;', create_if(
						mod,
						[2, create_if(
							mod,
							[0, buildConst(mod, 1n), binaryen.v128],
							(getter) => [buildConst(mod, 2.0), getter],
						), binaryen.v128],
						(getter) => [
							getter,
							create_if(
								mod,
								[1, buildConst(mod, 3.0), binaryen.v128],
								(getter_) => [buildConst(mod, 4n), getter_],
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
					typeOperations(new Map<string, SolidObject>([
						[`if true then false else 2;`,          SolidBoolean.FALSE],
						[`if false then 3.0 else null;`,        SolidNull.NULL],
						[`if true then 2 else 3.0;`,            new Int16(2n)],
						[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
					]));
				});
			});
			it('throws when condition is not boolean.', () => {
				assert.throws(() => AST.ASTNodeOperationTernary.fromSource(`if 2 then true else false;`).type(), TypeError01);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, SolidObject>([
				[`if true then false else 2;`,          SolidBoolean.FALSE],
				[`if false then 3.0 else null;`,        SolidNull.NULL],
				[`if true then 2 else 3.0;`,            new Int16(2n)],
				[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
			]));
		});


		describe('#build', () => {
			it('returns `(if)`.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['if true  then false else 2;',    mod.if(buildConst(mod, true),  buildConst(mod, false), buildConst(mod, 2n))],
					['if true  then 2     else 3.0;',  mod.if(buildConst(mod, true),  buildConst(mod, 2n),    buildConst(mod, 3.0))],
					['if false then 3.0   else null;', mod.if(buildConst(mod, false), buildConst(mod, 3.0),   buildConst(mod))],
				]));
			});
		});
	});
});
