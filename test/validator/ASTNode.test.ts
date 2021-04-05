import * as assert from 'assert'
import * as xjs from 'extrajs'

import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
} from '../../src/core/';
import {
	Operator,
} from '../../src/enum/Operator.enum';
import {
	ReferenceError01,
	ReferenceError02,
	ReferenceError03,
	AssignmentError01,
	AssignmentError10,
	TypeError01,
	TypeError03,
	NanError01,
} from '../../src/error/';
import {
	Decorator,
	Validator,
	AST,
	SymbolStructure,
	SymbolStructureType,
	SymbolStructureVar,
	SolidLanguageType,
	SolidTypeConstant,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
} from '../../src/validator/'
import {
	Builder,
	InstructionNone,
	InstructionExpression,
	InstructionConst,
	InstructionUnop,
	InstructionBinopArithmetic,
	InstructionBinopEquality,
	InstructionBinopLogical,
	InstructionCond,
	InstructionStatement,
	InstructionModule,
	INST,
} from '../../src/builder/'
import {
	assert_wasCalled,
} from '../assert-helpers';
import {
	typeConstInt,
	typeConstFloat,
	typeConstStr,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers'
import {
	unitTypeFromString,
	unaryTypeFromString,
	intersectionTypeFromString,
	unionTypeFromString,
	variableDeclarationFromSource,
} from '../helpers-parse'
import {
	variableFromSource,
	templateFromSource,
	operationFromSource,
	statementExpressionFromSource,
	constantFromSource,
	goalFromSource,
} from '../helpers-semantic'



describe('ASTNodeSolid', () => {
	describe('#varCheck', () => {
		describe('ASTNodeTypeAlias', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				goalFromSource(`
					type T = int;
					type U = float | T;
				`).varCheck(new Validator()); // assert does not throw
				assert.throws(() => goalFromSource(`
					type U = float | T;
				`).varCheck(new Validator()), ReferenceError01);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => goalFromSource(`
					T;
					type T = int;
				`).varCheck(new Validator()), ReferenceError02);
			});
			it('throws if was declared as a value variable.', () => {
				assert.throws(() => goalFromSource(`
					let FOO: int = 42;
					type T = FOO | float;
				`).varCheck(new Validator()), ReferenceError03);
			});
		});
		describe('ASTNodeConstant', () => {
			it('never throws.', () => {
				constantFromSource(`42;`).varCheck(new Validator());
			});
		});
		describe('ASTNodeVariable', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				goalFromSource(`
					let unfixed i: int = 42;
					i;
				`).varCheck(new Validator()); // assert does not throw
				assert.throws(() => variableFromSource(`i;`).varCheck(new Validator()), ReferenceError01);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => goalFromSource(`
					i;
					let unfixed i: int = 42;
				`).varCheck(new Validator()), ReferenceError02);
			});
			it('throws if it was declared as a type alias.', () => {
				assert.throws(() => goalFromSource(`
					type FOO = int;
					42 || FOO;
				`).varCheck(new Validator()), ReferenceError03);
			});
		});
		describe('ASTNodeDeclarationType', () => {
			it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown`.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = goalFromSource(`
					type T = int;
				`);
				assert.ok(!validator.hasSymbol(256n))
				goal.varCheck(validator);
				assert.ok(validator.hasSymbol(256n));
				const info: SymbolStructure | null = validator.getSymbolInfo(256n);
				assert.ok(info instanceof SymbolStructureType);
				assert.strictEqual(info.value, SolidLanguageType.UNKNOWN);
			});
			it('throws if the validator already contains a record for the symbol.', () => {
				assert.throws(() => goalFromSource(`
					type T = int;
					type T = float;
				`).varCheck(new Validator()), AssignmentError01);
				assert.throws(() => goalFromSource(`
					let FOO: int = 42;
					type FOO = float;
				`).varCheck(new Validator()), AssignmentError01);
			});
		});
		describe('ASTNodeDeclarationVariable', () => {
			it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = goalFromSource(`
					let x: int = 42;
				`);
				assert.ok(!validator.hasSymbol(256n))
				goal.varCheck(validator);
				assert.ok(validator.hasSymbol(256n));
				const info: SymbolStructure | null = validator.getSymbolInfo(256n);
				assert.ok(info instanceof SymbolStructureVar);
				assert.strictEqual(info.type, SolidLanguageType.UNKNOWN);
				assert.strictEqual(info.value, null);
			});
			it('throws if the validator already contains a record for the variable.', () => {
				assert.throws(() => goalFromSource(`
					let i: int = 42;
					let i: int = 43;
				`).varCheck(new Validator()), AssignmentError01);
				assert.throws(() => goalFromSource(`
					type FOO = float;
					let FOO: int = 42;
				`).varCheck(new Validator()), AssignmentError01);
			});
		});
		describe('ASTNodeAssignment', () => {
			it('throws if the variable is not unfixed.', () => {
				goalFromSource(`
					let unfixed i: int = 42;
					i = 43;
				`).varCheck(new Validator()); // assert does not throw
				assert.throws(() => goalFromSource(`
					let i: int = 42;
					i = 43;
				`).varCheck(new Validator()), AssignmentError10);
			});
			it('always throws for type alias reassignment.', () => {
				assert.throws(() => goalFromSource(`
					type T = 42;
					T = 43;
				`).varCheck(new Validator()), ReferenceError03);
			});
		});
	});


	describe('#typeCheck', () => {
		describe('ASTNodeDeclarationType', () => {
			it('sets `SymbolStructure#value`.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = goalFromSource(`
					type T = int;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.strictEqual(
					(validator.getSymbolInfo(256n) as SymbolStructureType).value,
					Int16,
				);
			});
		});
		describe('ASTNodeDeclarationVariable', () => {
			it('checks the assigned expression’s type against the variable assignee’s type.', () => {
				const src: string = `let  the_answer:  int | float =  21  *  2;`
				const decl: AST.ASTNodeDeclarationVariable = Decorator.decorate(variableDeclarationFromSource(src));
				decl.typeCheck(new Validator());
			})
			it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
				const src: string = `let  the_answer:  null =  21  *  2;`
				const decl: AST.ASTNodeDeclarationVariable = Decorator.decorate(variableDeclarationFromSource(src));
				assert.throws(() => decl.typeCheck(new Validator()), TypeError03);
			})
			it('with int coersion on, allows assigning ints to floats.', () => {
				const src: string = `let x: float = 42;`
				const decl: AST.ASTNodeDeclarationVariable = Decorator.decorate(variableDeclarationFromSource(src));
				decl.typeCheck(new Validator());
			})
			it('with int coersion off, throws when assigning int to float.', () => {
				const src: string = `let x: float = 42;`
				const decl: AST.ASTNodeDeclarationVariable = Decorator.decorate(variableDeclarationFromSource(src));
				assert.throws(() => decl.typeCheck(new Validator({
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						intCoercion: false,
					},
				})), TypeError03);
			})
			it('with constant folding on, sets `SymbolStructure#{type, value}`.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = goalFromSource(`
					let x: int = 42;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.strictEqual(
					(validator.getSymbolInfo(256n) as SymbolStructureVar).type,
					Int16,
				);
				assert.deepStrictEqual(
					(validator.getSymbolInfo(256n) as SymbolStructureVar).value,
					new Int16(42n),
				);
			});
			it('with constant folding off, does nothing to the SymbolStructure.', () => {
				const folding_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						constantFolding: false,
					},
				};
				const validator: Validator = new Validator(folding_off);
				const goal: AST.ASTNodeGoal = goalFromSource(`
					let x: int = 42;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.strictEqual(
					(validator.getSymbolInfo(256n) as SymbolStructureVar).value,
					null,
				);
			});
		})
	})


	describe('#build', () => {
		context('SemanticGoal ::= ()', () => {
			it('returns InstructionNone.', () => {
				const src: string = ``;
				const instr: InstructionNone | InstructionModule = goalFromSource(src).build(new Builder(src));
				assert.ok(instr instanceof InstructionNone)
			})
		})

		describe('ASTNodeStatementExpression', () => {
			it('returns InstructionNone for empty statement expression.', () => {
				const src: string = `;`;
				const instr: InstructionNone | InstructionStatement = statementExpressionFromSource(src)
					.build(new Builder(src))
				assert.ok(instr instanceof InstructionNone)
			})
			it('returns InstructionStatement for nonempty statement expression.', () => {
				const src: string = `42 + 420;`;
				const builder: Builder = new Builder(src);
				const stmt: AST.ASTNodeStatementExpression = statementExpressionFromSource(src);
				assert.deepStrictEqual(
					stmt.build(builder),
					new InstructionStatement(0n, operationFromSource(src).build(builder)),
				)
			})
			specify('multiple statements.', () => {
				const src: string = `42; 420;`;
				const generator: Builder = new Builder(src);
				goalFromSource(src).children.forEach((stmt, i) => {
					assert.ok(stmt instanceof AST.ASTNodeStatementExpression);
					assert.deepStrictEqual(
						stmt.build(generator),
						new InstructionStatement(BigInt(i), constantFromSource(stmt.source).build(generator)),
					)
				})
			})
		})

		context('ASTNodeConstant', () => {
			it('returns InstructionConst.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
					'0;',
					'+0;',
					'-0;',
					'42;',
					'+42;',
					'-42;',
					'0.0;',
					'+0.0;',
					'-0.0;',
					'-4.2e-2;',
				].map((src) => constantFromSource(src).build(new Builder(src))), [
					instructionConstInt(0n),
					instructionConstInt(0n),
					instructionConstInt(1n),
					instructionConstInt(0n),
					instructionConstInt(0n),
					instructionConstInt(0n),
					instructionConstInt(42n),
					instructionConstInt(42n),
					instructionConstInt(-42n),
					instructionConstFloat(0),
					instructionConstFloat(0),
					instructionConstFloat(-0),
					instructionConstFloat(-0.042),
				])
			})
		})

		describe('ASTNodeVariable', () => {
			it('with constant folding on, returns InstructionConst for fixed & foldable variables.', () => {
				const src: string = `
					let x: int = 42;
					let y: float = 4.2 * 10;
					x;
					y;
				`;
				const goal: AST.ASTNodeGoal = goalFromSource(src);
				const builder: Builder = new Builder(src)
				assert.deepStrictEqual(
					[
						goal.children[2].build(builder),
						goal.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, instructionConstInt(42n)),
						new INST.InstructionStatement(1n, instructionConstFloat(42.0)),
					],
				);
			});
			it('with constant folding on, returns InstructionGlobalGet for unfixed / non-foldable variables.', () => {
				const src: string = `
					let unfixed x: int = 42;
					let y: int = x + 10;
					x;
					y;
				`;
				const goal: AST.ASTNodeGoal = goalFromSource(src);
				const builder: Builder = new Builder(src)
				assert.deepStrictEqual(
					[
						goal.children[2].build(builder),
						goal.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, new INST.InstructionGlobalGet(0x100n)),
						new INST.InstructionStatement(1n, new INST.InstructionGlobalGet(0x101n)),
					],
				);
			});
			it('with constant folding off, always returns InstructionGlobalGet.', () => {
				const folding_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						constantFolding: false,
					},
				};
				const src: string = `
					let x: int = 42;
					let unfixed y: float = 4.2;
					x;
					y;
				`;
				const goal: AST.ASTNodeGoal = goalFromSource(src, folding_off);
				const builder: Builder = new Builder(src, folding_off);
				assert.deepStrictEqual(
					[
						goal.children[2].build(builder),
						goal.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, new INST.InstructionGlobalGet(0x100n)),
						new INST.InstructionStatement(1n, new INST.InstructionGlobalGet(0x101n)),
					],
				);
			});
		});

		describe('ASTNodeOperation', () => {
			const folding_off: SolidConfig = {
				...CONFIG_DEFAULT,
				compilerOptions: {
					...CONFIG_DEFAULT.compilerOptions,
					constantFolding: false,
				},
			};
			function buildOperations(tests: ReadonlyMap<string, InstructionExpression>): void {
				assert.deepStrictEqual(
					[...tests.keys()].map((src) => operationFromSource(src, folding_off).build(new Builder(src, folding_off))),
					[...tests.values()],
				);
			}
			specify('ASTNodeOperationUnary', () => {
				buildOperations(new Map<string, InstructionUnop>([
					[`!null;`,  new InstructionUnop(Operator.NOT, instructionConstInt(0n))],
					[`!false;`, new InstructionUnop(Operator.NOT, instructionConstInt(0n))],
					[`!true;`,  new InstructionUnop(Operator.NOT, instructionConstInt(1n))],
					[`!42;`,    new InstructionUnop(Operator.NOT, instructionConstInt(42n))],
					[`!4.2;`,   new InstructionUnop(Operator.NOT, instructionConstFloat(4.2))],
					[`?null;`,  new InstructionUnop(Operator.EMP, instructionConstInt(0n))],
					[`?false;`, new InstructionUnop(Operator.EMP, instructionConstInt(0n))],
					[`?true;`,  new InstructionUnop(Operator.EMP, instructionConstInt(1n))],
					[`?42;`,    new InstructionUnop(Operator.EMP, instructionConstInt(42n))],
					[`?4.2;`,   new InstructionUnop(Operator.EMP, instructionConstFloat(4.2))],
					[`-(4);`,   new InstructionUnop(Operator.NEG, instructionConstInt(4n))],
					[`-(4.2);`, new InstructionUnop(Operator.NEG, instructionConstFloat(4.2))],
				]));
			});
			specify('ASTNodeOperationBinaryArithmetic', () => {
				buildOperations(new Map([
					[`42 + 420;`, new InstructionBinopArithmetic(Operator.ADD, instructionConstInt(42n),   instructionConstInt(420n))],
					[`3 * 2.1;`,  new InstructionBinopArithmetic(Operator.MUL, instructionConstFloat(3.0), instructionConstFloat(2.1))],
				]));
				buildOperations(xjs.Map.mapValues(new Map([
					[' 126 /  3;', [ 126n,  3n]],
					['-126 /  3;', [-126n,  3n]],
					[' 126 / -3;', [ 126n, -3n]],
					['-126 / -3;', [-126n, -3n]],
					[' 200 /  3;', [ 200n,  3n]],
					[' 200 / -3;', [ 200n, -3n]],
					['-200 /  3;', [-200n,  3n]],
					['-200 / -3;', [-200n, -3n]],
				]), ([a, b]) => new InstructionBinopArithmetic(
					Operator.DIV,
					instructionConstInt(a),
					instructionConstInt(b),
				)));
			});
			describe('ASTNodeOperationBinaryEquality', () => {
				it('with int coersion on, coerse ints into floats when needed.', () => {
					assert.deepStrictEqual([
						`42 == 420;`,
						`4.2 is 42;`,
						`42 is 4.2;`,
						`4.2 == 42;`,
						`true is 1;`,
						`true == 1;`,
						`null is false;`,
						`null == false;`,
						`false == 0.0;`,
					].map((src) => operationFromSource(src, folding_off).build(new Builder(src, folding_off))), [
						new InstructionBinopEquality(
							Operator.EQ,
							instructionConstInt(42n),
							instructionConstInt(420n),
						),
						new InstructionBinopEquality(
							Operator.IS,
							instructionConstFloat(4.2),
							instructionConstInt(42n),
						),
						new InstructionBinopEquality(
							Operator.IS,
							instructionConstInt(42n),
							instructionConstFloat(4.2),
						),
						new InstructionBinopEquality(
							Operator.EQ,
							instructionConstFloat(4.2),
							instructionConstFloat(42.0),
						),
						new InstructionBinopEquality(
							Operator.IS,
							instructionConstInt(1n),
							instructionConstInt(1n),
						),
						new InstructionBinopEquality(
							Operator.EQ,
							instructionConstInt(1n),
							instructionConstInt(1n),
						),
						new InstructionBinopEquality(
							Operator.IS,
							instructionConstInt(0n),
							instructionConstInt(0n),
						),
						new InstructionBinopEquality(
							Operator.EQ,
							instructionConstInt(0n),
							instructionConstInt(0n),
						),
						new InstructionBinopEquality(
							Operator.EQ,
							instructionConstFloat(0.0),
							instructionConstFloat(0.0),
						),
					]);
				});
				it('with int coersion on, does not coerse ints into floats.', () => {
					const folding_coercion_off: SolidConfig = {
						...CONFIG_DEFAULT,
						compilerOptions: {
							...CONFIG_DEFAULT.compilerOptions,
							constantFolding: false,
							intCoercion: false,
						},
					};
					assert.deepStrictEqual([
						`42 == 420;`,
						`4.2 == 42;`,
						`42 == 4.2;`,
						`null == 0.0;`,
						`false == 0.0;`,
						`true == 1.0;`,
					].map((src) => operationFromSource(src, folding_coercion_off).build(new Builder(src, folding_coercion_off))), [
						[instructionConstInt(42n),   instructionConstInt(420n)],
						[instructionConstFloat(4.2), instructionConstInt(42n)],
						[instructionConstInt(42n),   instructionConstFloat(4.2)],
						[instructionConstInt(0n),    instructionConstFloat(0.0)],
						[instructionConstInt(0n),    instructionConstFloat(0.0)],
						[instructionConstInt(1n),    instructionConstFloat(1.0)],
					].map(([left, right]) => new InstructionBinopEquality(Operator.EQ, left, right)))
				});
			});
			describe('ASTNodeOperationBinaryLogical', () => {
				it('returns InstructionBinopLogical.', () => {
					assert.deepStrictEqual([
						`42 && 420;`,
						`4.2 || -420;`,
						`null && 201.0e-1;`,
						`true && 201.0e-1;`,
						`false || null;`,
					].map((src) => operationFromSource(src, folding_off).build(new Builder(src, folding_off))), [
						new InstructionBinopLogical(
							0n,
							Operator.AND,
							instructionConstInt(42n),
							instructionConstInt(420n),
						),
						new InstructionBinopLogical(
							0n,
							Operator.OR,
							instructionConstFloat(4.2),
							instructionConstFloat(-420.0),
						),
						new InstructionBinopLogical(
							0n,
							Operator.AND,
							instructionConstFloat(0.0),
							instructionConstFloat(20.1),
						),
						new InstructionBinopLogical(
							0n,
							Operator.AND,
							instructionConstFloat(1.0),
							instructionConstFloat(20.1),
						),
						new InstructionBinopLogical(
							0n,
							Operator.OR,
							instructionConstInt(0n),
							instructionConstInt(0n),
						),
					]);
				});
				it('counts internal variables correctly.', () => {
					const src: string = `1 && 2 || 3 && 4;`
					assert.deepStrictEqual(
						operationFromSource(src, folding_off).build(new Builder(src, folding_off)),
						new InstructionBinopLogical(
							0n,
							Operator.OR,
							new InstructionBinopLogical(
								1n,
								Operator.AND,
								instructionConstInt(1n),
								instructionConstInt(2n),
							),
							new InstructionBinopLogical(
								2n,
								Operator.AND,
								instructionConstInt(3n),
								instructionConstInt(4n),
							),
						),
					);
				});
			});
			specify('ASTNodeOperationTernary', () => {
				buildOperations(xjs.Map.mapValues(new Map([
					[`if true  then false else 2;`,    [new Int16(1n), new Int16(0n),    new Int16(2n)]],
					[`if false then 3.0   else null;`, [new Int16(0n), new Float64(3.0), new Float64(0.0)]],
					[`if true  then 2     else 3.0;`,  [new Int16(1n), new Float64(2.0), new Float64(3.0)]],
				]), ([cond, cons, alt]) => new InstructionCond(
					new InstructionConst(cond),
					new InstructionConst(cons),
					new InstructionConst(alt),
				)));
			});
			it('compound expression.', () => {
				buildOperations(new Map([
					[`42 ^ 2 * 420;`, new InstructionBinopArithmetic(
						Operator.MUL,
						new InstructionBinopArithmetic(
							Operator.EXP,
							instructionConstInt(42n),
							instructionConstInt(2n),
						),
						instructionConstInt(420n),
					)],
					[`2 * 3.0 + 5;`, new InstructionBinopArithmetic(
						Operator.ADD,
						new InstructionBinopArithmetic(
							Operator.MUL,
							instructionConstFloat(2.0),
							instructionConstFloat(3.0),
						),
						instructionConstFloat(5.0),
					)],
				]));
			});
		});

		describe('ASTNodeDeclarationType', () => {
			it('always returns InstructionNone.', () => {
				const src: string = `
					type T = int;
					type U = T | float;
				`;
				const goal: AST.ASTNodeGoal = goalFromSource(src);
				const builder: Builder = new Builder(src)
				assert.deepStrictEqual(
					[
						goal.children[0].build(builder),
						goal.children[1].build(builder),
					],
					[
						new INST.InstructionNone(),
						new INST.InstructionNone(),
					],
				);
			});
		});

		describe('ASTNodeDeclarationVariable', () => {
			it('with constant folding on, returns InstructionNone for fixed & foldable variables.', () => {
				const src: string = `
					let x: int = 42;
					let y: float = 4.2 * 10;
				`;
				const goal: AST.ASTNodeGoal = goalFromSource(src);
				const builder: Builder = new Builder(src)
				assert.deepStrictEqual(
					[
						goal.children[0].build(builder),
						goal.children[1].build(builder),
					],
					[
						new INST.InstructionNone(),
						new INST.InstructionNone(),
					],
				);
			});
			it('with constant folding on, returns InstructionDeclareGlobal for unfixed / non-foldable variables.', () => {
				const src: string = `
					let unfixed x: int = 42;
					let y: int = x + 10;
				`;
				const goal: AST.ASTNodeGoal = goalFromSource(src);
				const builder: Builder = new Builder(src)
				assert.deepStrictEqual(
					[
						goal.children[0].build(builder),
						goal.children[1].build(builder),
					],
					[
						new INST.InstructionDeclareGlobal(0x100n, true,  instructionConstInt(42n)),
						new INST.InstructionDeclareGlobal(0x101n, false, new INST.InstructionBinopArithmetic(
							Operator.ADD,
							new INST.InstructionGlobalGet(0x100n),
							instructionConstInt(10n),
						)),
					],
				);
			});
			it('with constant folding off, always returns InstructionDeclareGlobal.', () => {
				const folding_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						constantFolding: false,
					},
				};
				const src: string = `
					let x: int = 42;
					let unfixed y: float = 4.2;
				`;
				const goal: AST.ASTNodeGoal = goalFromSource(src, folding_off);
				const builder: Builder = new Builder(src, folding_off);
				assert.deepStrictEqual(
					[
						goal.children[0].build(builder),
						goal.children[1].build(builder),
					],
					[
						new INST.InstructionDeclareGlobal(0x100n, false, instructionConstInt(42n)),
						new INST.InstructionDeclareGlobal(0x101n, true,  instructionConstFloat(4.2)),
					],
				);
			});
		});

		describe('ASTNodeAssignment', () => {
			it('always returns InstructionStatement containing InstructionGlobalSet.', () => {
				const src: string = `
					let unfixed y: float = 4.2;
					y = y * 10;
				`;
				const goal: AST.ASTNodeGoal = goalFromSource(src);
				const builder: Builder = new Builder(src);
				assert.deepStrictEqual(
					goal.children[1].build(builder),
					new INST.InstructionStatement(
						0n,
						new INST.InstructionGlobalSet(0x100n, new INST.InstructionBinopArithmetic(
							Operator.MUL,
							new INST.InstructionGlobalGet(0x100n, true),
							instructionConstFloat(10.0),
						)),
					),
				);
			});
		});
	});


	describe('ASTNodeType', () => {
		describe('#assess', () => {
			it('computes the value of constant null, boolean, or number types.', () => {
				assert.deepStrictEqual([
					`null`,
					`false`,
					`true`,
					`42`,
					`4.2e+3`,
				].map((src) => Decorator.decorate(unitTypeFromString(src)).assess(new Validator())), [
					SolidNull,
					SolidBoolean.FALSETYPE,
					SolidBoolean.TRUETYPE,
					typeConstInt(42n),
					typeConstFloat(4.2e+3),
				])
			})
			it('computes the value of a type alias.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = goalFromSource(`
					type T = int;
					type U = T;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.deepStrictEqual(
					((goal
						.children[1] as AST.ASTNodeDeclarationType)
						.children[1] as AST.ASTNodeTypeAlias)
						.assess(validator),
					Int16,
				);
			});
			it('computes the value of keyword type.', () => {
				assert.deepStrictEqual([
					'bool',
					'int',
					'float',
					'obj',
				].map((src) => Decorator.decorate(unitTypeFromString(src)).assess(new Validator())), [
					SolidBoolean,
					Int16,
					Float64,
					SolidObject,
				])
			})
			it('computes the value of a nullified (ORNULL) type.', () => {
				assert.deepStrictEqual(
					Decorator.decorate(unaryTypeFromString(`int!`)).assess(new Validator()),
					Int16.union(SolidNull),
				)
			})
			it('computes the value of AND and OR operators', () => {
				assert.deepStrictEqual(
					Decorator.decorate(intersectionTypeFromString(`obj & 3`)).assess(new Validator()),
					SolidObject.intersect(typeConstInt(3n)),
				)
				assert.deepStrictEqual(
					Decorator.decorate(unionTypeFromString(`4.2 | int`)).assess(new Validator()),
					typeConstFloat(4.2).union(Int16),
				)
			})
		})
	})


	describe('ASTNodeExpression', () => {
		describe('#type', () => {
			const folding_off: SolidConfig = {
				...CONFIG_DEFAULT,
				compilerOptions: {
					...CONFIG_DEFAULT.compilerOptions,
					constantFolding: false,
				},
			};
			describe('ASTNodeConstant', () => {
				context('with constant folding on.', () => {
					it('returns the result of `this#assess`, wrapped in a `new SolidTypeConstant`.', () => {
						const constants: AST.ASTNodeConstant[] = `
							null  false  true
							55  -55  033  -033  0  -0
							55.  -55.  033.  -033.  2.007  -2.007
							91.27e4  -91.27e4  91.27e-4  -91.27e-4
							0.  -0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
							${ (Dev.supports('stringConstant-assess')) ? `'42😀'  '42\\u{1f600}'` : `` }
						`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => constantFromSource(`${ src };`));
						assert.deepStrictEqual(
							constants.map((c) => assert_wasCalled(c.assess, 1, (orig, spy) => {
								c.assess = spy;
								try {
									return c.type(new Validator());
								} finally {
									c.assess = orig;
								};
							})),
							constants.map((c) => new SolidTypeConstant(c.assess(new Validator())!)),
						);
					});
				});
				context('with constant folding off.', () => {
					[
						['Null',    `null`, SolidNull],
						['Boolean', `true`, SolidBoolean],
						['Integer', `42`,   Int16],
						['Float',   `4.2`,  Float64],
						...(Dev.supports('stringConstant-assess') ? [['String', `'42😀'`, SolidString]] : []),
					].forEach(([testname, src, typ]) => {
						it(`returns \`${ testname }\` for those constants.`, () => {
							assert.deepStrictEqual(constantFromSource(`${ src };`, folding_off).type(new Validator(folding_off)), typ);
						});
					});
				});
			});
			it('returns Unknown for undeclared variables.', () => {
				// NOTE: a reference error will be thrown at the variable-checking stage
				assert.strictEqual(variableFromSource(`x;`).type(new Validator()), SolidLanguageType.UNKNOWN);
			});
			Dev.supports('stringTemplate-assess') && describe('ASTNodeTemplate', () => {
				const templates: AST.ASTNodeTemplate[] = [
					templateFromSource(`'''42😀''';`),
					templateFromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`),
					(goalFromSource(`
						let unfixed x: int = 21;
						'''the answer is {{ x * 2 }} but what is the question?''';
					`)
						.children[1] as AST.ASTNodeStatementExpression)
						.children[0] as AST.ASTNodeTemplate,
				];
				context('with constant folding on.', () => {
					let types: SolidLanguageType[];
					before(() => {
						types = templates.map((t) => assert_wasCalled(t.assess, 1, (orig, spy) => {
								t.assess = spy;
								try {
									return t.type(new Validator());
								} finally {
									t.assess = orig;
								};
						}));
					});
					it('for foldable interpolations, returns the result of `this#assess`, wrapped in a `new SolidTypeConstant`.', () => {
						assert.deepStrictEqual(
							types.slice(0, 2),
							templates.slice(0, 2).map((t) => new SolidTypeConstant(t.assess(new Validator())!)),
						);
					});
					it('for non-foldable interpolations, returns `String`.', () => {
						assert.deepStrictEqual(types[2], SolidString);
					});
				});
				context('with constant folding off.', () => {
					it('always returns `String`.', () => {
						templates.forEach((t) => {
							assert.deepStrictEqual(t.type(new Validator(folding_off)), SolidString);
						});
					});
				});
			});
			describe('ASTNodeOperation', () => {
				function typeOperations(tests: ReadonlyMap<string, SolidObject>): void {
					return assert.deepStrictEqual(
						[...tests.keys()].map((src) => operationFromSource(src).type(new Validator())),
						[...tests.values()].map((result) => new SolidTypeConstant(result)),
					);
				}
				function typeOfOperationFromSource(src: string): SolidLanguageType {
					return operationFromSource(src, folding_coercion_off).type(new Validator(folding_coercion_off));
				}
				const folding_coercion_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						constantFolding: false,
						intCoercion: false,
					},
				};
				describe('ASTNodeOperationUnary', () => {
					it('returns a constant Boolean type for boolean unary operation of anything.', () => {
						typeOperations(xjs.Map.mapValues(new Map([
							[`!false;`,  true],
							[`!true;`,   false],
							[`!null;`,   true],
							[`!42;`,     false],
							[`!4.2e+1;`, false],
							[`?false;`,  true],
							[`?true;`,   false],
							[`?null;`,   true],
							[`?42;`,     false],
							[`?4.2e+1;`, false],
						]), (v) => SolidBoolean.fromBoolean(v)))
					});
				});
				describe('ASTNodeOperationBinaryArithmetic', () => {
					context('with constant folding and int coersion on.', () => {
						it('returns a constant Integer type for any operation of integers.', () => {
							assert.deepStrictEqual(operationFromSource(`7 * 3 * 2;`).type(new Validator()), typeConstInt(7n * 3n * 2n));
						});
						it('returns a constant Float type for any operation of mix of integers and floats.', () => {
							assert.deepStrictEqual(operationFromSource(`3.0 * 2.7;`)   .type(new Validator()), typeConstFloat(3.0 * 2.7));
							assert.deepStrictEqual(operationFromSource(`7 * 3.0 * 2;`) .type(new Validator()), typeConstFloat(7 * 3.0 * 2));
						});
					});
					context('with folding off but int coersion on.', () => {
						it('returns Integer for integer arithmetic.', () => {
							const node: AST.ASTNodeOperation = operationFromSource(`(7 + 3) * 2;`, folding_off);
							assert.deepStrictEqual(
								[node.type(new Validator(folding_off)), node.children.length],
								[Int16,                                 2],
							);
							assert.deepStrictEqual(
								[node.children[0].type(new Validator(folding_off)), node.children[1].type(new Validator(folding_off))],
								[Int16,                                             Int16],
							);
						});
						it('returns Float for float arithmetic.', () => {
							const node: AST.ASTNodeOperation = operationFromSource(`7 * 3.0 ^ 2;`, folding_off);
							assert.deepStrictEqual(
								[node.type(new Validator(folding_off)), node.children.length],
								[Float64,                               2],
							);
							assert.deepStrictEqual(
								[node.children[0].type(new Validator(folding_off)), node.children[1].type(new Validator(folding_off))],
								[Int16,                                             Float64],
							);
						});
					});
					context('with folding and int coersion off.', () => {
						it('returns `Integer` if both operands are ints.', () => {
							assert.deepStrictEqual(typeOfOperationFromSource(`7 * 3;`), Int16);
						})
						it('returns `Float` if both operands are floats.', () => {
							assert.deepStrictEqual(typeOfOperationFromSource(`7.0 - 3.0;`), Float64);
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
							assert.throws(() => operationFromSource(src).type(new Validator()), TypeError01);
						});
					});
				});
				describe('ASTNodeOperationBinaryComparative', () => {
					it('with folding and int coersion on.', () => {
						typeOperations(xjs.Map.mapValues(new Map([
							[`2 < 3;`,    true],
							[`2 > 3;`,    false],
							[`2 <= 3;`,   true],
							[`2 >= 3;`,   false],
							[`2 !< 3;`,   false],
							[`2 !> 3;`,   true],
						]), (v) => SolidBoolean.fromBoolean(v)));
					});
					context('with folding off but int coersion on.', () => {
						it('allows coercing of ints to floats if there are any floats.', () => {
							assert.deepStrictEqual(operationFromSource(`7.0 > 3;`).type(new Validator(folding_off)), SolidBoolean);
						});
					});
					context('with folding and int coersion off.', () => {
						it('returns `Boolean` if both operands are of the same numeric type.', () => {
							assert.deepStrictEqual(typeOfOperationFromSource(`7 < 3;`), SolidBoolean);
							assert.deepStrictEqual(typeOfOperationFromSource(`7.0 >= 3.0;`), SolidBoolean);
						});
						it('throws TypeError if operands have different types.', () => {
							assert.throws(() => typeOfOperationFromSource(`7.0 <= 3;`), TypeError01);
						});
					});
					it('throws for comparative operation of non-numbers.', () => {
						assert.throws(() => operationFromSource(`7.0 <= null;`).type(new Validator()), TypeError01);
					});
				});
				describe('ASTNodeOperationBinaryEquality', () => {
					it('with folding and int coersion on.', () => {
						typeOperations(xjs.Map.mapValues(new Map([
							[`2 is 3;`,      false],
							[`2 isnt 3;`,    true],
							[`2 == 3;`,      false],
							[`2 != 3;`,      true],
							[`0 is -0;`,     true],
							[`0 == -0;`,     true],
							[`0.0 is 0;`,    false],
							[`0.0 == 0;`,    true],
							[`0.0 is -0;`,   false],
							[`0.0 == -0;`,   true],
							[`-0.0 is 0;`,   false],
							[`-0.0 == 0;`,   true],
							[`-0.0 is 0.0;`, false],
							[`-0.0 == 0.0;`, true],
						]), (v) => SolidBoolean.fromBoolean(v)));
					});
					context('with folding off but int coersion on.', () => {
						it('allows coercing of ints to floats if there are any floats.', () => {
							assert.deepStrictEqual(operationFromSource(`7 == 7.0;`).type(new Validator(folding_off)), SolidBoolean);
						});
						it('returns `false` if operands are of different numeric types.', () => {
							assert.deepStrictEqual(operationFromSource(`7 is 7.0;`, folding_off).type(new Validator(folding_off)), SolidBoolean.FALSETYPE);
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
				specify('ASTNodeOperationBinaryLogical', () => {
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
				describe('ASTNodeOperationTernary', () => {
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
						assert.throws(() => operationFromSource(`if 2 then true else false;`).type(new Validator()), TypeError01);
					});
				});
			});
		});

		describe('#assess', () => {
			describe('ASTNodeConstant', () => {
				it('computes null and boolean values.', () => {
					assert.deepStrictEqual([
						'null;',
						'false;',
						'true;',
					].map((src) => constantFromSource(src).assess(new Validator())), [
						SolidNull.NULL,
						SolidBoolean.FALSE,
						SolidBoolean.TRUE,
					]);
				})
				it('computes int values.', () => {
					const integer_radices_on: SolidConfig = {
						...CONFIG_DEFAULT,
						languageFeatures: {
							...CONFIG_DEFAULT.languageFeatures,
							integerRadices: true,
						},
					};
					assert.deepStrictEqual(`
						55  -55  033  -033  0  -0
						\\o55  -\\o55  \\q033  -\\q033
					`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => constantFromSource(`${ src };`, integer_radices_on).assess(new Validator())), [
						55, -55, 33, -33, 0, 0,
						parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
					].map((v) => new Int16(BigInt(v))));
				});
				it('computes float values.', () => {
					assert.deepStrictEqual(`
						55.  -55.  033.  -033.  2.007  -2.007
						91.27e4  -91.27e4  91.27e-4  -91.27e-4
						0.  -0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => constantFromSource(`${ src };`).assess(new Validator())), [
						55, -55, 33, -33, 2.007, -2.007,
						91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
						0, -0, -0, 6.8, 6.8, 0, -0,
					].map((v) => new Float64(v)));
				})
				Dev.supports('stringConstant-assess') && it('computes string values.', () => {
					assert.deepStrictEqual(
						constantFromSource(`'42😀\\u{1f600}';`).type(new Validator()),
						typeConstStr('42😀\u{1f600}'),
					);
				});
			});

			describe('ASTNodeVariable', () => {
				it('assesses the value of a fixed variable.', () => {
					const validator: Validator = new Validator();
					const goal: AST.ASTNodeGoal = goalFromSource(`
						let x: int = 21 * 2;
						x;
					`);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.ok(!(goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
					assert.deepStrictEqual(
						((goal
							.children[1] as AST.ASTNodeStatementExpression)
							.children[0] as AST.ASTNodeExpression)
							.assess(validator),
						new Int16(42n),
					);
				});
				it('returns null for an unfixed variable.', () => {
					const validator: Validator = new Validator();
					const goal: AST.ASTNodeGoal = goalFromSource(`
						let unfixed x: int = 21 * 2;
						x;
					`);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.ok((goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
					assert.deepStrictEqual(
						((goal
							.children[1] as AST.ASTNodeStatementExpression)
							.children[0] as AST.ASTNodeExpression)
							.assess(validator),
						null,
					);
				});
				it('returns null for an uncomputable fixed variable.', () => {
					const validator: Validator = new Validator();
					const goal: AST.ASTNodeGoal = goalFromSource(`
						let unfixed x: int = 21 * 2;
						let y: int = x / 2;
						y;
					`);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.ok(!(goal.children[1] as AST.ASTNodeDeclarationVariable).unfixed);
					assert.deepStrictEqual(
						((goal
							.children[2] as AST.ASTNodeStatementExpression)
							.children[0] as AST.ASTNodeExpression)
							.assess(validator),
						null,
					);
				});
			});
			Dev.supports('stringTemplate-assess') && describe('ASTNodeTemplate', () => {
				const templates: AST.ASTNodeTemplate[] = [
					templateFromSource(`'''42😀''';`),
					templateFromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`),
					(goalFromSource(`
						let unfixed x: int = 21;
						'''the answer is {{ x * 2 }} but what is the question?''';
					`)
						.children[1] as AST.ASTNodeStatementExpression)
						.children[0] as AST.ASTNodeTemplate,
				];
				it('returns a constant String for ASTNodeTemplate with no interpolations.', () => {
					assert.deepStrictEqual(
						templates[0].assess(new Validator()),
						new SolidString('42😀'),
					);
				});
				it('returns a constant String for ASTNodeTemplate with foldable interpolations.', () => {
					assert.deepStrictEqual(
						templates[1].assess(new Validator()),
						new SolidString('the answer is 42 but what is the question?'),
					);
				});
				it('returns null for ASTNodeTemplate with dynamic interpolations.', () => {
					assert.deepStrictEqual(
						templates[2].assess(new Validator()),
						null,
					);
				});
			});

			describe('ASTNodeOperation', () => {
				function assessOperations(tests: Map<string, SolidObject>): void {
					return assert.deepStrictEqual(
						[...tests.keys()].map((src) => operationFromSource(src).assess(new Validator())),
						[...tests.values()],
					);
				}
				describe('ASTNodeOperationUnary', () => {
					specify('[operator=NOT]', () => {
						assessOperations(new Map([
							[`!false;`,  SolidBoolean.TRUE],
							[`!true;`,   SolidBoolean.FALSE],
							[`!null;`,   SolidBoolean.TRUE],
							[`!0;`,      SolidBoolean.FALSE],
							[`!42;`,     SolidBoolean.FALSE],
							[`!0.0;`,    SolidBoolean.FALSE],
							[`!-0.0;`,   SolidBoolean.FALSE],
							[`!4.2e+1;`, SolidBoolean.FALSE],
						]))
						Dev.supports('stringConstant-assess') && assessOperations(new Map([
							[`!'';`,      SolidBoolean.FALSE],
							[`!'hello';`, SolidBoolean.FALSE],
						]))
					})
					specify('[operator=EMP]', () => {
						assessOperations(new Map([
							[`?false;`,  SolidBoolean.TRUE],
							[`?true;`,   SolidBoolean.FALSE],
							[`?null;`,   SolidBoolean.TRUE],
							[`?0;`,      SolidBoolean.TRUE],
							[`?42;`,     SolidBoolean.FALSE],
							[`?0.0;`,    SolidBoolean.TRUE],
							[`?-0.0;`,   SolidBoolean.TRUE],
							[`?4.2e+1;`, SolidBoolean.FALSE],
						]))
						Dev.supports('stringConstant-assess') && assessOperations(new Map([
							[`?'';`,      SolidBoolean.TRUE],
							[`?'hello';`, SolidBoolean.FALSE],
						]))
					})
				});
				describe('ASTNodeOperationBinaryArithmetic', () => {
					it('computes the value of an integer operation of constants.', () => {
						assessOperations(xjs.Map.mapValues(new Map([
							[`42 + 420;`,           42 + 420],
							[`42 - 420;`,           42 + -420],
							[` 126 /  3;`,          Math.trunc( 126 /  3)],
							[`-126 /  3;`,          Math.trunc(-126 /  3)],
							[` 126 / -3;`,          Math.trunc( 126 / -3)],
							[`-126 / -3;`,          Math.trunc(-126 / -3)],
							[` 200 /  3;`,          Math.trunc( 200 /  3)],
							[` 200 / -3;`,          Math.trunc( 200 / -3)],
							[`-200 /  3;`,          Math.trunc(-200 /  3)],
							[`-200 / -3;`,          Math.trunc(-200 / -3)],
							[`42 ^ 2 * 420;`,       (42 ** 2 * 420) % (2 ** 16)],
							[`2 ^ 15 + 2 ^ 14;`,    -(2 ** 14)],
							[`-(2 ^ 14) - 2 ^ 15;`, 2 ** 14],
							[`-(5) ^ +(2 * 3);`,    (-(5)) ** +(2 * 3)],
						]), (val) => new Int16(BigInt(val))))
					})
					it('overflows integers properly.', () => {
						assert.deepStrictEqual([
							`2 ^ 15 + 2 ^ 14;`,
							`-(2 ^ 14) - 2 ^ 15;`,
						].map((src) => operationFromSource(src).assess(new Validator())), [
							new Int16(-(2n ** 14n)),
							new Int16(2n ** 14n),
						])
					})
					it('computes the value of a float operation of constants.', () => {
						assessOperations(new Map<string, SolidObject>([
							[`3.0e1 - 201.0e-1;`,     new Float64(30 - 20.1)],
							[`3 * 2.1;`,     new Float64(3 * 2.1)],
						]))
					})
					it('throws when performing an operation that does not yield a valid number.', () => {
						assert.throws(() => operationFromSource(`-4 ^ -0.5;`).assess(new Validator()), NanError01);
					})
				});
				specify('ASTNodeOperationBinaryComparative', () => {
					assessOperations(xjs.Map.mapValues(new Map([
						[`3 <  3;`,     false],
						[`3 >  3;`,     false],
						[`3 <= 3;`,     true],
						[`3 >= 3;`,     true],
						[`5.2 <  7.0;`, true],
						[`5.2 >  7.0;`, false],
						[`5.2 <= 7.0;`, true],
						[`5.2 >= 7.0;`, false],
						[`5.2 <  9;`, true],
						[`5.2 >  9;`, false],
						[`5.2 <= 9;`, true],
						[`5.2 >= 9;`, false],
						[`5 <  9.2;`, true],
						[`5 >  9.2;`, false],
						[`5 <= 9.2;`, true],
						[`5 >= 9.2;`, false],
						[`3.0 <  3;`, false],
						[`3.0 >  3;`, false],
						[`3.0 <= 3;`, true],
						[`3.0 >= 3;`, true],
						[`3 <  3.0;`, false],
						[`3 >  3.0;`, false],
						[`3 <= 3.0;`, true],
						[`3 >= 3.0;`, true],
					]), (val) => SolidBoolean.fromBoolean(val)))
				})
				specify('ASTNodeOperationBinaryEquality', () => {
					assessOperations(xjs.Map.mapValues(new Map([
						[`null is null;`, true],
						[`null == null;`, true],
						[`null is 5;`,    false],
						[`null == 5;`,    false],
						[`true is 1;`,    false],
						[`true == 1;`,    false],
						[`true is 1.0;`,  false],
						[`true == 1.0;`,  false],
						[`true is 5.1;`,  false],
						[`true == 5.1;`,  false],
						[`true is true;`, true],
						[`true == true;`, true],
						[`3.0 is 3;`,     false],
						[`3.0 == 3;`,     true],
						[`3 is 3.0;`,     false],
						[`3 == 3.0;`,     true],
						[`0.0 is 0.0;`,   true],
						[`0.0 == 0.0;`,   true],
						[`0.0 is -0.0;`,  false],
						[`0.0 == -0.0;`,  true],
						[`0 is -0;`,     true],
						[`0 == -0;`,     true],
						[`0.0 is 0;`,    false],
						[`0.0 == 0;`,    true],
						[`0.0 is -0;`,   false],
						[`0.0 == -0;`,   true],
						[`-0.0 is 0;`,   false],
						[`-0.0 == 0;`,   true],
						[`-0.0 is 0.0;`, false],
						[`-0.0 == 0.0;`, true],
					]), (val) => SolidBoolean.fromBoolean(val)))
					Dev.supports('stringConstant-assess') && assessOperations(xjs.Map.mapValues(new Map([
						[`'' == '';`,    true],
						[`'a' is 'a';`, true],
						[`'a' == 'a';`, true],
						[`'hello\\u{20}world' is 'hello world';`, true],
						[`'hello\\u{20}world' == 'hello world';`, true],
						[`'a' isnt 'b';`, true],
						[`'a' !=   'b';`, true],
						[`'hello\\u{20}world' isnt 'hello20world';`, true],
						[`'hello\\u{20}world' !=   'hello20world';`, true],
					]), (val) => SolidBoolean.fromBoolean(val)))
				}).timeout(10_000);
				specify('ASTNodeOperationBinaryLogical', () => {
					assessOperations(new Map<string, SolidObject>([
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
					]))
				})
				specify('ASTNodeOperationTernary', () => {
					assessOperations(new Map<string, SolidObject>([
						[`if true then false else 2;`,          SolidBoolean.FALSE],
						[`if false then 3.0 else null;`,        SolidNull.NULL],
						[`if true then 2 else 3.0;`,            new Int16(2n)],
						[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
					]))
				})
			});
		})
	})
})
