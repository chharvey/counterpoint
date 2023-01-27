import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Operator,
	ASTNODE_SOLID as AST,
	SolidType,
	SolidTypeUnit,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	INST,
	Builder,
	TypeError01,
	NanError01,
} from '../../../src/index.js';
import {forEachAggregated} from '../../../src/lib/index.js';
import {
	assertEqualTypes,
	assertBinEqual,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	typeConstInt,
	typeConstFloat,
	typeConstStr,
	instructionConstInt,
	instructionConstFloat,
	instructionConvert,
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
function buildOperations(tests: ReadonlyMap<string, INST.InstructionExpression>): void {
	assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).build(new Builder(src, CONFIG_FOLDING_OFF))),
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
			buildOperations(new Map([
				[`42 ^ 2 * 420;`, new INST.InstructionBinopArithmetic(
					Operator.MUL,
					new INST.InstructionBinopArithmetic(
						Operator.EXP,
						instructionConstInt(42n),
						instructionConstInt(2n),
					),
					instructionConstInt(420n),
				)],
				[`2 * 3.0 + 5;`, new INST.InstructionBinopArithmetic(
					Operator.ADD,
					new INST.InstructionBinopArithmetic(
						Operator.MUL,
						instructionConvert(2n),
						instructionConstFloat(3.0),
					),
					instructionConvert(5n),
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
			it('returns InstructionUnop.', () => {
				buildOperations(new Map<string, INST.InstructionUnop>([
					[`!null;`,  new INST.InstructionUnop(Operator.NOT, instructionConstInt(0n))],
					[`!false;`, new INST.InstructionUnop(Operator.NOT, instructionConstInt(0n))],
					[`!true;`,  new INST.InstructionUnop(Operator.NOT, instructionConstInt(1n))],
					[`!42;`,    new INST.InstructionUnop(Operator.NOT, instructionConstInt(42n))],
					[`!4.2;`,   new INST.InstructionUnop(Operator.NOT, instructionConstFloat(4.2))],
					[`?null;`,  new INST.InstructionUnop(Operator.EMP, instructionConstInt(0n))],
					[`?false;`, new INST.InstructionUnop(Operator.EMP, instructionConstInt(0n))],
					[`?true;`,  new INST.InstructionUnop(Operator.EMP, instructionConstInt(1n))],
					[`?42;`,    new INST.InstructionUnop(Operator.EMP, instructionConstInt(42n))],
					[`?4.2;`,   new INST.InstructionUnop(Operator.EMP, instructionConstFloat(4.2))],
					[`-(4);`,   new INST.InstructionUnop(Operator.NEG, instructionConstInt(4n))],
					[`-(4.2);`, new INST.InstructionUnop(Operator.NEG, instructionConstFloat(4.2))],
				]));
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
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(`-4 ^ -0.5;`).fold(), NanError01);
			});
		});


		describe('#build', () => {
			it('returns InstructionBinopArithmetic.', () => {
				buildOperations(new Map([
					[`42 + 420;`, new INST.InstructionBinopArithmetic(Operator.ADD, instructionConstInt(42n),   instructionConstInt(420n))],
					[`3 * 2.1;`,  new INST.InstructionBinopArithmetic(Operator.MUL, instructionConvert(3n),     instructionConstFloat(2.1))],
				]));
				buildOperations(new Map([
					[' 126 /  3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt( 126n), instructionConstInt( 3n))],
					['-126 /  3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt(-126n), instructionConstInt( 3n))],
					[' 126 / -3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt( 126n), instructionConstInt(-3n))],
					['-126 / -3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt(-126n), instructionConstInt(-3n))],
					[' 200 /  3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt( 200n), instructionConstInt( 3n))],
					[' 200 / -3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt( 200n), instructionConstInt(-3n))],
					['-200 /  3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt(-200n), instructionConstInt( 3n))],
					['-200 / -3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt(-200n), instructionConstInt(-3n))],
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
			const instr = {
				const: {
					'42':   instructionConstInt(42n),
					'420':  instructionConstInt(420n),
					'4.2':  instructionConstFloat(4.2),
					'42.0': instructionConstFloat(42.0),
					'0':    instructionConstInt(0n),
					'1':    instructionConstInt(1n),
					'0.0':  instructionConstFloat(0.0),
					'1.0':  instructionConstFloat(1.0),
				},
				convert: {
					'42':  instructionConvert(42n),
					'420': instructionConstInt(420n),
					'0':   instructionConvert(0n),
					'1':   instructionConvert(1n),
				},
			} as const;
			it('with int coercion on, coerces ints into floats when needed.', () => {
				forEachAggregated([...new Map<string, (mod: binaryen.Module) => binaryen.ExpressionRef>([
					['42 === 420;', (mod) => mod.i32.eq (           instr.const['42']   .buildBin(mod), instr.const['420'].buildBin(mod))],
					['42 ==  420;', (mod) => mod.i32.eq (           instr.const['42']   .buildBin(mod), instr.const['420'].buildBin(mod))],
					['42 === 4.2;', (mod) => mod.call   ('i_f_id', [instr.const['42']   .buildBin(mod), instr.const['4.2'].buildBin(mod)], binaryen.i32)],
					['42 ==  4.2;', (mod) => mod.f64.eq (           instr.convert['42'] .buildBin(mod), instr.const['4.2'].buildBin(mod))],

					['4.2 === 42;',   (mod) => mod.call   ('f_i_id', [instr.const['4.2'].buildBin(mod), instr.const['42']   .buildBin(mod)], binaryen.i32)],
					['4.2 ==  42;',   (mod) => mod.f64.eq (           instr.const['4.2'].buildBin(mod), instr.convert['42'] .buildBin(mod))],
					['4.2 === 42.0;', (mod) => mod.call   ('fid',    [instr.const['4.2'].buildBin(mod), instr.const['42.0'] .buildBin(mod)], binaryen.i32)],
					['4.2 ==  42.0;', (mod) => mod.f64.eq (           instr.const['4.2'].buildBin(mod), instr.const['42.0'] .buildBin(mod))],

					['null === 0;',   (mod) => mod.i32.eq (           instr.const['0']   .buildBin(mod), instr.const['0']   .buildBin(mod))],
					['null ==  0;',   (mod) => mod.i32.eq (           instr.const['0']   .buildBin(mod), instr.const['0']   .buildBin(mod))],
					['null === 0.0;', (mod) => mod.call   ('i_f_id', [instr.const['0']   .buildBin(mod), instr.const['0.0'] .buildBin(mod)], binaryen.i32)],
					['null ==  0.0;', (mod) => mod.f64.eq (           instr.convert['0'] .buildBin(mod), instr.const['0.0'] .buildBin(mod))],

					['false === 0;',   (mod) => mod.i32.eq (           instr.const['0']   .buildBin(mod), instr.const['0']   .buildBin(mod))],
					['false ==  0;',   (mod) => mod.i32.eq (           instr.const['0']   .buildBin(mod), instr.const['0']   .buildBin(mod))],
					['false === 0.0;', (mod) => mod.call   ('i_f_id', [instr.const['0']   .buildBin(mod), instr.const['0.0'] .buildBin(mod)], binaryen.i32)],
					['false ==  0.0;', (mod) => mod.f64.eq (           instr.convert['0'] .buildBin(mod), instr.const['0.0'] .buildBin(mod))],

					['true === 1;',   (mod) => mod.i32.eq (           instr.const['1']   .buildBin(mod), instr.const['1']   .buildBin(mod))],
					['true ==  1;',   (mod) => mod.i32.eq (           instr.const['1']   .buildBin(mod), instr.const['1']   .buildBin(mod))],
					['true === 1.0;', (mod) => mod.call   ('i_f_id', [instr.const['1']   .buildBin(mod), instr.const['1.0'] .buildBin(mod)], binaryen.i32)],
					['true ==  1.0;', (mod) => mod.f64.eq (           instr.convert['1'] .buildBin(mod), instr.const['1.0'] .buildBin(mod))],

					['null === false;', (mod) => mod.i32.eq(instr.const['0'].buildBin(mod), instr.const['0'].buildBin(mod))],
					['null ==  false;', (mod) => mod.i32.eq(instr.const['0'].buildBin(mod), instr.const['0'].buildBin(mod))],
					['null === true;',  (mod) => mod.i32.eq(instr.const['0'].buildBin(mod), instr.const['1'].buildBin(mod))],
					['null ==  true;',  (mod) => mod.i32.eq(instr.const['0'].buildBin(mod), instr.const['1'].buildBin(mod))],
				])], ([src, callback]) => {
					const builder = new Builder(src, CONFIG_FOLDING_OFF);
					return assertBinEqual(
						AST.ASTNodeOperationBinaryEquality.fromSource(src, CONFIG_FOLDING_OFF).build__temp(builder),
						callback(builder.module),
					);
				});
			});
			it('with int coercion off, does not coerce ints into floats.', () => {
				forEachAggregated([...new Map<string, (mod: binaryen.Module) => binaryen.ExpressionRef>([
					['42 === 4.2;', (mod) => mod.call('i_f_id', [instr.const['42'].buildBin(mod), instr.const['4.2'].buildBin(mod)], binaryen.i32)],
					['42 ==  4.2;', (mod) => mod.call('i_f_id', [instr.const['42'].buildBin(mod), instr.const['4.2'].buildBin(mod)], binaryen.i32)],

					['4.2 === 42;', (mod) => mod.call('f_i_id', [instr.const['4.2'].buildBin(mod), instr.const['42'].buildBin(mod)], binaryen.i32)],
					['4.2 ==  42;', (mod) => mod.call('f_i_id', [instr.const['4.2'].buildBin(mod), instr.const['42'].buildBin(mod)], binaryen.i32)],

					['null === 0.0;', (mod) => mod.call('i_f_id', [instr.const['0'].buildBin(mod), instr.const['0.0'].buildBin(mod)], binaryen.i32)],
					['null ==  0.0;', (mod) => mod.call('i_f_id', [instr.const['0'].buildBin(mod), instr.const['0.0'].buildBin(mod)], binaryen.i32)],

					['false === 0.0;', (mod) => mod.call('i_f_id', [instr.const['0'].buildBin(mod), instr.const['0.0'].buildBin(mod)], binaryen.i32)],
					['false ==  0.0;', (mod) => mod.call('i_f_id', [instr.const['0'].buildBin(mod), instr.const['0.0'].buildBin(mod)], binaryen.i32)],

					['true === 1.0;', (mod) => mod.call('i_f_id', [instr.const['1'].buildBin(mod), instr.const['1.0'].buildBin(mod)], binaryen.i32)],
					['true ==  1.0;', (mod) => mod.call('i_f_id', [instr.const['1'].buildBin(mod), instr.const['1.0'].buildBin(mod)], binaryen.i32)],
				])], ([src, callback]) => {
					const builder = new Builder(src, CONFIG_FOLDING_COERCION_OFF);
					return assertBinEqual(
						AST.ASTNodeOperationBinaryEquality.fromSource(src, CONFIG_FOLDING_COERCION_OFF).build__temp(builder),
						callback(builder.module),
					);
				});
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
			function buildBinopLogical(
				mod:       binaryen.Module,
				operator:  Operator,
				arg0:      binaryen.ExpressionRef,
				arg1:      binaryen.ExpressionRef,
				arg0_type: binaryen.Type = binaryen.i32,
				var_index: number = 0,
			): binaryen.ExpressionRef {
				const condition = mod.call(
					'inot',
					[mod.call(
						(arg0_type === binaryen.i32) ? 'inot' : 'fnot',
						[mod.local.tee(var_index, arg0, arg0_type)],
						binaryen.i32,
					)],
					binaryen.i32,
				);
				const left:  binaryen.ExpressionRef = mod.local.get(var_index, arg0_type);
				const right: binaryen.ExpressionRef = arg1;
				return (operator === Operator.AND)
					? mod.if(condition, right, left)
					: mod.if(condition, left, right);
			}
			it('returns `(if)`.', () => {
				forEachAggregated([...new Map<string, (mod: binaryen.Module) => binaryen.ExpressionRef>([
					['42 && 420;', (mod) => buildBinopLogical(
						mod,
						Operator.AND,
						instructionConstInt(42n).buildBin(mod),
						instructionConstInt(420n).buildBin(mod),
					)],
					['4.2 || -420;', (mod) => buildBinopLogical(
						mod,
						Operator.OR,
						instructionConstFloat(4.2).buildBin(mod),
						instructionConvert(-420n).buildBin(mod),
						binaryen.f64,
					)],
					['null && 201.0e-1;', (mod) => buildBinopLogical(
						mod,
						Operator.AND,
						instructionConvert(0n).buildBin(mod),
						instructionConstFloat(20.1).buildBin(mod),
						binaryen.f64,
					)],
					['true && 201.0e-1;', (mod) => buildBinopLogical(
						mod,
						Operator.AND,
						instructionConvert(1n).buildBin(mod),
						instructionConstFloat(20.1).buildBin(mod),
						binaryen.f64,
					)],
					['false || null;', (mod) => buildBinopLogical(
						mod,
						Operator.OR,
						instructionConstInt(0n).buildBin(mod),
						instructionConstInt(0n).buildBin(mod),
					)],
				])], ([src, callback]) => {
					const builder = new Builder(src, CONFIG_FOLDING_OFF);
					return assertBinEqual(
						AST.ASTNodeOperationBinaryLogical.fromSource(src, CONFIG_FOLDING_OFF).build__temp(builder),
						callback(builder.module),
					);
				});
			});
			it('counts internal variables correctly.', () => {
				const src: string = `1 && 2 || 3 && 4;`
				const builder = new Builder(src, CONFIG_FOLDING_OFF);
				return assertBinEqual(
					AST.ASTNodeOperationBinaryLogical.fromSource(src, CONFIG_FOLDING_OFF).build__temp(builder),
					buildBinopLogical(
						builder.module,
						Operator.OR,
						buildBinopLogical(
							builder.module,
							Operator.AND,
							instructionConstInt(1n).buildBin(builder.module),
							instructionConstInt(2n).buildBin(builder.module),
							binaryen.i32,
							0,
						),
						buildBinopLogical(
							builder.module,
							Operator.AND,
							instructionConstInt(3n).buildBin(builder.module),
							instructionConstInt(4n).buildBin(builder.module),
							binaryen.i32,
							1,
						),
						binaryen.i32,
						2,
					),
				);
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


		specify('#build', () => {
			forEachAggregated([...new Map<string, (mod: binaryen.Module) => binaryen.ExpressionRef>([
				['if true  then false else 2;',    (mod) => mod.if(instructionConstInt(1n).buildBin(mod), instructionConstInt   (0n)  .buildBin(mod), instructionConstInt   (2n)  .buildBin(mod))],
				['if false then 3.0   else null;', (mod) => mod.if(instructionConstInt(0n).buildBin(mod), instructionConstFloat (3.0) .buildBin(mod), instructionConvert    (0n)  .buildBin(mod))],
				['if true  then 2     else 3.0;',  (mod) => mod.if(instructionConstInt(1n).buildBin(mod), instructionConvert    (2n)  .buildBin(mod), instructionConstFloat (3.0) .buildBin(mod))],
			])], ([src, callback]) => {
				const builder = new Builder(src, CONFIG_FOLDING_OFF);
				return assertBinEqual(
					AST.ASTNodeOperationTernary.fromSource(src, CONFIG_FOLDING_OFF).build__temp(builder),
					callback(builder.module),
				);
			});
		});
	});
});
