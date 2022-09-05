import * as assert from 'assert';
import {
	Operator,
	AST,
	SymbolStructure,
	SymbolStructureType,
	SymbolStructureVar,
	TYPE,
	INST,
	Builder,
	ReferenceError03,
	AssignmentError01,
	AssignmentError10,
	TypeError03,
	MutabilityError01,
} from '../../../src/index.js';
import {
	assertAssignable,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	CONFIG_COERCION_OFF,
	instructionConstInt,
	instructionConstFloat,
} from '../../helpers.js';



describe('ASTNodeDeclaration', () => {
	describe('ASTNodeDeclarationType', () => {
		describe('#varCheck', () => {
			it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown`.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					type T = int;
				}`);
				assert.ok(!goal.validator.hasSymbol(256n));
				goal.varCheck();
				assert.ok(goal.validator.hasSymbol(256n));
				const info: SymbolStructure | null = goal.validator.getSymbolInfo(256n);
				assert.ok(info instanceof SymbolStructureType);
				assert.strictEqual(info.typevalue, TYPE.Type.UNKNOWN);
			});
			it('throws if the validator already contains a record for the symbol.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = int;
					type T = float;
				}`).varCheck(), AssignmentError01);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let FOO: int = 42;
					type FOO = float;
				}`).varCheck(), AssignmentError01);
			});
		});


		describe('#typeCheck', () => {
			it('sets `SymbolStructure#value`.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					type T = int;
				}`);
				goal.varCheck();
				goal.typeCheck();
				assert.deepStrictEqual(
					(goal.validator.getSymbolInfo(256n) as SymbolStructureType).typevalue,
					TYPE.Type.INT,
				);
			});
		});


		describe('#build', () => {
			it('always returns InstructionNone.', () => {
				const src: string = `{
					type T = int;
					type U = T | float;
				}`;
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
				const builder: Builder = new Builder(src);
				assert.deepStrictEqual(
					[
						block.children[0].build(builder),
						block.children[1].build(builder),
					],
					[
						new INST.InstructionNone(),
						new INST.InstructionNone(),
					],
				);
			});
		});
	});



	describe('ASTNodeDeclarationVariable', () => {
		describe('#varCheck', () => {
			it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					let x: int = 42;
				}`);
				assert.ok(!goal.validator.hasSymbol(256n));
				goal.varCheck();
				assert.ok(goal.validator.hasSymbol(256n));
				const info: SymbolStructure | null = goal.validator.getSymbolInfo(256n);
				assert.ok(info instanceof SymbolStructureVar);
				assert.strictEqual(info.type, TYPE.Type.UNKNOWN);
				assert.strictEqual(info.value, null);
			});
			it('throws if the validator already contains a record for the variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let i: int = 42;
					let i: int = 43;
				}`).varCheck(), AssignmentError01);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type FOO = float;
					let FOO: int = 42;
				}`).varCheck(), AssignmentError01);
			});
		});


		describe('#typeCheck', () => {
			it('checks the assigned expression’s type against the variable assignee’s type.', () => {
				AST.ASTNodeDeclarationVariable.fromSource(`
					let  the_answer:  int | float =  21  *  2;
				`).typeCheck();
			})
			it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
				assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
					let  the_answer:  null =  21  *  2;
				`).typeCheck(), TypeError03);
			})
			it('disallows assigning a collection literal to a wider mutable type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					let t2: mutable [42 | 4.3]          = [42];
					let r2: mutable [x: 42 | 4.3]       = [x= 42];
					let s2: mutable (42 | 4.3){}        = {42};
					let m2: mutable {true? -> 42 | 4.3} = {true -> 42};

					let t3: mutable [int]         = [42];
					let r3: mutable [x: int]      = [x= 42];
					let s3: mutable int{}         = {42};
					let m3: mutable {bool -> int} = {true -> 42};

					type T = [int];
					let v: T = [42];
					let t4: mutable [T?]         = [v];
					let r4: mutable [x: T?]      = [x= v];
					let s4: mutable T?{}         = {v};
					let m4: mutable {bool -> T?} = {true -> v};
				}`);
				goal.varCheck();
				assert.throws(() => goal.typeCheck(), (err) => {
					assert.ok(err instanceof AggregateError);
					assertAssignable(err, {
						cons: AggregateError,
						errors: [
							{cons: TypeError03, message: 'Expression of type mutable [42] is not assignable to type mutable [42 | 4.3].'},
							{cons: TypeError03, message: 'Expression of type mutable [258: 42] is not assignable to type mutable [258: 42 | 4.3].'},
							{cons: TypeError03, message: 'Expression of type mutable Set.<42> is not assignable to type mutable Set.<42 | 4.3>.'},
							{cons: TypeError03, message: 'Expression of type mutable Map.<true, 42> is not assignable to type mutable Map.<true | null, 42 | 4.3>.'},

							{cons: TypeError03, message: 'Expression of type mutable [42] is not assignable to type mutable [int].'},
							{cons: TypeError03, message: 'Expression of type mutable [258: 42] is not assignable to type mutable [258: int].'},
							{cons: TypeError03, message: 'Expression of type mutable Set.<42> is not assignable to type mutable Set.<int>.'},
							{cons: TypeError03, message: 'Expression of type mutable Map.<true, 42> is not assignable to type mutable Map.<bool, int>.'},

							{cons: TypeError03, message: 'Expression of type mutable [[int]] is not assignable to type mutable [[int] | null].'},
							{cons: TypeError03, message: 'Expression of type mutable [258: [int]] is not assignable to type mutable [258: [int] | null].'},
							{cons: TypeError03, message: 'Expression of type mutable Set.<[int]> is not assignable to type mutable Set.<[int] | null>.'},
							{cons: TypeError03, message: 'Expression of type mutable Map.<true, [int]> is not assignable to type mutable Map.<bool, [int] | null>.'},
						],
					});
					return true;
				});
			});
			it('with int coersion on, allows assigning ints to floats.', () => {
				AST.ASTNodeDeclarationVariable.fromSource(`
					let x: float = 42;
				`).typeCheck();
			})
			it('with int coersion off, throws when assigning int to float.', () => {
				assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
					let x: float = 42;
				`, CONFIG_COERCION_OFF).typeCheck(), TypeError03);
			})
		});


		describe('#build', () => {
			it('with constant folding on, returns InstructionNone for fixed & foldable variables.', () => {
				const src: string = `{
					let x: int = 42;
					let y: float = 4.2 * 10;
				}`;
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
				block.varCheck();
				block.typeCheck();
				const builder: Builder = new Builder(src)
				assert.deepStrictEqual(
					[
						block.children[0].build(builder),
						block.children[1].build(builder),
					],
					[
						new INST.InstructionNone(),
						new INST.InstructionNone(),
					],
				);
			});
			it('with constant folding on, returns InstructionDeclareGlobal for unfixed / non-foldable variables.', () => {
				const src: string = `{
					let unfixed x: int = 42;
					let y: int = x + 10;
				}`;
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
				block.varCheck();
				block.typeCheck();
				const builder: Builder = new Builder(src)
				assert.deepStrictEqual(
					[
						block.children[0].build(builder),
						block.children[1].build(builder),
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
				const src: string = `{
					let x: int = 42;
					let unfixed y: float = 4.2;
				}`;
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src, CONFIG_FOLDING_OFF);
				block.varCheck();
				block.typeCheck();
				const builder: Builder = new Builder(src, CONFIG_FOLDING_OFF);
				assert.deepStrictEqual(
					[
						block.children[0].build(builder),
						block.children[1].build(builder),
					],
					[
						new INST.InstructionDeclareGlobal(0x100n, false, instructionConstInt(42n)),
						new INST.InstructionDeclareGlobal(0x101n, true,  instructionConstFloat(4.2)),
					],
				);
			});
		});
	});


	describe('ASTNodeDeclarationClaim', () => {
		describe('#typeCheck', () => {
			it('throws when the assignee type and claimed type do not overlap.', () => {
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(`{
					let x: int = 3;
					claim x: str;
				}`);
				block.varCheck();
				assert.throws(() => block.typeCheck(), TypeError03);
			});
			it('with int coersion off, does not allow converting between int and float.', () => {
				[
					`{
						let x: int = 3;
						claim x: float;
					}`,
					`{
						let x: float = 3.0;
						claim x: int;
					}`,
				].forEach((src) => {
					const block_ok: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
					block_ok.varCheck();
					block_ok.typeCheck(); // assert does not throw
					const block_err: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src, CONFIG_COERCION_OFF);
					block_err.varCheck();
					assert.throws(() => block_err.typeCheck(), TypeError03);
				});
			});
			it('disallows reassigning incorrect type, but only after claim.', () => {
				const block_ok = AST.ASTNodeBlock.fromSource(`
					{
						let unfixed x: bool? = false;
						set x = true;
						claim x: null;
					}
				`);
				block_ok.varCheck();
				block_ok.typeCheck(); // assert does not throw
				const block_err = AST.ASTNodeBlock.fromSource(`
					{
						let unfixed x: bool? = false;
						claim x: null;
						set x = true;
					}
				`);
				block_err.varCheck();
				assert.throws(() => block_err.typeCheck(), TypeError03);
			});
		});


		describe('#build', () => {
			it('always returns InstructionNone.', () => {
				const src: string = `{
					claim x: T;
				}`;
				assert.deepStrictEqual(
					AST.ASTNodeBlock.fromSource(src).children[0].build(new Builder('')),
					new INST.InstructionNone(),
				);
			});
		});
	});



	describe('ASTNodeDeclarationReassignment', () => {
		describe('#varCheck', () => {
			it('throws if the variable is not unfixed.', () => {
				AST.ASTNodeGoal.fromSource(`{
					let unfixed i: int = 42;
					set i = 43;
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let i: int = 42;
					set i = 43;
				}`).varCheck(), AssignmentError10);
			});
			it('always throws for type alias reassignment.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = 42;
					set T = 43;
				}`).varCheck(), ReferenceError03);
			});
		});


		describe('#typeCheck', () => {
			context('for variable reassignment.', () => {
				it('throws when variable assignee type is not supertype.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
						let unfixed i: int = 42;
						set i = 4.3;
					}`);
					goal.varCheck();
					assert.throws(() => goal.typeCheck(), TypeError03);
				});
			});

			context('for property reassignment.', () => {
				it('throws when property assignee type is not supertype.', () => {
					[
						`{
							let t: mutable [42] = [42];
							set t.0 = 4.2;
						}`,
						`{
							let r: mutable [i: 42] = [i= 42];
							set r.i = 4.2;
						}`,
						`{
							let l: mutable int[] = List.<int>([42]);
							set l.0 = 4.2;
						}`,
						`{
							let d: mutable [:int] = Dict.<int>([i= 42]);
							set d.i = 4.2;
						}`,
						`{
							let s: mutable int{} = Set.<int>([42]);
							set s.[42] = 4.2;
						}`,
						`{
							let m: mutable {bool -> int} = Map.<bool, int>([[true, 42]]);
							set m.[true] = 4.2;
						}`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeError03);
					});
				});
				it('throws when assignee’s base type is not mutable.', () => {
					[
						`{
							let t: [42] = [42];
							set t.0 = 4.2;
						}`,
						`{
							let r: [i: 42] = [i= 42];
							set r.i = 4.2;
						}`,
						`{
							let l: int[] = List.<int>([42]);
							set l.0 = 4.2;
						}`,
						`{
							let d: [:int] = Dict.<int>([i= 42]);
							set d.i = 4.2;
						}`,
						`{
							let s: int{} = Set.<int>([42]);
							set s.[42] = 4.2;
						}`,
						`{
							let m: {bool -> int} = Map.<bool, int>([[true, 42]]);
							set m.[true] = 4.2;
						}`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), MutabilityError01);
					});
				});
			});
		});


		describe('#build', () => {
			it('always returns InstructionStatement containing InstructionGlobalSet.', () => {
				const src: string = `{
					let unfixed y: float = 4.2;
					set y = y * 10;
				}`;
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
				const builder: Builder = new Builder(src);
				assert.deepStrictEqual(
					block.children[1].build(builder),
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
});
