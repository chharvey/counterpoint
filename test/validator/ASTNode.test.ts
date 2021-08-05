import * as assert from 'assert'
import * as xjs from 'extrajs'
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
} from '../../src/core/index.js';
import {
	Operator,
	AST,
	SymbolStructure,
	SymbolStructureType,
	SymbolStructureVar,
	Validator,
} from '../../src/validator/index.js';
import {
	TypeEntry,
	SolidType,
	SolidTypeConstant,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeSet,
	SolidTypeMapping,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidRecord,
	SolidSet,
	SolidMapping,
} from '../../src/typer/index.js';
import {
	Builder,
	INST,
} from '../../src/builder/index.js';
import {
	ReferenceError01,
	ReferenceError02,
	ReferenceError03,
	AssignmentError01,
	AssignmentError10,
	TypeError01,
	TypeError02,
	TypeError03,
	TypeError04,
	VoidError01,
	NanError01,
} from '../../src/error/index.js';
import {
	assert_wasCalled,
	assertEqualTypes,
} from '../assert-helpers.js';
import {
	typeConstInt,
	typeConstFloat,
	typeConstStr,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeSolid', () => {
	describe('#varCheck', () => {
		describe('ASTNodeTypeAlias', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`
					type T = int;
					type U = float | T;
				`).varCheck(new Validator()); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type U = float | T;
				`).varCheck(new Validator()), ReferenceError01);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					T;
					type T = int;
				`).varCheck(new Validator()), ReferenceError02);
			});
			it('throws if was declared as a value variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let FOO: int = 42;
					type T = FOO | float;
				`).varCheck(new Validator()), ReferenceError03);
			});
		});
		describe('ASTNodeConstant', () => {
			it('never throws.', () => {
				AST.ASTNodeConstant.fromSource(`42;`).varCheck(new Validator());
			});
		});
		describe('ASTNodeVariable', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`
					let unfixed i: int = 42;
					i;
				`).varCheck(new Validator()); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource(`i;`).varCheck(new Validator()), ReferenceError01);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					i;
					let unfixed i: int = 42;
				`).varCheck(new Validator()), ReferenceError02);
			});
			it('throws if it was declared as a type alias.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type FOO = int;
					42 || FOO;
				`).varCheck(new Validator()), ReferenceError03);
			});
		});
		describe('ASTNodeDeclarationType', () => {
			it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown`.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					type T = int;
				`);
				assert.ok(!validator.hasSymbol(256n))
				goal.varCheck(validator);
				assert.ok(validator.hasSymbol(256n));
				const info: SymbolStructure | null = validator.getSymbolInfo(256n);
				assert.ok(info instanceof SymbolStructureType);
				assert.strictEqual(info.value, SolidType.UNKNOWN);
			});
			it('throws if the validator already contains a record for the symbol.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type T = int;
					type T = float;
				`).varCheck(new Validator()), AssignmentError01);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let FOO: int = 42;
					type FOO = float;
				`).varCheck(new Validator()), AssignmentError01);
			});
		});
		describe('ASTNodeDeclarationVariable', () => {
			it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let x: int = 42;
				`);
				assert.ok(!validator.hasSymbol(256n))
				goal.varCheck(validator);
				assert.ok(validator.hasSymbol(256n));
				const info: SymbolStructure | null = validator.getSymbolInfo(256n);
				assert.ok(info instanceof SymbolStructureVar);
				assert.strictEqual(info.type, SolidType.UNKNOWN);
				assert.strictEqual(info.value, null);
			});
			it('throws if the validator already contains a record for the variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let i: int = 42;
					let i: int = 43;
				`).varCheck(new Validator()), AssignmentError01);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type FOO = float;
					let FOO: int = 42;
				`).varCheck(new Validator()), AssignmentError01);
			});
		});
		describe('ASTNodeAssignment', () => {
			it('throws if the variable is not unfixed.', () => {
				AST.ASTNodeGoal.fromSource(`
					let unfixed i: int = 42;
					i = 43;
				`).varCheck(new Validator()); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let i: int = 42;
					i = 43;
				`).varCheck(new Validator()), AssignmentError10);
			});
			it('always throws for type alias reassignment.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
				const decl: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(src);
				decl.typeCheck(new Validator());
			})
			it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
				const src: string = `let  the_answer:  null =  21  *  2;`
				const decl: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(src);
				assert.throws(() => decl.typeCheck(new Validator()), TypeError03);
			})
			it('with int coersion on, allows assigning ints to floats.', () => {
				const src: string = `let x: float = 42;`
				const decl: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(src);
				decl.typeCheck(new Validator());
			})
			it('with int coersion off, throws when assigning int to float.', () => {
				const src: string = `let x: float = 42;`
				const decl: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(src);
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
				const instr: INST.InstructionNone | INST.InstructionModule = AST.ASTNodeGoal.fromSource(src).build(new Builder(src));
				assert.ok(instr instanceof INST.InstructionNone);
			})
		})

		describe('ASTNodeStatementExpression', () => {
			it('returns InstructionNone for empty statement expression.', () => {
				const src: string = `;`;
				const instr: INST.InstructionNone | INST.InstructionStatement = AST.ASTNodeStatementExpression.fromSource(src)
					.build(new Builder(src))
				assert.ok(instr instanceof INST.InstructionNone);
			})
			it('returns InstructionStatement for nonempty statement expression.', () => {
				const src: string = `42 + 420;`;
				const builder: Builder = new Builder(src);
				const stmt: AST.ASTNodeStatementExpression = AST.ASTNodeStatementExpression.fromSource(src);
				assert.deepStrictEqual(
					stmt.build(builder),
					new INST.InstructionStatement(0n, AST.ASTNodeOperationBinaryArithmetic.fromSource(src).build(builder)),
				)
			})
			specify('multiple statements.', () => {
				const src: string = `42; 420;`;
				const generator: Builder = new Builder(src);
				AST.ASTNodeGoal.fromSource(src).children.forEach((stmt, i) => {
					assert.ok(stmt instanceof AST.ASTNodeStatementExpression);
					assert.deepStrictEqual(
						stmt.build(generator),
						new INST.InstructionStatement(BigInt(i), AST.ASTNodeConstant.fromSource(stmt.source).build(generator)),
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
				].map((src) => AST.ASTNodeConstant.fromSource(src).build(new Builder(src))), [
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, folding_off);
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
			function buildOperations(tests: ReadonlyMap<string, INST.InstructionExpression>): void {
				assert.deepStrictEqual(
					[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, folding_off).build(new Builder(src, folding_off))),
					[...tests.values()],
				);
			}
			specify('ASTNodeOperationUnary', () => {
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
			specify('ASTNodeOperationBinaryArithmetic', () => {
				buildOperations(new Map([
					[`42 + 420;`, new INST.InstructionBinopArithmetic(Operator.ADD, instructionConstInt(42n),   instructionConstInt(420n))],
					[`3 * 2.1;`,  new INST.InstructionBinopArithmetic(Operator.MUL, instructionConstFloat(3.0), instructionConstFloat(2.1))],
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
				]), ([a, b]) => new INST.InstructionBinopArithmetic(
					Operator.DIV,
					instructionConstInt(a),
					instructionConstInt(b),
				)));
			});
			describe('ASTNodeOperationBinaryEquality', () => {
				it('with int coersion on, coerse ints into floats when needed.', () => {
					assert.deepStrictEqual([
						`42 == 420;`,
						`4.2 === 42;`,
						`42 === 4.2;`,
						`4.2 == 42;`,
						`true === 1;`,
						`true == 1;`,
						`null === false;`,
						`null == false;`,
						`false == 0.0;`,
					].map((src) => AST.ASTNodeOperationBinaryEquality.fromSource(src, folding_off).build(new Builder(src, folding_off))), [
						new INST.InstructionBinopEquality(
							Operator.EQ,
							instructionConstInt(42n),
							instructionConstInt(420n),
						),
						new INST.InstructionBinopEquality(
							Operator.ID,
							instructionConstFloat(4.2),
							instructionConstInt(42n),
						),
						new INST.InstructionBinopEquality(
							Operator.ID,
							instructionConstInt(42n),
							instructionConstFloat(4.2),
						),
						new INST.InstructionBinopEquality(
							Operator.EQ,
							instructionConstFloat(4.2),
							instructionConstFloat(42.0),
						),
						new INST.InstructionBinopEquality(
							Operator.ID,
							instructionConstInt(1n),
							instructionConstInt(1n),
						),
						new INST.InstructionBinopEquality(
							Operator.EQ,
							instructionConstInt(1n),
							instructionConstInt(1n),
						),
						new INST.InstructionBinopEquality(
							Operator.ID,
							instructionConstInt(0n),
							instructionConstInt(0n),
						),
						new INST.InstructionBinopEquality(
							Operator.EQ,
							instructionConstInt(0n),
							instructionConstInt(0n),
						),
						new INST.InstructionBinopEquality(
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
					].map((src) => AST.ASTNodeOperationBinaryEquality.fromSource(src, folding_coercion_off).build(new Builder(src, folding_coercion_off))), [
						[instructionConstInt(42n),   instructionConstInt(420n)],
						[instructionConstFloat(4.2), instructionConstInt(42n)],
						[instructionConstInt(42n),   instructionConstFloat(4.2)],
						[instructionConstInt(0n),    instructionConstFloat(0.0)],
						[instructionConstInt(0n),    instructionConstFloat(0.0)],
						[instructionConstInt(1n),    instructionConstFloat(1.0)],
					].map(([left, right]) => new INST.InstructionBinopEquality(Operator.EQ, left, right)));
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
					].map((src) => AST.ASTNodeOperationBinaryLogical.fromSource(src, folding_off).build(new Builder(src, folding_off))), [
						new INST.InstructionBinopLogical(
							0n,
							Operator.AND,
							instructionConstInt(42n),
							instructionConstInt(420n),
						),
						new INST.InstructionBinopLogical(
							0n,
							Operator.OR,
							instructionConstFloat(4.2),
							instructionConstFloat(-420.0),
						),
						new INST.InstructionBinopLogical(
							0n,
							Operator.AND,
							instructionConstFloat(0.0),
							instructionConstFloat(20.1),
						),
						new INST.InstructionBinopLogical(
							0n,
							Operator.AND,
							instructionConstFloat(1.0),
							instructionConstFloat(20.1),
						),
						new INST.InstructionBinopLogical(
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
						AST.ASTNodeOperationBinaryLogical.fromSource(src, folding_off).build(new Builder(src, folding_off)),
						new INST.InstructionBinopLogical(
							0n,
							Operator.OR,
							new INST.InstructionBinopLogical(
								1n,
								Operator.AND,
								instructionConstInt(1n),
								instructionConstInt(2n),
							),
							new INST.InstructionBinopLogical(
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
				]), ([cond, cons, alt]) => new INST.InstructionCond(
					new INST.InstructionConst(cond),
					new INST.InstructionConst(cons),
					new INST.InstructionConst(alt),
				)));
			});
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, folding_off);
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
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
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).assess(new Validator())), [
					SolidNull,
					SolidBoolean.FALSETYPE,
					SolidBoolean.TRUETYPE,
					typeConstInt(42n),
					typeConstFloat(4.2e+3),
				])
			})
			it('computes the value of a type alias.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					type T = int;
					type U = T;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.deepStrictEqual(
					((goal
						.children[1] as AST.ASTNodeDeclarationType)
						.value as AST.ASTNodeTypeAlias)
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
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).assess(new Validator())), [
					SolidBoolean,
					Int16,
					Float64,
					SolidObject,
				])
			})
			Dev.supports('optionalEntries') && specify('ASTNodeTypeTuple', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeTuple.fromSource(`[int, bool, ?:str]`).assess(new Validator()),
					new SolidTypeTuple([
						{type: Int16,        optional: false},
						{type: SolidBoolean, optional: false},
						{type: SolidString,  optional: true},
					]),
				);
			});
			Dev.supports('optionalEntries') && specify('ASTNodeTypeRecord', () => {
				const node: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource(`[x: int, y?: bool, z: str]`);
				assert.deepStrictEqual(
					node.assess(new Validator()),
					new SolidTypeRecord(new Map<bigint, TypeEntry>(node.children.map((c, i) => [
						c.key.id,
						[
							{type: Int16,        optional: false},
							{type: SolidBoolean, optional: true},
							{type: SolidString,  optional: false},
						][i],
					]))),
				);
			});
			it('computes the value of a nullified (ORNULL) type.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeOperationUnary.fromSource(`int?`).assess(new Validator()),
					Int16.union(SolidNull),
				)
			})
			it('computes the value of AND and OR operators', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeOperationBinary.fromSource(`obj & 3`).assess(new Validator()),
					SolidObject.intersect(typeConstInt(3n)),
				)
				assert.deepStrictEqual(
					AST.ASTNodeTypeOperationBinary.fromSource(`4.2 | int`).assess(new Validator()),
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
						`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`));
						const validator: Validator = new Validator();
						assert.deepStrictEqual(constants.map((c) => assert_wasCalled(c.assess, 1, (orig, spy) => {
							c.assess = spy;
							try {
								return c.type(validator);
							} finally {
								c.assess = orig;
							};
						})), constants.map((c) => new SolidTypeConstant(c.assess(validator)!)));
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
							assert.deepStrictEqual(AST.ASTNodeConstant.fromSource(`${ src };`, folding_off).type(new Validator(folding_off)), typ);
						});
					});
				});
			});
			it('returns Unknown for undeclared variables.', () => {
				// NOTE: a reference error will be thrown at the variable-checking stage
				assert.strictEqual(AST.ASTNodeVariable.fromSource(`x;`).type(new Validator()), SolidType.UNKNOWN);
			});
			Dev.supports('stringTemplate-assess') && describe('ASTNodeTemplate', () => {
				let templates: readonly AST.ASTNodeTemplate[];
				function initTemplates() {
					return [
						AST.ASTNodeTemplate.fromSource(`'''42😀''';`),
						AST.ASTNodeTemplate.fromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`),
						(AST.ASTNodeGoal.fromSource(`
							let unfixed x: int = 21;
							'''the answer is {{ x * 2 }} but what is the question?''';
						`)
							.children[1] as AST.ASTNodeStatementExpression)
							.expr as AST.ASTNodeTemplate,
					] as const;
				}
				context('with constant folding on.', () => {
					const validator: Validator = new Validator();
					let types: SolidType[];
					before(() => {
						templates = initTemplates();
						types = templates.map((t) => assert_wasCalled(t.assess, 1, (orig, spy) => {
							t.assess = spy;
							try {
								return t.type(validator);
							} finally {
								t.assess = orig;
							};
						}));
					});
					it('for foldable interpolations, returns the result of `this#assess`, wrapped in a `new SolidTypeConstant`.', () => {
						assert.deepStrictEqual(
							types.slice(0, 2),
							templates.slice(0, 2).map((t) => new SolidTypeConstant(t.assess(validator)!)),
						);
					});
					it('for non-foldable interpolations, returns `String`.', () => {
						assert.deepStrictEqual(types[2], SolidString);
					});
				});
				context('with constant folding off.', () => {
					it('always returns `String`.', () => {
						templates = initTemplates();
						templates.forEach((t) => {
							assert.deepStrictEqual(t.type(new Validator(folding_off)), SolidString);
						});
					});
				});
			});

			Dev.supports('literalCollection') && describe('ASTNode{Tuple,Record,Set,Mapping}', () => {
				let collections: readonly [
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeSet,
					AST.ASTNodeMapping,
				];
				function initCollections() {
					return [
						AST.ASTNodeTuple.fromSource(`[1, 2.0, 'three'];`),
						AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, c= 'three'];`),
						AST.ASTNodeSet.fromSource(`{1, 2.0, 'three'};`),
						AST.ASTNodeMapping.fromSource(`
							{
								'a' || '' |-> 1,
								21 + 21   |-> 2.0,
								3 * 1.0   |-> 'three',
							};
						`),
					] as const;
				}
				context('with constant folding on.', () => {
					const validator: Validator = new Validator();
					let types: SolidType[];
					before(() => {
						collections = initCollections();
						types = collections.map((c) => assert_wasCalled(c.assess, 1, (orig, spy) => {
							c.assess = spy;
							try {
								return c.type(validator);
							} finally {
								c.assess = orig;
							};
						}));
					});
					it('returns the result of `this#assess`, wrapped in a `new SolidTypeConstant`.', () => {
						assert.deepStrictEqual(
							types,
							collections.map((c) => new SolidTypeConstant(c.assess(validator)!)),
						);
					});
				});
				it('with constant folding off.', () => {
					collections = initCollections();
					const validator: Validator = new Validator(folding_off);
					assert.deepStrictEqual(
						collections.map((node) => node.type(validator)),
						[
							SolidTypeTuple.fromTypes(collections[0].children.map((c) => c.type(validator))),
							SolidTypeRecord.fromTypes(new Map(collections[1].children.map((c) => [
								c.key.id,
								c.value.type(validator),
							]))),
							new SolidTypeSet(Int16.union(Float64).union(SolidString)),
							new SolidTypeMapping(
								SolidString.union(Int16).union(Float64),
								Int16.union(Float64).union(SolidString),
							),
						],
					);
				});
			});

			describe('ASTNodeOperation', () => {
				function typeOperations(tests: ReadonlyMap<string, SolidObject>, config: SolidConfig = CONFIG_DEFAULT): void {
					return assert.deepStrictEqual(
						[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).type(new Validator(config))),
						[...tests.values()].map((result) => new SolidTypeConstant(result)),
					);
				}
				function typeOfOperationFromSource(src: string): SolidType {
					return AST.ASTNodeOperation.fromSource(src, folding_coercion_off).type(new Validator(folding_coercion_off));
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
					context('with constant folding on.', () => {
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
							Dev.supports('literalCollection') && typeOperations(new Map([
								[`![];`,          SolidBoolean.FALSE],
								[`![42];`,        SolidBoolean.FALSE],
								[`![a= 42];`,     SolidBoolean.FALSE],
								[`!{};`,          SolidBoolean.FALSE],
								[`!{42};`,        SolidBoolean.FALSE],
								[`!{41 |-> 42};`, SolidBoolean.FALSE],
								[`?[];`,          SolidBoolean.TRUE],
								[`?[42];`,        SolidBoolean.FALSE],
								[`?[a= 42];`,     SolidBoolean.FALSE],
								[`?{};`,          SolidBoolean.TRUE],
								[`?{42};`,        SolidBoolean.FALSE],
								[`?{41 |-> 42};`, SolidBoolean.FALSE],
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
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								goal.children.slice(3).forEach((stmt) => {
									assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.type(validator), SolidBoolean.TRUETYPE);
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
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								goal.children.slice(5).forEach((stmt) => {
									assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.type(validator), SolidBoolean);
								});
							});
							it('returns type `false` for any type not a supertype of `null` or `false`.', () => {
								const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
									let unfixed a: int = 42;
									let unfixed b: float = 4.2;
									!a;
									!b;
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								goal.children.slice(2).forEach((stmt) => {
									assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.type(validator), SolidBoolean.FALSETYPE);
								});
							});
							Dev.supports('literalCollection') && it('[literalCollection] returns type `false` for any type not a supertype of `null` or `false`.', () => {
								const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
									![];
									![42];
									![a= 42];
									!{41 |-> 42};
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								goal.children.forEach((stmt) => {
									assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.type(validator), SolidBoolean.FALSETYPE);
								});
							});
						});
						describe('[operator=EMP]', () => {
							it('always returns type `bool`.', () => {
								const validator: Validator = new Validator(folding_off);
								[
									`?false;`,
									`?true;`,
									`?null;`,
									`?42;`,
									`?4.2e+1;`,
								].map((src) => AST.ASTNodeOperation.fromSource(src, folding_off).type(validator)).forEach((typ) => {
									assert.deepStrictEqual(typ, SolidBoolean);
								});
								Dev.supports('literalCollection') && [
									`?[];`,
									`?[42];`,
									`?[a= 42];`,
									`?{41 |-> 42};`,
								].map((src) => AST.ASTNodeOperation.fromSource(src, folding_off).type(validator)).forEach((typ) => {
									assert.deepStrictEqual(typ, SolidBoolean);
								});
							});
						});
					});
				});
				describe('ASTNodeOperationBinaryArithmetic', () => {
					context('with constant folding and int coersion on.', () => {
						it('returns a constant Integer type for any operation of integers.', () => {
							assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3 * 2;`).type(new Validator()), typeConstInt(7n * 3n * 2n));
						});
						it('returns a constant Float type for any operation of mix of integers and floats.', () => {
							assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`3.0 * 2.7;`)   .type(new Validator()), typeConstFloat(3.0 * 2.7));
							assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3.0 * 2;`) .type(new Validator()), typeConstFloat(7 * 3.0 * 2));
						});
					});
					context('with folding off but int coersion on.', () => {
						const validator: Validator = new Validator(folding_off);
						it('returns Integer for integer arithmetic.', () => {
							const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource(`(7 + 3) * 2;`, folding_off);
							assert.deepStrictEqual(node.type(validator), Int16);
							assert.deepStrictEqual(
								[node.operand0.type(validator), node.operand1.type(validator)],
								[Int16,                         Int16],
							);
						});
						it('returns Float for float arithmetic.', () => {
							const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3.0 ^ 2;`, folding_off);
							assert.deepStrictEqual(node.type(validator), Float64);
							assert.deepStrictEqual(
								[node.operand0.type(validator), node.operand1.type(validator)],
								[Int16,                         Float64],
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
							assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).type(new Validator()), TypeError01);
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
							assert.deepStrictEqual(AST.ASTNodeOperationBinaryComparative.fromSource(`7.0 > 3;`).type(new Validator(folding_off)), SolidBoolean);
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
						assert.throws(() => AST.ASTNodeOperationBinaryComparative.fromSource(`7.0 <= null;`).type(new Validator()), TypeError01);
					});
				});
				describe('ASTNodeOperationBinaryEquality', () => {
					context('with folding and int coersion on.', () => {
						it('for numeric literals.', () => {
							typeOperations(xjs.Map.mapValues(new Map([
								[`2 === 3;`,      false],
								[`2 !== 3;`,      true],
								[`2 == 3;`,       false],
								[`2 != 3;`,       true],
								[`0 === -0;`,     true],
								[`0 == -0;`,      true],
								[`0.0 === 0;`,    false],
								[`0.0 == 0;`,     true],
								[`0.0 === -0;`,   false],
								[`0.0 == -0;`,    true],
								[`-0.0 === 0;`,   false],
								[`-0.0 == 0;`,    true],
								[`-0.0 === 0.0;`, false],
								[`-0.0 == 0.0;`,  true],
							]), (v) => SolidBoolean.fromBoolean(v)));
						});
						Dev.supports('literalCollection') && it('returns the result of `this#assess`, wrapped in a `new SolidTypeConstant`.', () => {
							const validator: Validator = new Validator();
							const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
								let a: obj = [];
								let b: obj = [42];
								let c: obj = [x= 42];
								let d: obj = {41 |-> 42};
								a !== [];
								b !== [42];
								c !== [x= 42];
								d !== {41 |-> 42};
								a === a;
								b === b;
								c === c;
								d === d;
								a == [];
								b == [42];
								c == [x= 42];
								d == {41 |-> 42};
								b != [42, 43];
								c != [x= 43];
								c != [y= 42];
								d != {41 |-> 43};
								d != {43 |-> 42};
							`);
							goal.varCheck(validator);
							goal.typeCheck(validator);
							goal.children.slice(4).forEach((stmt) => {
								const expr: AST.ASTNodeOperationBinaryEquality = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinaryEquality;
								assert.deepStrictEqual(
									expr.type(validator),
									new SolidTypeConstant(expr.assess(validator)!),
								);
							});
						});
					});
					context('with folding off but int coersion on.', () => {
						it('allows coercing of ints to floats if there are any floats.', () => {
							assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource(`7 == 7.0;`).type(new Validator(folding_off)), SolidBoolean);
						});
						it('returns `false` if operands are of different numeric types.', () => {
							assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource(`7 === 7.0;`, folding_off).type(new Validator(folding_off)), SolidBoolean.FALSETYPE);
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
				describe('ASTNodeOperationBinaryLogical', () => {
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
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								assert.deepStrictEqual(goal.children.slice(3).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
									SolidNull,
									SolidNull.union(SolidBoolean.FALSETYPE),
									SolidNull.union(SolidType.VOID),
								]);
							});
							it('returns `T | right` if left is a supertype of `T narrows void | null | false`.', () => {
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
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								assert.deepStrictEqual(goal.children.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
									SolidNull.union(SolidString),
									SolidNull.union(SolidString),
									SolidBoolean.FALSETYPE.union(SolidString),
									SolidBoolean.FALSETYPE.union(SolidString),
									SolidType.VOID.union(Int16),
								]);
							});
							it('returns `right` if left does not contain `void` nor `null` nor `false`.', () => {
								const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
									let unfixed a: int = 42;
									let unfixed b: float = 4.2;
									a && true;
									b && null;
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								assert.deepStrictEqual(goal.children.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
									SolidBoolean,
									SolidNull,
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
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								assert.deepStrictEqual(goal.children.slice(3).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
									SolidBoolean,
									Int16,
									Float64,
								]);
							});
							it('returns `(left - T) | right` if left is a supertype of `T narrows void | null | false`.', () => {
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
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								assertEqualTypes(goal.children.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
									Int16.union(SolidString),
									Int16.union(SolidString),
									SolidBoolean.TRUETYPE.union(SolidString),
									SolidBoolean.TRUETYPE.union(Float64).union(SolidString),
									SolidString.union(Int16),
								]);
							});
							it('returns `left` if it does not contain `void` nor `null` nor `false`.', () => {
								const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
									let unfixed a: int = 42;
									let unfixed b: float = 4.2;
									a || true;
									b || null;
								`, folding_off);
								const validator: Validator = new Validator(folding_off);
								goal.varCheck(validator);
								goal.typeCheck(validator);
								assert.deepStrictEqual(goal.children.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
									Int16,
									Float64,
								]);
							});
						});
					});
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
						assert.throws(() => AST.ASTNodeOperationTernary.fromSource(`if 2 then true else false;`).type(new Validator()), TypeError01);
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
					].map((src) => AST.ASTNodeConstant.fromSource(src).assess(new Validator())), [
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
					`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`, integer_radices_on).assess(new Validator())), [
						55, -55, 33, -33, 0, 0,
						parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
					].map((v) => new Int16(BigInt(v))));
				});
				it('computes float values.', () => {
					assert.deepStrictEqual(`
						55.  -55.  033.  -033.  2.007  -2.007
						91.27e4  -91.27e4  91.27e-4  -91.27e-4
						0.  -0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`).assess(new Validator())), [
						55, -55, 33, -33, 2.007, -2.007,
						91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
						0, -0, -0, 6.8, 6.8, 0, -0,
					].map((v) => new Float64(v)));
				})
				Dev.supports('stringConstant-assess') && it('computes string values.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeConstant.fromSource(`'42😀\\u{1f600}';`).type(new Validator()),
						typeConstStr('42😀\u{1f600}'),
					);
				});
			});

			describe('ASTNodeVariable', () => {
				it('assesses the value of a fixed variable.', () => {
					const validator: Validator = new Validator();
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let x: int = 21 * 2;
						x;
					`);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.ok(!(goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
					assert.deepStrictEqual(
						(goal.children[1] as AST.ASTNodeStatementExpression).expr!.assess(validator),
						new Int16(42n),
					);
				});
				it('returns null for an unfixed variable.', () => {
					const validator: Validator = new Validator();
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed x: int = 21 * 2;
						x;
					`);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.ok((goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
					assert.deepStrictEqual(
						(goal.children[1] as AST.ASTNodeStatementExpression).expr!.assess(validator),
						null,
					);
				});
				it('returns null for an uncomputable fixed variable.', () => {
					const validator: Validator = new Validator();
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed x: int = 21 * 2;
						let y: int = x / 2;
						y;
					`);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.ok(!(goal.children[1] as AST.ASTNodeDeclarationVariable).unfixed);
					assert.deepStrictEqual(
						(goal.children[2] as AST.ASTNodeStatementExpression).expr!.assess(validator),
						null,
					);
				});
			});
			Dev.supports('stringTemplate-assess') && describe('ASTNodeTemplate', () => {
				let templates: AST.ASTNodeTemplate[];
				before(() => {
					templates = [
						AST.ASTNodeTemplate.fromSource(`'''42😀''';`),
						AST.ASTNodeTemplate.fromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`),
						(AST.ASTNodeGoal.fromSource(`
							let unfixed x: int = 21;
							'''the answer is {{ x * 2 }} but what is the question?''';
						`)
							.children[1] as AST.ASTNodeStatementExpression)
							.expr as AST.ASTNodeTemplate,
					];
				});
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

			Dev.supports('literalCollection') && describe('ASTNode{Tuple,Record,Set,Mapping}', () => {
				it('returns a constant Tuple/Record/Mapping for foldable entries.', () => {
					assert.deepStrictEqual(
						[
							AST.ASTNodeTuple.fromSource(`[1, 2.0, 'three'];`),
							AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, c= 'three'];`),
							AST.ASTNodeSet.fromSource(`{1, 2.0, 'three'};`),
							AST.ASTNodeMapping.fromSource(`
								{
									'a' || '' |-> 1,
									21 + 21   |-> 2.0,
									3 * 1.0   |-> 'three',
								};
							`),
						].map((c) => c.assess(new Validator())),
						[
							new SolidTuple([
								new Int16(1n),
								new Float64(2.0),
								new SolidString('three'),
							]),
							new SolidRecord(new Map<bigint, SolidObject>([
								[0x100n, new Int16(1n)],
								[0x101n, new Float64(2.0)],
								[0x102n, new SolidString('three')],
							])),
							new SolidSet(new Set([
								new Int16(1n),
								new Float64(2.0),
								new SolidString('three'),
							])),
							new SolidMapping(new Map<SolidObject, SolidObject>([
								[new SolidString('a'), new Int16(1n)],
								[new Int16(42n),       new Float64(2.0)],
								[new Float64(3.0),     new SolidString('three')],
							])),
						],
					);
				});
				it('returns null for non-foldable entries.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed x: int = 1;
						let unfixed y: float = 2.0;
						let unfixed z: str = 'three';
						[x, 2.0, 'three'];
						[a= 1, b= y, c= 'three'];
						{
							'a' || '' |-> 1,
							21 + 21   |-> y,
							3 * 1.0   |-> 'three',
						};
					`);
					const tuple:   AST.ASTNodeTuple   = (goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTuple;
					const record:  AST.ASTNodeRecord  = (goal.children[4] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeRecord;
					const mapping: AST.ASTNodeMapping = (goal.children[5] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeMapping;
					assert.deepStrictEqual(
						[
							tuple,
							record,
							mapping,
						].map((c) => c.assess(new Validator())),
						[null, null, null],
					);
				});
				it('ASTNodeRecord overwrites duplicate keys.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, a= 'three'];`).assess(new Validator()),
						new SolidRecord(new Map<bigint, SolidObject>([
							[0x101n, new Float64(2.0)],
							[0x100n, new SolidString('three')],
						])),
					);
				});
				it('ASTNodeMapping overwrites identical antecedents.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeMapping.fromSource(`
							{
								'a' |-> 1,
								0   |-> 2.0,
								-0  |-> 'three',
							};
						`).assess(new Validator()),
						new SolidMapping(new Map<SolidObject, SolidObject>([
							[new SolidString('a'), new Int16(1n)],
							[new Int16(0n),        new SolidString('three')],
						])),
					);
				});
				it('ASTNodeMapping does not overwrite non-identical (even if equal) antecedents.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeMapping.fromSource(`
							{
								'a'  |-> 1,
								0.0  |-> 2.0,
								-0.0 |-> 'three',
							};
						`).assess(new Validator()),
						new SolidMapping(new Map<SolidObject, SolidObject>([
							[new SolidString('a'), new Int16(1n)],
							[new Float64(0.0),     new Float64(2.0)],
							[new Float64(-0.0),    new SolidString('three')],
						])),
					);
				});
			});

			describe('ASTNodeOperation', () => {
				function assessOperations(tests: Map<string, SolidObject>): void {
					return assert.deepStrictEqual(
						[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src).assess(new Validator())),
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
						Dev.supports('literalCollection') && assessOperations(new Map([
							[`![];`,          SolidBoolean.FALSE],
							[`![42];`,        SolidBoolean.FALSE],
							[`![a= 42];`,     SolidBoolean.FALSE],
							[`!{};`,          SolidBoolean.FALSE],
							[`!{42};`,        SolidBoolean.FALSE],
							[`!{41 |-> 42};`, SolidBoolean.FALSE],
						]));
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
						Dev.supports('literalCollection') && assessOperations(new Map([
							[`?[];`,          SolidBoolean.TRUE],
							[`?[42];`,        SolidBoolean.FALSE],
							[`?[a= 42];`,     SolidBoolean.FALSE],
							[`?{};`,          SolidBoolean.TRUE],
							[`?{42};`,        SolidBoolean.FALSE],
							[`?{41 |-> 42};`, SolidBoolean.FALSE],
						]));
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
						].map((src) => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).assess(new Validator())), [
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
						assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(`-4 ^ -0.5;`).assess(new Validator()), NanError01);
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
						[`null === null;`, true],
						[`null ==  null;`, true],
						[`null === 5;`,    false],
						[`null ==  5;`,    false],
						[`true === 1;`,    false],
						[`true ==  1;`,    false],
						[`true === 1.0;`,  false],
						[`true ==  1.0;`,  false],
						[`true === 5.1;`,  false],
						[`true ==  5.1;`,  false],
						[`true === true;`, true],
						[`true ==  true;`, true],
						[`3.0 === 3;`,     false],
						[`3.0 ==  3;`,     true],
						[`3 === 3.0;`,     false],
						[`3 ==  3.0;`,     true],
						[`0.0 === 0.0;`,   true],
						[`0.0 ==  0.0;`,   true],
						[`0.0 === -0.0;`,  false],
						[`0.0 ==  -0.0;`,  true],
						[`0 === -0;`,      true],
						[`0 ==  -0;`,      true],
						[`0.0 === 0;`,     false],
						[`0.0 ==  0;`,     true],
						[`0.0 === -0;`,    false],
						[`0.0 ==  -0;`,    true],
						[`-0.0 === 0;`,    false],
						[`-0.0 ==  0;`,    true],
						[`-0.0 === 0.0;`,  false],
						[`-0.0 ==  0.0;`,  true],
					]), (val) => SolidBoolean.fromBoolean(val)))
					Dev.supports('stringConstant-assess') && assessOperations(xjs.Map.mapValues(new Map([
						[`'' == '';`,    true],
						[`'a' === 'a';`, true],
						[`'a' ==  'a';`, true],
						[`'hello\\u{20}world' === 'hello world';`, true],
						[`'hello\\u{20}world' ==  'hello world';`, true],
						[`'a' !== 'b';`, true],
						[`'a' !=  'b';`, true],
						[`'hello\\u{20}world' !== 'hello20world';`, true],
						[`'hello\\u{20}world' !=  'hello20world';`, true],
					]), (val) => SolidBoolean.fromBoolean(val)))
					Dev.supports('literalCollection') && (() => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let a: obj = [];
							let b: obj = [42];
							let c: obj = [x= 42];
							let d: obj = {};
							let e: obj = {42};
							let f: obj = {41 |-> 42};

							let bb: obj = [[42]];
							let cc: obj = [x= [42]];
							let ee: obj = {[42]};
							let ff: obj = {[41] |-> [42]};

							a !== [];
							b !== [42];
							c !== [x= 42];
							d !== {};
							e !== {42};
							f !== {41 |-> 42};
							a === a;
							b === b;
							c === c;
							d === d;
							e === e;
							f === f;
							a == [];
							b == [42];
							c == [x= 42];
							d == {};
							e == {42};
							f == {41 |-> 42};

							bb !== [[42]];
							cc !== [x= [42]];
							ee !== {[42]};
							ff !== {[41] |-> [42]};
							bb === bb;
							cc === cc;
							ee === ee;
							ff === ff;
							bb == [[42]];
							cc == [x= [42]];
							ee == {[42]};
							ff == {[41] |-> [42]};

							b != [42, 43];
							c != [x= 43];
							c != [y= 42];
							f != {41 |-> 43};
							f != {43 |-> 42};
						`);
						const validator: Validator = new Validator();
						goal.varCheck(validator);
						goal.typeCheck(validator);
						goal.children.slice(10).forEach((stmt) => {
							assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.assess(validator), SolidBoolean.TRUE, stmt.source);
						});
					})();
				});
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

		Dev.supports('literalCollection') && describe('ASTNodeTypeAccess', () => {
			describe('#assess', () => {
				function evalOfTypeDecl(decl: AST.ASTNodeDeclarationType, validator: Validator): SolidType {
					return decl.value.assess(validator);
				}
				const expected: SolidType[] = [
					typeConstInt(1n),
					typeConstFloat(2.0),
					typeConstStr('three'),
					Int16,
					Float64,
					SolidString,
				];
				let validator: Validator;
				let program: AST.ASTNodeGoal;
				before(() => {
					validator = new Validator();
					program = AST.ASTNodeGoal.fromSource(`
						type TupC = [1,   2.0,   'three'];
						type TupV = [int, float, str];

						type A1 = TupC.0;  % type \`1\`
						type A2 = TupC.1;  % type \`2.0\`
						type A3 = TupC.2;  % type \`'three'\`
						type A4 = TupV.0;  % type \`int\`
						type A5 = TupV.1;  % type \`float\`
						type A6 = TupV.2;  % type \`str\`
						type B1 = TupC.-3; % type \`1\`
						type B2 = TupC.-2; % type \`2.0\`
						type B3 = TupC.-1; % type \`'three'\`
						type B4 = TupV.-3; % type \`int\`
						type B5 = TupV.-2; % type \`float\`
						type B6 = TupV.-1; % type \`str\`

						type RecC = [a: 1,   b: 2.0,   c: 'three'];
						type RecV = [a: int, b: float, c: str];

						type C1 = RecC.a; % type \`1\`
						type C2 = RecC.b; % type \`2.0\`
						type C3 = RecC.c; % type \`'three'\`
						type C4 = RecV.a; % type \`int\`
						type C5 = RecV.b; % type \`float\`
						type C6 = RecV.c; % type \`str\`

						${ Dev.supports('optionalAccess') ? `
							type TupoC = [1,   2.0,   ?: 'three'];
							type TupoV = [int, float, ?: str];

							type D1 = TupoC.2; % type \`'three' | void\`
							type D2 = TupoV.2; % type \`str | void\`

							type RecoC = [a: 1,   b?: 2.0,   c: 'three'];
							type RecoV = [a: int, b?: float, c: str];

							type E1 = RecoC.b; % type \`2.0 | void\`
							type E2 = RecoV.b; % type \`float | void\`
						` : '' }
					`, validator.config);
					program.varCheck(validator);
					program.typeCheck(validator);
				});
				context('index access.', () => {
					it('returns individual entry types.', () => {
						assert.deepStrictEqual(
							program.children.slice(2, 8).map((c) => evalOfTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							expected,
						);
					});
					it('negative indices count backwards from end.', () => {
						assert.deepStrictEqual(
							program.children.slice(8, 14).map((c) => evalOfTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							expected,
						);
					});
					Dev.supports('optionalAccess') && it('unions with void if entry is optional.', () => {
						assert.deepStrictEqual(
							program.children.slice(24, 26).map((c) => evalOfTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							[
								typeConstStr('three').union(SolidType.VOID),
								SolidString.union(SolidType.VOID),
							],
						);
					});
					it('throws when index is out of bounds.', () => {
						assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[1, 2.0, 'three'].3`).assess(validator), TypeError04);
						assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[1, 2.0, 'three'].-4`).assess(validator), TypeError04);
					});
				});
				context('key access.', () => {
					it('returns individual entry types.', () => {
						assert.deepStrictEqual(
							program.children.slice(16, 22).map((c) => evalOfTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							expected,
						);
					});
					Dev.supports('optionalAccess') && it('unions with void if entry is optional.', () => {
						assert.deepStrictEqual(
							program.children.slice(28, 30).map((c) => evalOfTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							[
								typeConstFloat(2.0).union(SolidType.VOID),
								Float64.union(SolidType.VOID),
							],
						);
					});
					it('throws when key is out of bounds.', () => {
						assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[a: 1, b: 2.0, c: 'three'].d`).assess(validator), TypeError04);
					});
				});
			});
		});

		Dev.supports('literalCollection') && describe('ASTNodeAccess', () => {
			function programFactory(src: string): (validator: Validator) => AST.ASTNodeGoal {
				return (validator: Validator) => AST.ASTNodeGoal.fromSource(src, validator.config);
			}
			const INDEX_ACCESS_PROGRAM = programFactory(`
				let         tup_fixed:   [int, float, str] = [1, 2.0, 'three'];
				let unfixed tup_unfixed: [int, float, str] = [1, 2.0, 'three'];

				tup_fixed.0;   % type \`1\`       % value \`1\`
				tup_fixed.1;   % type \`2.0\`     % value \`2.0\`
				tup_fixed.2;   % type \`'three'\` % value \`'three'\`
				tup_unfixed.0; % type \`int\`     % non-computable value
				tup_unfixed.1; % type \`float\`   % non-computable value
				tup_unfixed.2; % type \`str\`     % non-computable value

				tup_fixed.-3;   % type \`1\`       % value \`1\`
				tup_fixed.-2;   % type \`2.0\`     % value \`2.0\`
				tup_fixed.-1;   % type \`'three'\` % value \`'three'\`
				tup_unfixed.-3; % type \`int\`     % non-computable value
				tup_unfixed.-2; % type \`float\`   % non-computable value
				tup_unfixed.-1; % type \`str\`     % non-computable value
				${ Dev.supports('optionalEntries') ? `
					let         tupo1_f: [int, float, ?: str] = [1, 2.0, 'three'];
					let         tupo2_f: [int, float, ?: str] = [1, 2.0];
					let         tupo3_f: [int, float]         = [1, 2.0, true];
					let         tupo4_f: [int, float]         = [1, 2.0];
					let unfixed tupo1_u: [int, float, ?: str] = [1, 2.0, 'three'];
					let unfixed tupo2_u: [int, float, ?: str] = [1, 2.0];
					let unfixed tupo3_u: [int, float]         = [1, 2.0, true];
					let unfixed tupo4_u: [int, float]         = [1, 2.0];

					tupo1_u.2; % type \`str | void\` % non-computable value
					tupo2_u.2; % type \`str | void\` % non-computable value
				` : '' }
				${ Dev.supports('optionalAccess') ? `
					tupo1_f?.2; % type \`'three'\` % value \`'three'\`
					tupo3_f?.2; % type \`true\`    % value \`true\`
					tupo1_u?.2; % type \`str?\`    % non-computable value
					tupo2_u?.2; % type \`str?\`    % non-computable value
				` : '' }
				${ Dev.supports('claimAccess') ? `
					tupo1_f!.2; % type \`'three'\` % value \`'three'\`
					tupo3_f!.2; % type \`true\`    % value \`true\`
					tupo1_u!.2; % type \`str\`     % non-computable value
					tupo2_u!.2; % type \`str\`     % non-computable value

					let unfixed tupvoid: [int | void] = [42];
					tupvoid!.0; % type \`int\` % non-computable value
				` : '' }
			`);
			const KEY_ACCESS_PROGRAM = programFactory(`
				let         rec_fixed:   [a: int, b: float, c: str] = [a= 1, b= 2.0, c= 'three'];
				let unfixed rec_unfixed: [a: int, b: float, c: str] = [a= 1, b= 2.0, c= 'three'];

				rec_fixed.a;   % type \`1\`       % value \`1\`
				rec_fixed.b;   % type \`2.0\`     % value \`2.0\`
				rec_fixed.c;   % type \`'three'\` % value \`'three'\`
				rec_unfixed.a; % type \`int\`     % non-computable value
				rec_unfixed.b; % type \`float\`   % non-computable value
				rec_unfixed.c; % type \`str\`     % non-computable value
				${ Dev.supports('optionalEntries') ? `
					let         reco1_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= 'three'];
					let         reco2_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0];
					let         reco3_f: [a: int, c: float]          = [a= 1, c= 2.0, b= true];
					let         reco4_f: [a: int, c: float]          = [a= 1, c= 2.0];
					let unfixed reco1_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= 'three'];
					let unfixed reco2_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0];
					let unfixed reco3_u: [a: int, c: float]          = [a= 1, c= 2.0, b= true];
					let unfixed reco4_u: [a: int, c: float]          = [a= 1, c= 2.0];

					reco1_u.b; % type \`str | void\` % non-computable value
					reco2_u.b; % type \`str | void\` % non-computable value
				` : '' }
				${ Dev.supports('optionalAccess') ? `
					reco1_f?.b; % type \`'three'\` % value \`'three'\`
					reco3_f?.b; % type \`true\`    % value \`true\`
					reco1_u?.b; % type \`str?\`    % non-computable value
					reco2_u?.b; % type \`str?\`    % non-computable value
				` : '' }
				${ Dev.supports('claimAccess') ? `
					reco1_f!.b; % type \`'three'\` % value \`'three'\`
					reco3_f!.b; % type \`true\`    % value \`true\`
					reco1_u!.b; % type \`str\`     % non-computable value
					reco2_u!.b; % type \`str\`     % non-computable value

					let unfixed recvoid: [c: int | void] = [c= 42];
					recvoid!.c; % type \`int\` % non-computable value
				` : '' }
			`);
			const EXPR_ACCESS_PROGRAM = programFactory(`
				let         tup_fixed:   [int, float, str] = [1, 2.0, 'three'];
				let unfixed tup_unfixed: [int, float, str] = [1, 2.0, 'three'];

				tup_fixed.[0];   % type \`1\`       % value \`1\`
				tup_fixed.[1];   % type \`2.0\`     % value \`2.0\`
				tup_fixed.[2];   % type \`'three'\` % value \`'three'\`
				tup_unfixed.[0]; % type \`int\`     % non-computable value
				tup_unfixed.[1]; % type \`float\`   % non-computable value
				tup_unfixed.[2]; % type \`str\`     % non-computable value

				let a: [str] = ['a'];
				let b: [str] = ['b'];
				let c: [str] = ['c'];

				let unfixed three: str = 'three';

				% Cannot assign set to variable yet, because its type must be \`obj\`.
				% TODO: Assign set to variable once generic type \`Set<T>\` is available.
				null; % %% set_fixed   %% {1, 2.0, 'three'}.[1];       % type \`1\`             % value \`1\`
				null; % %% set_fixed   %% {1, 2.0, 'three'}.[2.0];     % type \`2.0\`           % value \`2.0\`
				null; % %% set_fixed   %% {1, 2.0, 'three'}.['three']; % type \`'three'\`       % value \`'three'\`
				%% set_unfixed %% {1, 2.0, three}.[1];         % type \`1 | 2.0 | str\` % non-computable value
				%% set_unfixed %% {1, 2.0, three}.[2.0];       % type \`1 | 2.0 | str\` % non-computable value
				%% set_unfixed %% {1, 2.0, three}.['three'];   % type \`1 | 2.0 | str\` % non-computable value

				% Cannot assign mapping to variable yet, because its type must be \`obj\`.
				% TODO: Assign mapping to variable once generic type \`Mapping<K, V>\` is available.
				%% map_fixed   %% {a |-> 1, b |-> 2.0, c |-> 'three'}.[a]; % type \`1\`             % value \`1\`
				%% map_fixed   %% {a |-> 1, b |-> 2.0, c |-> 'three'}.[b]; % type \`2.0\`           % value \`2.0\`
				%% map_fixed   %% {a |-> 1, b |-> 2.0, c |-> 'three'}.[c]; % type \`'three'\`       % value \`'three'\`
				%% map_unfixed %% {a |-> 1, b |-> 2.0, c |-> three}.[a];   % type \`1 | 2.0 | str\` % non-computable value
				%% map_unfixed %% {a |-> 1, b |-> 2.0, c |-> three}.[b];   % type \`1 | 2.0 | str\` % non-computable value
				%% map_unfixed %% {a |-> 1, b |-> 2.0, c |-> three}.[c];   % type \`1 | 2.0 | str\` % non-computable value
				${ Dev.supports('optionalEntries') ? `
					let         tupo1_f: [int, float, ?: str] = [1, 2.0, 'three'];
					let         tupo2_f: [int, float, ?: str] = [1, 2.0];
					let         tupo3_f: [int, float]         = [1, 2.0, true];
					let         tupo4_f: [int, float]         = [1, 2.0];
					let unfixed tupo1_u: [int, float, ?: str] = [1, 2.0, 'three'];
					let unfixed tupo2_u: [int, float, ?: str] = [1, 2.0];
					let unfixed tupo3_u: [int, float]         = [1, 2.0, true];
					let unfixed tupo4_u: [int, float]         = [1, 2.0];

					tupo1_u.[2]; % type \`str | void\` % non-computable value
					tupo2_u.[2]; % type \`str | void\` % non-computable value
				` : '' }
				${ Dev.supports('optionalAccess') ? `
					tupo1_f?.[2]; % type \`'three'\` % value \`'three'\`
					tupo3_f?.[2]; % type \`true\`    % value \`true\`
					tupo1_u?.[2]; % type \`str?\`    % non-computable value
					tupo2_u?.[2]; % type \`str?\`    % non-computable value

					null; % %% set_fixed   %% {1, 2.0, 'three'}?.['three'];             % type \`'three'\`       % value \`'three'\`
					%% set_unfixed %% {1, 2.0, three}?.[three];                 % type \`1 | 2.0 | str\` % non-computable value
					%% map_fixed   %% {a |-> 1, b |-> 2.0, c |-> 'three'}?.[c]; % type \`'three'\`       % value \`'three'\`
					%% map_unfixed %% {a |-> 1, b |-> 2.0, c |-> three}?.[c];   % type \`1 | 2.0 | str\` % non-computable value
				` : '' }
				${ Dev.supports('claimAccess') ? `
					tupo1_f!.[2]; % type \`'three'\` % value \`'three'\`
					tupo3_f!.[2]; % type \`true\`    % value \`true\`
					tupo1_u!.[2]; % type \`str\`     % non-computable value
					tupo2_u!.[2]; % type \`str\`     % non-computable value
				` : '' }
			`);
			describe('#type', () => {
				function unionAllTypes(types: SolidType[]): SolidType {
					return types.reduce((a, b) => a.union(b));
				};
				function typeOfStmtExpr(stmt: AST.ASTNodeStatementExpression, validator: Validator): SolidType {
					return stmt.expr!.type(validator);
				}
				const folding_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						constantFolding: false,
					},
				};
				const expected: SolidType[] = [
					typeConstInt(1n),
					typeConstFloat(2.0),
					typeConstStr('three'),
					Int16,
					Float64,
					SolidString,
				];
				const int_float_str: SolidType = unionAllTypes([
					Int16,
					Float64,
					SolidString,
				]);
				Dev.supports('optionalAccess') && context('when base is nullish.', () => {
					it('optional access returns type of base when it is a subtype of null.', () => {
						const validator: Validator = new Validator();
						assert.throws(() => AST.ASTNodeAccess.fromSource(`null.4;`)         .type(validator), TypeError04);
						assert.throws(() => AST.ASTNodeAccess.fromSource(`null.four;`)      .type(validator), TypeError04);
						assert.throws(() => AST.ASTNodeAccess.fromSource(`null.[[[[[]]]]];`).type(validator), TypeError01);
						[
							AST.ASTNodeAccess.fromSource(`null?.3;`)         .type(validator),
							AST.ASTNodeAccess.fromSource(`null?.four;`)      .type(validator),
							AST.ASTNodeAccess.fromSource(`null?.[[[[[]]]]];`).type(validator),
						].forEach((t) => {
							assert.ok(t.isSubtypeOf(SolidNull));
						});
					});
					it('chained optional access.', () => {
						const validator: Validator = new Validator();
						const program: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed bound1: [prop?: [bool]] = [prop= [true]];
							let unfixed bound2: [prop?: [?: bool]] = [prop= []];

							bound1;          % type \`[prop?: [bool]]\`
							bound1?.prop;    % type \`[bool] | null\`
							bound1?.prop?.0; % type \`bool | null\`

							bound2;          % type \`[prop?: [?: bool]]\`
							bound2?.prop;    % type \`[?: bool] | null\`
							bound2?.prop?.0; % type \`bool | null\`
						`);
						program.varCheck(validator);
						program.typeCheck(validator);
						const prop1: SolidTypeTuple = SolidTypeTuple.fromTypes([SolidBoolean]);
						const prop2: SolidTypeTuple = new SolidTypeTuple([{type: SolidBoolean, optional: true}]);
						assert.deepStrictEqual(
							program.children.slice(2, 8).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							[
								new SolidTypeRecord(new Map([[0x101n, {type: prop1, optional: true}]])),
								prop1.union(SolidNull),
								SolidBoolean.union(SolidNull),
								new SolidTypeRecord(new Map([[0x101n, {type: prop2, optional: true}]])),
								prop2.union(SolidNull),
								SolidBoolean.union(SolidNull),
							],
						);
					});
				});
				context('access by index.', () => {
					context('with constant folding on, folds index accessor.', () => {
						let validator: Validator;
						let program: AST.ASTNodeGoal;
						before(() => {
							validator = new Validator();
							program = INDEX_ACCESS_PROGRAM(validator);
							program.varCheck(validator);
							program.typeCheck(validator);
						});
						it('returns individual entry types.', () => {
							assert.deepStrictEqual(
								program.children.slice(2, 8).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								expected,
							);
						});
						it('negative indices count backwards from end.', () => {
							assert.deepStrictEqual(
								program.children.slice(8, 14).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								expected,
							);
						});
						Dev.supports('optionalEntries') && it('unions with void if entry is optional.', () => {
							assert.deepStrictEqual(
								program.children.slice(22, 24).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									SolidString.union(SolidType.VOID),
									SolidString.union(SolidType.VOID),
								],
							);
						});
						Dev.supports('optionalAccess') && it('unions with null if entry and access are optional.', () => {
							assert.deepStrictEqual(
								program.children.slice(24, 28).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									new SolidTypeConstant(new SolidString('three')),
									SolidBoolean.TRUETYPE,
									SolidString.union(SolidNull),
									SolidString.union(SolidNull),
								],
							);
						});
						Dev.supports('claimAccess') && it('always subtracts void.', () => {
							assert.deepStrictEqual(
								[
									...program.children.slice(28, 32),
									program.children[33],
								].map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									new SolidTypeConstant(new SolidString('three')),
									SolidBoolean.TRUETYPE,
									SolidString,
									SolidString,
									Int16,
								],
							);
						});
						it('throws when index is out of bounds.', () => {
							assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].3;`).type(validator), TypeError04);
							assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].-4;`).type(validator), TypeError04);
							Dev.supports('optionalAccess') && assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.3;`).type(validator), TypeError04);
							Dev.supports('optionalAccess') && assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.-4;`).type(validator), TypeError04);
						});
					});
					context('with constant folding off.', () => {
						let validator: Validator;
						let program: AST.ASTNodeGoal;
						before(() => {
							validator = new Validator(folding_off);
							program = INDEX_ACCESS_PROGRAM(validator);
							program.varCheck(validator);
							program.typeCheck(validator);
						});
						it('returns the union of all entry types.', () => {
							program.children.slice(2, 8).forEach((c) => {
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									int_float_str,
								);
							});
						});
						Dev.supports('optionalEntries') && it('does not union with void, even with optional entries.', () => {
							program.children.slice(22, 24).forEach((c) => {
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									int_float_str,
								);
							});
						});
						Dev.supports('optionalAccess') && it('unions with null if access is optional.', () => {
							assert.deepStrictEqual(
								program.children.slice(24, 28).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									int_float_str.union(SolidNull),
									Int16.union(Float64).union(SolidNull),
									int_float_str.union(SolidNull),
									int_float_str.union(SolidNull),
								],
							);
						});
						Dev.supports('claimAccess') && it('always subtracts void.', () => {
							assert.deepStrictEqual(
								[
									...program.children.slice(28, 32),
									program.children[33],
								].map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									int_float_str,
									Int16.union(Float64),
									int_float_str,
									int_float_str,
									Int16,
								],
							);
						});
					});
				});
				context('access by key.', () => {
					let validator: Validator;
					let program: AST.ASTNodeGoal;
					before(() => {
						validator = new Validator();
						program = KEY_ACCESS_PROGRAM(validator);
						program.varCheck(validator);
						program.typeCheck(validator);
					});
					it('returns individual entry types.', () => {
						assert.deepStrictEqual(
							program.children.slice(2, 8).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected,
						);
					});
					Dev.supports('optionalEntries') && it('unions with void if entry is optional.', () => {
						assert.deepStrictEqual(
							program.children.slice(16, 18).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							[
								SolidString.union(SolidType.VOID),
								SolidString.union(SolidType.VOID),
							],
						);
					});
					Dev.supports('optionalAccess') && it('unions with null if entry and access are optional.', () => {
						assert.deepStrictEqual(
							program.children.slice(18, 22).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							[
								new SolidTypeConstant(new SolidString('three')),
								SolidBoolean.TRUETYPE,
								SolidString.union(SolidNull),
								SolidString.union(SolidNull),
							],
						);
					});
					Dev.supports('claimAccess') && it('always subtracts void.', () => {
						assert.deepStrictEqual(
							[
								...program.children.slice(22, 26),
								program.children[27],
							].map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							[
								new SolidTypeConstant(new SolidString('three')),
								SolidBoolean.TRUETYPE,
								SolidString,
								SolidString,
								Int16,
							],
						);
					});
					it('throws when key is out of bounds.', () => {
						assert.throws(() => AST.ASTNodeAccess.fromSource(`[a= 1, b= 2.0, c= 'three'].d;`).type(validator), TypeError04);
						Dev.supports('optionalAccess') && assert.throws(() => AST.ASTNodeAccess.fromSource(`[a= 1, b= 2.0, c= 'three']?.d;`).type(validator), TypeError04);
					});
				});
				context('access by computed expression.', () => {
					context('with constant folding on, folds expression accessor.', () => {
						let validator: Validator;
						let program: AST.ASTNodeGoal;
						before(() => {
							validator = new Validator();
							program = EXPR_ACCESS_PROGRAM(validator);
							program.varCheck(validator);
							program.typeCheck(validator);
						});
						it('returns individual entry types for tuples.', () => {
							assert.deepStrictEqual(
								program.children.slice(2, 8).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								expected,
							);
						});
						it('returns the union of all element types, constants, for sets.', () => {
							// TODO: #assess
							/*
							assert.deepStrictEqual(
								program.children.slice(12, 15).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								expected.slice(0, 3),
							);
							*/
							program.children.slice(15, 18).forEach((c) => {
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									unionAllTypes([
										typeConstInt(1n),
										typeConstFloat(2.0),
										SolidString,
									]),
								);
							});
						});
						it('returns the union of all consequent types, constants, for mappings.', () => {
							assert.deepStrictEqual(
								program.children.slice(18, 21).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								expected.slice(0, 3),
							);
							program.children.slice(21, 24).forEach((c) => {
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									unionAllTypes([
										typeConstInt(1n),
										typeConstFloat(2.0),
										SolidString,
									]),
								);
							});
						});
						Dev.supports('optionalEntries') && it('unions with void if tuple entry is optional.', () => {
							assert.deepStrictEqual(
								program.children.slice(32, 34).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									SolidString.union(SolidType.VOID),
									SolidString.union(SolidType.VOID),
								],
							);
						});
						Dev.supports('optionalAccess') && it('unions with null if tuple entry and access are optional.', () => {
							assert.deepStrictEqual(
								program.children.slice(34, 38).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									new SolidTypeConstant(new SolidString('three')),
									SolidBoolean.TRUETYPE,
									SolidString.union(SolidNull),
									SolidString.union(SolidNull),
								],
							);
						});
						Dev.supports('optionalAccess') && it('unions with null if set/mappping access is optional.', () => {
							const union: SolidType = unionAllTypes([
								typeConstInt(1n),
								typeConstFloat(2.0),
								SolidString,
								SolidNull,
							]);
							assert.deepStrictEqual(
								program.children.slice(39, 42).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)), // TODO: #assess
								[
									/*
									typeConstStr('three'),
									*/
									union,
									typeConstStr('three'),
									union,
								],
							);
						});
						Dev.supports('claimAccess') && it('always subtracts void.', () => {
							assert.deepStrictEqual(
								program.children.slice(42, 46).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									new SolidTypeConstant(new SolidString('three')),
									SolidBoolean.TRUETYPE,
									SolidString,
									SolidString,
								],
							);
						});
						it('throws when accessor expression is correct type but out of bounds for tuples.', () => {
							assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].[3];`).type(validator), TypeError04);
							assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].[-4];`).type(validator), TypeError04);
							Dev.supports('optionalAccess') && assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.[3];`).type(validator), TypeError04);
							Dev.supports('optionalAccess') && assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.[-4];`).type(validator), TypeError04);
						});
						it('does not throw when accessor expression is corect type but out of bounds for sets/mappings.', () => {
							/*
							TODO: since the compiler knows the value doesn’t exist (the assessor throws a VoidError),
							getting the type of this should return type `never`.
							*/
							const expected_oob: SolidType = unionAllTypes([
								new SolidTypeConstant(new SolidTuple([new Int16(1n)])),
								new SolidTypeConstant(new SolidTuple([new Float64(2.0)])),
								new SolidTypeConstant(new SolidTuple([new SolidString('three')])),
							]);
							assert.deepStrictEqual(
								AST.ASTNodeAccess.fromSource(`{[1], [2.0], ['three']}.[[1]];`).type(validator),
								expected_oob,
							);
							assert.deepStrictEqual(
								AST.ASTNodeAccess.fromSource(`{['a'] |-> [1], ['b'] |-> [2.0], ['c'] |-> ['three']}.[['a']];`).type(validator),
								expected_oob,
							);
						});
						it('throws when accessor expression is of incorrect type.', () => {
							assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].['3'];`).type(validator), TypeError02);
							assert.throws(() => AST.ASTNodeAccess.fromSource(`{1, 2.0, 'three'}.[true];`).type(validator), TypeError02);
							assert.throws(() => AST.ASTNodeAccess.fromSource(`{['a'] |-> 1, ['b'] |-> 2.0, ['c'] |-> 'three'}.['a'];`).type(validator), TypeError02);
						});
					});
					context('with constant folding off.', () => {
						let validator: Validator;
						let program: AST.ASTNodeGoal;
						before(() => {
							validator = new Validator(folding_off);
							program = EXPR_ACCESS_PROGRAM(validator);
							program.varCheck(validator);
							program.typeCheck(validator);
						});
						it('returns the union of all entry types for tuples.', () => {
							program.children.slice(2, 8).forEach((c) => {
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									int_float_str,
								);
							});
						});
						it('returns the union of all element types for sets.', () => {
							program.children.slice(15, 18).forEach((c) => { // TODO: #assess
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									int_float_str,
								);
							});
						});
						it('returns the union of all consequent types for mappings.', () => {
							program.children.slice(18, 24).forEach((c) => {
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									int_float_str,
								);
							});
						});
						Dev.supports('optionalEntries') && it('does not union with void, even with optional tuple entries.', () => {
							program.children.slice(32, 34).forEach((c) => {
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									int_float_str,
								);
							});
						});
						Dev.supports('optionalAccess') && it('unions with null if access is optional.', () => {
							assert.deepStrictEqual(
								program.children.slice(34, 38).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									int_float_str.union(SolidNull),
									Int16.union(Float64).union(SolidNull),
									int_float_str.union(SolidNull),
									int_float_str.union(SolidNull),
								],
							);
							program.children.slice(39, 42).forEach((c) => { // TODO: #assess
								assert.deepStrictEqual(
									typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
									int_float_str.union(SolidNull),
								);
							});
						});
						Dev.supports('claimAccess') && it('always subtracts void.', () => {
							assert.deepStrictEqual(
								program.children.slice(42, 46).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
								[
									int_float_str,
									Int16.union(Float64),
									int_float_str,
									int_float_str,
								],
							);
						});
					});
					it('throws when base object is of incorrect type.', () => {
						assert.throws(() => AST.ASTNodeAccess.fromSource(`(4).[2];`).type(new Validator()), TypeError01);
					});
				});
			});
			describe('#assess', () => {
				function evalOfStmtExpr(stmt: AST.ASTNodeStatementExpression, validator: Validator): SolidObject | null {
					return stmt.expr!.assess(validator);
				}
				const expected: (SolidObject | null)[] = [
					new Int16(1n),
					new Float64(2.0),
					new SolidString('three'),
					null,
					null,
					null,
				];
				const expected_o: (SolidObject | null)[] = [
					new SolidString('three'),
					SolidBoolean.TRUE,
					null,
					null,
				];
				Dev.supports('optionalAccess') && context('when base is nullish.', () => {
					it('optional access returns base when it is null.', () => {
						const validator: Validator = new Validator();
						assert.throws(() => AST.ASTNodeAccess.fromSource(`null.4;`)         .assess(validator), /TypeError: \w+\.get is not a function/);
						assert.throws(() => AST.ASTNodeAccess.fromSource(`null.four;`)      .assess(validator), /TypeError: \w+\.get is not a function/);
						assert.throws(() => AST.ASTNodeAccess.fromSource(`null.[[[[[]]]]];`).assess(validator), /TypeError: \w+\.get is not a function/);
						[
							AST.ASTNodeAccess.fromSource(`null?.3;`)         .assess(validator),
							AST.ASTNodeAccess.fromSource(`null?.four;`)      .assess(validator),
							AST.ASTNodeAccess.fromSource(`null?.[[[[[]]]]];`).assess(validator),
						].forEach((t) => {
							assert.strictEqual(t, SolidNull.NULL);
						});
					});
					it('chained optional access.', () => {
						const validator: Validator = new Validator();
						const program: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let bound1: [prop?: [bool]] = [prop= [true]];
							let bound2: [prop?: [?: bool]] = [prop= []];

							bound1;          % value \`[prop= [true]]\`
							bound1?.prop;    % value \`[true]\`
							bound1?.prop?.0; % value \`true\`

							bound2;          % value \`[prop= []]\`
							bound2?.prop;    % value \`[]\`
						`);
						program.varCheck(validator);
						program.typeCheck(validator);
						const prop1: SolidTuple = new SolidTuple([SolidBoolean.TRUE]);
						const prop2: SolidTuple = new SolidTuple();
						assert.deepStrictEqual(
							program.children.slice(2, 7).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							[
								new SolidRecord(new Map([[0x101n, prop1],])),
								prop1,
								SolidBoolean.TRUE,
								new SolidRecord(new Map([[0x101n, prop2]])),
								prop2,
							],
						);
						// must bypass type-checker:
						assert.deepStrictEqual(
							AST.ASTNodeAccess.fromSource(`[prop= []]?.prop?.0;`).assess(validator),
							SolidNull.NULL,
						);
					});
				});
				context('access by index.', () => {
					let validator: Validator;
					let program: AST.ASTNodeGoal;
					before(() => {
						validator = new Validator();
						program = INDEX_ACCESS_PROGRAM(validator);
						program.varCheck(validator);
						program.typeCheck(validator);
					});
					it('returns individual entries.', () => {
						assert.deepStrictEqual(
							program.children.slice(2, 8).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected,
						);
						Dev.supports('optionalAccess') && assert.deepStrictEqual(
							program.children.slice(24, 28).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected_o,
						);
						Dev.supports('claimAccess') && assert.deepStrictEqual(
							[
								...program.children.slice(28, 32),
								program.children[33]
							].map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							[
								...expected_o,
								null,
							],
						);
					});
					it('negative indices count backwards from end.', () => {
						assert.deepStrictEqual(
							program.children.slice(8, 14).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected,
						);
					});
					it('throws when index is out of bounds.', () => {
						assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].3;`).assess(validator), VoidError01);
						assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].-4;`).assess(validator), VoidError01);
					});
					Dev.supports('optionalAccess') && it('returns null when optionally accessing index out of bounds.', () => {
						[
							AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.3;`).assess(validator),
							AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.-4;`).assess(validator),
						].forEach((v) => {
							assert.deepStrictEqual(v, SolidNull.NULL);
						});
					});
				});
				context('access by key.', () => {
					let validator: Validator;
					let program: AST.ASTNodeGoal;
					before(() => {
						validator = new Validator();
						program = KEY_ACCESS_PROGRAM(validator);
						program.varCheck(validator);
						program.typeCheck(validator);
					});
					it('returns individual entries.', () => {
						assert.deepStrictEqual(
							program.children.slice(2, 8).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected,
						);
						Dev.supports('optionalAccess') && assert.deepStrictEqual(
							program.children.slice(18, 22).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected_o,
						);
						Dev.supports('claimAccess') && assert.deepStrictEqual(
							[
								...program.children.slice(22, 26),
								program.children[27]
							].map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							[
								...expected_o,
								null,
							],
						);
					});
					it('throws when key is out of bounds.', () => {
						assert.throws(() => AST.ASTNodeAccess.fromSource(`[a= 1, b= 2.0, c= 'three'].d;`).assess(validator), VoidError01);
					});
					Dev.supports('optionalAccess') && it('returns null when optionally accessing key out of bounds.', () => {
						[
							AST.ASTNodeAccess.fromSource(`[a= 1, b= 2.0, c= 'three']?.d;`).assess(validator),
						].forEach((v) => {
							assert.deepStrictEqual(v, SolidNull.NULL);
						});
					});
				});
				context('access by computed expression.', () => {
					let validator: Validator;
					let program: AST.ASTNodeGoal;
					before(() => {
						validator = new Validator();
						program = EXPR_ACCESS_PROGRAM(validator);
						program.varCheck(validator);
						program.typeCheck(validator);
					});
					it('returns individual entries for tuples.', () => {
						assert.deepStrictEqual(
							program.children.slice(2, 8).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected,
						);
						Dev.supports('optionalAccess') && assert.deepStrictEqual(
							program.children.slice(34, 38).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected_o,
						);
						Dev.supports('claimAccess') && assert.deepStrictEqual(
							program.children.slice(42, 46).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected_o,
						);
					});
					it('returns individual entries for mappings.', () => {
						assert.deepStrictEqual(
							program.children.slice(18, 24).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							expected,
						);
						Dev.supports('optionalAccess') && assert.deepStrictEqual(
							program.children.slice(40, 42).map((c) => evalOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
							[
								new SolidString('three'),
								null,
							],
						);
					});
					it('throws when index/antecedent is out of bounds.', () => {
						assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].[3];`).assess(validator), VoidError01);
						assert.throws(() => AST.ASTNodeAccess.fromSource(`{['a'] |-> 1, ['b'] |-> 2.0, ['c'] |-> 'three'}.[['a']];`).assess(validator), VoidError01);
					});
					Dev.supports('optionalAccess') && it('returns null when optionally accessing index/antecedent out of bounds.', () => {
						[
							AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.[3];`).assess(validator),
							AST.ASTNodeAccess.fromSource(`{['a'] |-> 1, ['b'] |-> 2.0, ['c'] |-> 'three'}?.[['a']];`).assess(validator),
						].forEach((v) => {
							assert.deepStrictEqual(v, SolidNull.NULL);
						});
					});
				});
			});
		});
	})
})
