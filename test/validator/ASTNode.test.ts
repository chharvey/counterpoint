import * as assert from 'assert'
import {
	CONFIG_DEFAULT,
	Dev,
} from '../../src/core/index.js';
import {
	Operator,
	// {ASTNodeKey, ...} as AST,
	SymbolStructure,
	SymbolStructureType,
	SymbolStructureVar,
	Validator,
} from '../../src/validator/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	TypeEntry,
	SolidType,
	SolidTypeConstant,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeList,
	SolidTypeHash,
	SolidTypeSet,
	SolidTypeMap,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidRecord,
	SolidSet,
	SolidMap,
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
	TypeError03,
	TypeError04,
	TypeError05,
	TypeError06,
} from '../../src/error/index.js';
import {
	assert_wasCalled,
	assertAssignable,
} from '../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
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
		describe('ASTNodeGoal', () => {
			it('aggregates multiple errors.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					a + b || c * d;
					let y: V & W | X & Y = null;
					let x: int = 42;
					let x: int = 420;
					x = 4200;
					type T = int;
					type T = float;
					let z: x = null;
					let z: int = T;
				`).varCheck(new Validator()), (err) => {
					assert.ok(err instanceof AggregateError);
					assertAssignable(err, {
						cons: AggregateError,
						errors: [
							{
								cons: AggregateError,
								errors: [
									{
										cons: AggregateError,
										errors: [
											{cons: ReferenceError01, message: '`a` is never declared.'},
											{cons: ReferenceError01, message: '`b` is never declared.'},
										],
									},
									{
										cons: AggregateError,
										errors: [
											{cons: ReferenceError01, message: '`c` is never declared.'},
											{cons: ReferenceError01, message: '`d` is never declared.'},
										],
									},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{
										cons: AggregateError,
										errors: [
											{cons: ReferenceError01, message: '`V` is never declared.'},
											{cons: ReferenceError01, message: '`W` is never declared.'},
										],
									},
									{
										cons: AggregateError,
										errors: [
											{cons: ReferenceError01, message: '`X` is never declared.'},
											{cons: ReferenceError01, message: '`Y` is never declared.'},
										],
									},
								],
							},
							{cons: AssignmentError01, message: 'Duplicate declaration: `x` is already declared.'},
							{cons: AssignmentError10, message: 'Reassignment of a fixed variable: `x`.'},
							{cons: AssignmentError01, message: 'Duplicate declaration: `T` is already declared.'},
							{cons: ReferenceError03,  message: '`x` refers to a value, but is used as a type.'},
							{cons: ReferenceError03,  message: '`T` refers to a type, but is used as a value.'},
						],
					});
					return true;
				});
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
				const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
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
		describe('ASTNodeGoal', () => {
			it('aggregates multiple errors.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let a: null = null;
					let b: null = null;
					let c: null = null;
					let d: null = null;
					a * b + c * d;
					let e: null = null;
					let f: null = null;
					let g: null = null;
					let h: null = null;
					e * f + g * h;
					if null then 42 else 4.2;
					let x: int = 4.2;
				`);
				const validator: Validator = new Validator();
				goal.varCheck(validator);
				assert.throws(() => goal.typeCheck(validator), (err) => {
					assert.ok(err instanceof AggregateError);
					assertAssignable(err, {
						cons: AggregateError,
						errors: [
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError01, message: 'Invalid operation: `a * b` at line 6 col 6.'}, // TODO remove line&col numbers from message
									{cons: TypeError01, message: 'Invalid operation: `c * d` at line 6 col 14.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError01, message: 'Invalid operation: `e * f` at line 11 col 6.'},
									{cons: TypeError01, message: 'Invalid operation: `g * h` at line 11 col 14.'},
								],
							},
							{cons: TypeError01, message: 'Invalid operation: `if null then 42 else 4.2` at line 12 col 6.'},
							{cons: TypeError03, message: `Expression of type ${ typeConstFloat(4.2) } is not assignable to type ${ Int16 }.`},
						],
					});
					return true;
				});
			});
		});
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
				const src: string = `
					let x: int = 42;
					let unfixed y: float = 4.2;
					x;
					y;
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, CONFIG_FOLDING_OFF);
				const builder: Builder = new Builder(src, CONFIG_FOLDING_OFF);
				assert.deepStrictEqual(
					[
						goal.children[2].build(builder),
						goal.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, new INST.InstructionGlobalGet(0x100n)),
						new INST.InstructionStatement(1n, new INST.InstructionGlobalGet(0x101n, true)),
					],
				);
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
				const src: string = `
					let x: int = 42;
					let unfixed y: float = 4.2;
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, CONFIG_FOLDING_OFF);
				const builder: Builder = new Builder(src, CONFIG_FOLDING_OFF);
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
		describe('#eval', () => {
			it('computes the value of constant null, boolean, or number types.', () => {
				assert.deepStrictEqual([
					`null`,
					`false`,
					`true`,
					`42`,
					`4.2e+3`,
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval(new Validator())), [
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
						.assigned as AST.ASTNodeTypeAlias)
						.eval(validator),
					Int16,
				);
			});
			it('computes the value of keyword type.', () => {
				assert.deepStrictEqual([
					'bool',
					'int',
					'float',
					'obj',
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval(new Validator())), [
					SolidBoolean,
					Int16,
					Float64,
					SolidObject,
				])
			})
			context('ASTNodeTypeCall', () => {
				const validator: Validator = new Validator();
				it('evaluates List, Hash, Set, and Map.', () => {
					assert.deepStrictEqual(
						[
							`List.<null>`,
							`Hash.<bool>`,
							`Set.<str>`,
							`Map.<int, float>`,
						].map((src) => AST.ASTNodeTypeCall.fromSource(src).eval(validator)),
						[
							new SolidTypeList(SolidNull),
							new SolidTypeHash(SolidBoolean),
							new SolidTypeSet(SolidString),
							new SolidTypeMap(Int16, Float64),
						],
					);
				});
				it('Map has a default type parameter.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeTypeCall.fromSource(`Map.<int>`).eval(validator),
						new SolidTypeMap(Int16, Int16),
					);
				});
				it('throws if base is not an ASTNodeTypeAlias.', () => {
					[
						`int.<str>`,
						`(List | Hash).<bool>`,
					].forEach((src) => {
						assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(validator), TypeError05);
					});
				});
				it('throws if base is not one of the allowed strings.', () => {
					[
						`SET.<str>`,
						`Mapping.<bool>`,
					].forEach((src) => {
						assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(validator), SyntaxError);
					});
				});
				it('throws when providing incorrect number of arguments.', () => {
					[
						`List.<null, null>`,
						`Hash.<bool, bool, bool>`,
						`Set.<str, str, str, str>`,
						`Map.<int, int, int, int, int>`,
					].forEach((src) => {
						assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(validator), TypeError06);
					});
				});
			});
			Dev.supports('optionalEntries') && specify('ASTNodeTypeTuple', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeTuple.fromSource(`[int, bool, ?:str]`).eval(new Validator()),
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
					node.eval(new Validator()),
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
			describe('ASTNodeTypeList', () => {
				it('returns a SolidTypeList if there is no count.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeTypeList.fromSource(`(int | bool)[]`).eval(new Validator()),
						new SolidTypeList(Int16.union(SolidBoolean)),
					);
				});
				it('returns a SolidTypeTuple if there is a count.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeTypeList.fromSource(`(int | bool)[3]`).eval(new Validator()),
						SolidTypeTuple.fromTypes([
							Int16.union(SolidBoolean),
							Int16.union(SolidBoolean),
							Int16.union(SolidBoolean),
						]),
					);
				});
			});
			specify('ASTNodeTypeHash', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeHash.fromSource(`[:int | bool]`).eval(new Validator()),
					new SolidTypeHash(Int16.union(SolidBoolean)),
				);
			});
			specify('ASTNodeTypeSet', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeSet.fromSource(`(int | bool){}`).eval(new Validator()),
					new SolidTypeSet(Int16.union(SolidBoolean)),
				);
			});
			specify('ASTNodeTypeMap', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeMap.fromSource(`{int -> bool}`).eval(new Validator()),
					new SolidTypeMap(Int16, SolidBoolean),
				);
			});
			it('computes the value of a nullified (ORNULL) type.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeOperationUnary.fromSource(`int?`).eval(new Validator()),
					Int16.union(SolidNull),
				)
			})
			it('computes the value of AND and OR operators', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeOperationBinary.fromSource(`obj & 3`).eval(new Validator()),
					SolidObject.intersect(typeConstInt(3n)),
				)
				assert.deepStrictEqual(
					AST.ASTNodeTypeOperationBinary.fromSource(`4.2 | int`).eval(new Validator()),
					typeConstFloat(4.2).union(Int16),
				)
			})
		})
	})


	describe('ASTNodeExpression', () => {
		describe('#type', () => {
			it('returns Never for undeclared variables.', () => {
				assert.strictEqual(AST.ASTNodeVariable.fromSource(`x;`).type(new Validator()), SolidType.NEVER);
			});

			Dev.supports('literalCollection') && describe('ASTNode{Tuple,Record,Set,Map}', () => {
				let collections: readonly [
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeSet,
					AST.ASTNodeMap,
				];
				function initCollections() {
					return [
						AST.ASTNodeTuple.fromSource(`[1, 2.0, 'three'];`),
						AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, c= 'three'];`),
						AST.ASTNodeSet.fromSource(`{1, 2.0, 'three'};`),
						AST.ASTNodeMap.fromSource(`
							{
								'a' || '' -> 1,
								21 + 21   -> 2.0,
								3 * 1.0   -> 'three',
							};
						`),
					] as const;
				}
				context('with constant folding on.', () => {
					const validator: Validator = new Validator();
					let types: SolidType[];
					before(() => {
						collections = initCollections();
						types = collections.map((c) => assert_wasCalled(c.fold, 1, (orig, spy) => {
							c.fold = spy;
							try {
								return c.type(validator);
							} finally {
								c.fold = orig;
							};
						}));
					});
					it('returns the result of `this#fold`, wrapped in a `new SolidTypeConstant`.', () => {
						assert.deepStrictEqual(
							types,
							collections.map((c) => new SolidTypeConstant(c.fold(validator)!)),
						);
					});
				});
				it('with constant folding off.', () => {
					const expected: SolidTypeConstant[] = [typeConstInt(1n), typeConstFloat(2.0), typeConstStr('three')];
					collections = initCollections();
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					assert.deepStrictEqual(
						collections.map((node) => node.type(validator)),
						[
							SolidTypeTuple.fromTypes(expected),
							SolidTypeRecord.fromTypes(new Map(collections[1].children.map((c, i) => [
								c.key.id,
								expected[i],
							]))),
							new SolidTypeSet(SolidType.unionAll(expected)),
							new SolidTypeMap(
								SolidType.unionAll([typeConstStr('a'), Int16, Float64]),
								SolidType.unionAll(expected),
							),
						],
					);
				});
			});
		});

		describe('#fold', () => {
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
						(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(validator),
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
						(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(validator),
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
						(goal.children[2] as AST.ASTNodeStatementExpression).expr!.fold(validator),
						null,
					);
				});
			});

			Dev.supports('literalCollection') && describe('ASTNode{Tuple,Record,Set,Map}', () => {
				it('returns a constant Tuple/Record/Set/Map for foldable entries.', () => {
					assert.deepStrictEqual(
						[
							AST.ASTNodeTuple.fromSource(`[1, 2.0, 'three'];`),
							AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, c= 'three'];`),
							AST.ASTNodeSet.fromSource(`{1, 2.0, 'three'};`),
							AST.ASTNodeMap.fromSource(`
								{
									'a' || '' -> 1,
									21 + 21   -> 2.0,
									3 * 1.0   -> 'three',
								};
							`),
						].map((c) => c.fold(new Validator())),
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
							new SolidMap(new Map<SolidObject, SolidObject>([
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
							'a' || '' -> 1,
							21 + 21   -> y,
							3 * 1.0   -> 'three',
						};
					`);
					const tuple:   AST.ASTNodeTuple   = (goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTuple;
					const record:  AST.ASTNodeRecord  = (goal.children[4] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeRecord;
					const map:     AST.ASTNodeMap     = (goal.children[5] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeMap;
					assert.deepStrictEqual(
						[
							tuple,
							record,
							map,
						].map((c) => c.fold(new Validator())),
						[null, null, null],
					);
				});
				it('ASTNodeRecord overwrites duplicate keys.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, a= 'three'];`).fold(new Validator()),
						new SolidRecord(new Map<bigint, SolidObject>([
							[0x101n, new Float64(2.0)],
							[0x100n, new SolidString('three')],
						])),
					);
				});
			});
		})

		Dev.supports('literalCollection') && describe('ASTNodeTypeAccess', () => {
			describe('#eval', () => {
				function evalTypeDecl(decl: AST.ASTNodeDeclarationType, validator: Validator): SolidType {
					return decl.assigned.eval(validator);
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
							program.children.slice(2, 8).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							expected,
						);
					});
					it('negative indices count backwards from end.', () => {
						assert.deepStrictEqual(
							program.children.slice(8, 14).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							expected,
						);
					});
					Dev.supports('optionalAccess') && it('unions with void if entry is optional.', () => {
						assert.deepStrictEqual(
							program.children.slice(24, 26).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							[
								typeConstStr('three').union(SolidType.VOID),
								SolidString.union(SolidType.VOID),
							],
						);
					});
					it('throws when index is out of bounds.', () => {
						assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[1, 2.0, 'three'].3`) .eval(validator), TypeError04);
						assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[1, 2.0, 'three'].-4`).eval(validator), TypeError04);
					});
				});
				context('key access.', () => {
					it('returns individual entry types.', () => {
						assert.deepStrictEqual(
							program.children.slice(16, 22).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							expected,
						);
					});
					Dev.supports('optionalAccess') && it('unions with void if entry is optional.', () => {
						assert.deepStrictEqual(
							program.children.slice(28, 30).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
							[
								typeConstFloat(2.0).union(SolidType.VOID),
								Float64.union(SolidType.VOID),
							],
						);
					});
					it('throws when key is out of bounds.', () => {
						assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[a: 1, b: 2.0, c: 'three'].d`).eval(validator), TypeError04);
					});
				});
			});
		});
	})
})
