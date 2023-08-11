import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	OBJ,
	TYPE,
	Builder,
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
	CONFIG_FOLDING_COERCION_OFF,
	typeUnitInt,
	typeUnitFloat,
	typeUnitStr,
	buildConstInt,
	buildConstFloat,
	buildConvert,
} from '../../helpers.js';



function typeOperations(tests: ReadonlyMap<string, OBJ.Primitive>, config: CPConfig = CONFIG_DEFAULT): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).type()),
		[...tests.values()].map((expected) => new TYPE.TypeUnit(expected)),
	);
}
function foldOperations(tests: Map<string, OBJ.Object>): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src).fold()),
		[...tests.values()],
	);
}
function buildOperations(tests: ReadonlyMap<string, binaryen.ExpressionRef>, config: CPConfig = CONFIG_FOLDING_OFF): void {
	return assertEqualBins(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).build(new Builder(src, config))),
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



	describe('#build', () => {
		it('compound expression.', () => {
			const mod = new binaryen.Module();
			return buildOperations(new Map([
				['42 ^ 2 * 420;', mod.i32.mul(
					mod.call('exp', [buildConstInt(42n, mod), buildConstInt(2n, mod)], binaryen.i32),
					buildConstInt(420n, mod),
				)],
				['2 * 3.0 + 5;', mod.f64.add(
					mod.f64.mul(buildConvert(2n, mod), buildConstFloat(3.0, mod)),
					buildConvert(5n, mod),
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
							assert.deepStrictEqual(typeOfStmtExpr(stmt), OBJ.Boolean.TRUETYPE);
						});
					});
					it('returns type `bool` for a supertype of `void` or a supertype of `null` or a supertype of `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = "hello";
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
							let unfixed a: int = 42;
							let unfixed b: float = 4.2;
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
			function callUnaryOp(mod: binaryen.Module, name: string, arg: binaryen.ExpressionRef): binaryen.ExpressionRef {
				return mod.call(name, [arg], binaryen.i32);
			}
			it('returns the correct operation.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['!null;',  callUnaryOp(mod, 'inot', buildConstInt   (0n,  mod))],
					['!false;', callUnaryOp(mod, 'inot', buildConstInt   (0n,  mod))],
					['!true;',  callUnaryOp(mod, 'inot', buildConstInt   (1n,  mod))],
					['!42;',    callUnaryOp(mod, 'inot', buildConstInt   (42n, mod))],
					['!4.2;',   callUnaryOp(mod, 'fnot', buildConstFloat (4.2, mod))],
					['?null;',  callUnaryOp(mod, 'iemp', buildConstInt   (0n,  mod))],
					['?false;', callUnaryOp(mod, 'iemp', buildConstInt   (0n,  mod))],
					['?true;',  callUnaryOp(mod, 'iemp', buildConstInt   (1n,  mod))],
					['?42;',    callUnaryOp(mod, 'iemp', buildConstInt   (42n, mod))],
					['?4.2;',   callUnaryOp(mod, 'femp', buildConstFloat (4.2, mod))],
					['-(4);',   callUnaryOp(mod, 'neg',  buildConstInt   (4n,  mod))],
					['-(4.2);', mod.f64.neg(buildConstFloat(4.2, mod))],
				]));
			});
			it('works with Either<Left, Right>.', () => {
				const src = `
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;
					!x; % should return \`Either [left,  $inot(42), $fnot(0.0)]\`
					?x; % should return \`Either [left,  $iemp(42), $femp(0.0)]\`
					-x; % should return \`Either [left,  $neg(42),  f64.neg(0.0)]\`
					!y; % should return \`Either [right, $inot(0),  $fnot(4.2)]\`
					?y; % should return \`Either [right, $iemp(0),  $femp(4.2)]\`
					-y; % should return \`Either [right, $neg(0),   f64.neg(4.2)]\`
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder = new Builder(src);
				goal.varCheck();
				goal.typeCheck();
				goal.build(builder);
				const extracts: binaryen.ExpressionRef[][] = goal.children.slice(2).map((stmt) => [0, 1, 2].map((i) => builder.module.tuple.extract(
					((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand.build(builder),
					i,
				)));
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build(builder)),
					[
						Builder.createBinEither(builder.module, extracts[0][0], callUnaryOp(builder.module, 'inot', extracts[0][1]), callUnaryOp(builder.module, 'fnot', extracts[0][2])),
						Builder.createBinEither(builder.module, extracts[1][0], callUnaryOp(builder.module, 'iemp', extracts[1][1]), callUnaryOp(builder.module, 'femp', extracts[1][2])),
						Builder.createBinEither(builder.module, extracts[2][0], callUnaryOp(builder.module, 'neg',  extracts[2][1]), builder.module.f64.neg(extracts[2][2])),
						Builder.createBinEither(builder.module, extracts[3][0], callUnaryOp(builder.module, 'inot', extracts[3][1]), callUnaryOp(builder.module, 'fnot', extracts[3][2])),
						Builder.createBinEither(builder.module, extracts[4][0], callUnaryOp(builder.module, 'iemp', extracts[4][1]), callUnaryOp(builder.module, 'femp', extracts[4][2])),
						Builder.createBinEither(builder.module, extracts[5][0], callUnaryOp(builder.module, 'neg',  extracts[5][1]), builder.module.f64.neg(extracts[5][2])),
					].map((expected) => builder.module.drop(expected)),
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


		specify('#build', () => {
			const mod = new binaryen.Module();
			buildOperations(new Map<string, binaryen.ExpressionRef>([
				['42 + 420;', mod.i32.add(buildConstInt (42n, mod), buildConstInt   (420n, mod))],
				['3 * 2.1;',  mod.f64.mul(buildConvert  (3n,  mod), buildConstFloat (2.1,  mod))],
			]));
			return buildOperations(new Map<string, binaryen.ExpressionRef>([
				[' 126 /  3;', mod.i32.div_s(buildConstInt( 126n, mod), buildConstInt( 3n, mod))],
				['-126 /  3;', mod.i32.div_s(buildConstInt(-126n, mod), buildConstInt( 3n, mod))],
				[' 126 / -3;', mod.i32.div_s(buildConstInt( 126n, mod), buildConstInt(-3n, mod))],
				['-126 / -3;', mod.i32.div_s(buildConstInt(-126n, mod), buildConstInt(-3n, mod))],
				[' 200 /  3;', mod.i32.div_s(buildConstInt( 200n, mod), buildConstInt( 3n, mod))],
				[' 200 / -3;', mod.i32.div_s(buildConstInt( 200n, mod), buildConstInt(-3n, mod))],
				['-200 /  3;', mod.i32.div_s(buildConstInt(-200n, mod), buildConstInt( 3n, mod))],
				['-200 / -3;', mod.i32.div_s(buildConstInt(-200n, mod), buildConstInt(-3n, mod))],
			]));
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


		specify('#build', () => {
			const mod = new binaryen.Module();
			return buildOperations(new Map<string, binaryen.ExpressionRef>([
				['3   <  3;',   mod.i32.lt_s (buildConstInt   (3n,  mod), buildConstInt   (3n,  mod))],
				['3   >  3;',   mod.i32.gt_s (buildConstInt   (3n,  mod), buildConstInt   (3n,  mod))],
				['3   <= 3;',   mod.i32.le_s (buildConstInt   (3n,  mod), buildConstInt   (3n,  mod))],
				['3   >= 3;',   mod.i32.ge_s (buildConstInt   (3n,  mod), buildConstInt   (3n,  mod))],
				['5   <  9.2;', mod.f64.lt   (buildConvert    (5n,  mod), buildConstFloat (9.2, mod))],
				['5   >  9.2;', mod.f64.gt   (buildConvert    (5n,  mod), buildConstFloat (9.2, mod))],
				['5   <= 9.2;', mod.f64.le   (buildConvert    (5n,  mod), buildConstFloat (9.2, mod))],
				['5   >= 9.2;', mod.f64.ge   (buildConvert    (5n,  mod), buildConstFloat (9.2, mod))],
				['5.2 <  3;',   mod.f64.lt   (buildConstFloat (5.2, mod), buildConvert    (3n,  mod))],
				['5.2 >  3;',   mod.f64.gt   (buildConstFloat (5.2, mod), buildConvert    (3n,  mod))],
				['5.2 <= 3;',   mod.f64.le   (buildConstFloat (5.2, mod), buildConvert    (3n,  mod))],
				['5.2 >= 3;',   mod.f64.ge   (buildConstFloat (5.2, mod), buildConvert    (3n,  mod))],
				['5.2 <  9.2;', mod.f64.lt   (buildConstFloat (5.2, mod), buildConstFloat (9.2, mod))],
				['5.2 >  9.2;', mod.f64.gt   (buildConstFloat (5.2, mod), buildConstFloat (9.2, mod))],
				['5.2 <= 9.2;', mod.f64.le   (buildConstFloat (5.2, mod), buildConstFloat (9.2, mod))],
				['5.2 >= 9.2;', mod.f64.ge   (buildConstFloat (5.2, mod), buildConstFloat (9.2, mod))],
			]));
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
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 === 420;', mod.i32.eq (           buildConstInt (42n, mod), buildConstInt   (420n, mod))],
					['42 ==  420;', mod.i32.eq (           buildConstInt (42n, mod), buildConstInt   (420n, mod))],
					['42 === 4.2;', mod.call   ('i_f_id', [buildConstInt (42n, mod), buildConstFloat (4.2,  mod)], binaryen.i32)],
					['42 ==  4.2;', mod.f64.eq (           buildConvert  (42n, mod), buildConstFloat (4.2,  mod))],

					['4.2 === 42;',   mod.call   ('f_i_id', [buildConstFloat(4.2, mod), buildConstInt   (42n,  mod)], binaryen.i32)],
					['4.2 ==  42;',   mod.f64.eq (           buildConstFloat(4.2, mod), buildConvert    (42n,  mod))],
					['4.2 === 42.0;', mod.call   ('fid',    [buildConstFloat(4.2, mod), buildConstFloat (42.0, mod)], binaryen.i32)],
					['4.2 ==  42.0;', mod.f64.eq (           buildConstFloat(4.2, mod), buildConstFloat (42.0, mod))],

					['null === 0;',   mod.i32.eq (           buildConstInt (0n, mod), buildConstInt   (0n,  mod))],
					['null ==  0;',   mod.i32.eq (           buildConstInt (0n, mod), buildConstInt   (0n,  mod))],
					['null === 0.0;', mod.call   ('i_f_id', [buildConstInt (0n, mod), buildConstFloat (0.0, mod)], binaryen.i32)],
					['null ==  0.0;', mod.f64.eq (           buildConvert  (0n, mod), buildConstFloat (0.0, mod))],

					['false === 0;',   mod.i32.eq (           buildConstInt (0n, mod), buildConstInt  (0n,  mod))],
					['false ==  0;',   mod.i32.eq (           buildConstInt (0n, mod), buildConstInt  (0n,  mod))],
					['false === 0.0;', mod.call   ('i_f_id', [buildConstInt (0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],
					['false ==  0.0;', mod.f64.eq (           buildConvert  (0n, mod), buildConstFloat(0.0, mod))],

					['true === 1;',   mod.i32.eq (           buildConstInt (1n, mod), buildConstInt   (1n,  mod))],
					['true ==  1;',   mod.i32.eq (           buildConstInt (1n, mod), buildConstInt   (1n,  mod))],
					['true === 1.0;', mod.call   ('i_f_id', [buildConstInt (1n, mod), buildConstFloat (1.0, mod)], binaryen.i32)],
					['true ==  1.0;', mod.f64.eq (           buildConvert  (1n, mod), buildConstFloat (1.0, mod))],

					['null === false;', mod.i32.eq(buildConstInt(0n, mod), buildConstInt(0n, mod))],
					['null ==  false;', mod.i32.eq(buildConstInt(0n, mod), buildConstInt(0n, mod))],
					['null === true;',  mod.i32.eq(buildConstInt(0n, mod), buildConstInt(1n, mod))],
					['null ==  true;',  mod.i32.eq(buildConstInt(0n, mod), buildConstInt(1n, mod))],
				]));
			});
			it('with int coercion off, does not coerce ints into floats.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 === 4.2;', mod.call('i_f_id', [buildConstInt(42n, mod), buildConstFloat(4.2, mod)], binaryen.i32)],
					['42 ==  4.2;', mod.call('i_f_id', [buildConstInt(42n, mod), buildConstFloat(4.2, mod)], binaryen.i32)],

					['4.2 === 42;',   mod.call('f_i_id', [buildConstFloat(4.2, mod), buildConstInt(42n, mod)], binaryen.i32)],
					['4.2 ==  42;',   mod.call('f_i_id', [buildConstFloat(4.2, mod), buildConstInt(42n, mod)], binaryen.i32)],

					['null === 0.0;', mod.call('i_f_id', [buildConstInt(0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],
					['null ==  0.0;', mod.call('i_f_id', [buildConstInt(0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],

					['false === 0.0;', mod.call('i_f_id', [buildConstInt(0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],
					['false ==  0.0;', mod.call('i_f_id', [buildConstInt(0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],

					['true === 1.0;', mod.call('i_f_id', [buildConstInt(1n, mod), buildConstFloat(1.0, mod)], binaryen.i32)],
					['true ==  1.0;', mod.call('i_f_id', [buildConstInt(1n, mod), buildConstFloat(1.0, mod)], binaryen.i32)],
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
							TYPE.NULL,
							TYPE.NULL.union(OBJ.Boolean.FALSETYPE),
							TYPE.NULL.union(TYPE.VOID),
						]);
					});
					it('returns `T | right` if left is a supertype of `T narrows void | null | false`.', () => {
						const hello: TYPE.TypeUnit<OBJ.String> = typeUnitStr('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = "hello";
							a && "hello";
							b && "hello";
							c && "hello";
							d && "hello";
							e && 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(5).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL.union(hello),
							TYPE.NULL.union(hello),
							OBJ.Boolean.FALSETYPE.union(hello),
							OBJ.Boolean.FALSETYPE.union(hello),
							TYPE.VOID.union(typeUnitInt(42n)),
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
							OBJ.Boolean.TRUETYPE,
							TYPE.NULL,
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
							OBJ.Boolean.FALSETYPE,
							typeUnitInt(42n),
							typeUnitFloat(4.2),
						]);
					});
					it('returns `(left - T) | right` if left is a supertype of `T narrows void | null | false`.', () => {
						const hello: TYPE.TypeUnit<OBJ.String> = typeUnitStr('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = "hello";
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
							let unfixed a: int = 42;
							let unfixed b: float = 4.2;
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
			 * Given a value to tee and a callback to perform giving the branches,
			 * return an `(if)` whose condition is the double-negated teed variable
			 * and whose branches are given by the callback.
			 * @param mod      the module to perform the conditional
			 * @param tee      parameters for teeing the value:
			 *                 [
			 *                 	the local index to tee the value,
			 *                 	the value,
			 *                 	the value’s type,
			 *                 ]
			 * @param branches the callback to perform; given a getter, returns two branches: [if_true, if_false]
			 * @return         the new `(if)` expression
			 */
			function create_if(
				mod:                binaryen.Module,
				[index, arg, type]: [index: number, arg: binaryen.ExpressionRef, type: binaryen.Type],
				branches:           (local_get: binaryen.ExpressionRef) => [binaryen.ExpressionRef, binaryen.ExpressionRef],
			): binaryen.ExpressionRef {
				const local_get: binaryen.ExpressionRef = mod.local.get(index, type);
				return mod.if(
					mod.i32.eqz(mod.call(
						(type === binaryen.i32) ? 'inot' : 'fnot',
						[mod.local.tee(index, arg, type)],
						binaryen.i32,
					)),
					...branches.call(null, local_get),
				);
			}
			it('returns a special case of `(if)`.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 && 420;', create_if(
						mod,
						[0, buildConstInt(42n, mod), binaryen.i32],
						(getter) => [buildConstInt(420n, mod), getter],
					)],
					['4.2 || -420;', create_if(
						mod,
						[0, buildConstFloat(4.2, mod), binaryen.f64],
						(getter) => [getter, buildConvert(-420n, mod)],
					)],
					['null && 201.0e-1;', create_if(
						mod,
						[0, buildConstInt(0n, mod), binaryen.i32],
						(getter) => [buildConstFloat(20.1, mod), mod.f64.convert_u.i32(getter)],
					)],
					['true && 201.0e-1;', create_if(
						mod,
						[0, buildConstInt(1n, mod), binaryen.i32],
						(getter) => [buildConstFloat(20.1, mod), mod.f64.convert_u.i32(getter)],
					)],
					['false || null;', create_if(
						mod,
						[0, buildConstInt(0n, mod), binaryen.i32],
						(getter) => [getter, buildConstInt(0n, mod)],
					)],
				]));
			});
			it('counts internal variables correctly.', () => {
				const src = '1 && 2 || 3 && 4;';
				const builder = new Builder(src, CONFIG_FOLDING_OFF);
				return assertEqualBins(
					AST.ASTNodeOperationBinaryLogical.fromSource(src, CONFIG_FOLDING_OFF).build(builder),
					create_if(
						builder.module,
						[2, create_if(
							builder.module,
							[0, buildConstInt(1n, builder.module), binaryen.i32],
							(getter) => [buildConstInt(2n, builder.module), getter],
						), binaryen.i32],
						(getter) => [getter, create_if(
							builder.module,
							[1, buildConstInt(3n, builder.module), binaryen.i32],
							(getter_) => [buildConstInt(4n, builder.module), getter_],
						)],
					),
				);
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
			it('returns `never` when condition is `never`.', () => {
				assert.ok(AST.ASTNodeOperationTernary.fromSource('if <never>n then true else false;').type().isBottomType);
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
			it('returns `(mod.if)`.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['if true  then false else 2;',    mod.if(buildConstInt(1n, mod), buildConstInt   (0n,  mod), buildConstInt   (2n,  mod))],
					['if false then 3.0   else null;', mod.if(buildConstInt(0n, mod), buildConstFloat (3.0, mod), buildConvert    (0n,  mod))],
					['if true  then 2     else 3.0;',  mod.if(buildConstInt(1n, mod), buildConvert    (2n,  mod), buildConstFloat (3.0, mod))],
				]));
			});
		});
	});
});
