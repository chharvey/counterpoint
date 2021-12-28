import * as assert from 'assert';
import {
	CONFIG_DEFAULT,
	Operator,
	ASTNODE_SOLID as AST,
	SymbolStructure,
	SymbolStructureVar,
	SolidType,
	SolidTypeTuple,
	SolidTypeList,
	Int16,
	SolidTuple,
	INST,
	Builder,
	AssignmentError01,
	TypeError03,
} from '../../../src/index.js';
import {
	assertAssignable,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	instructionConstInt,
	instructionConstFloat,
	typeConstInt,
} from '../../helpers.js';



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
			assert.strictEqual(info.type, SolidType.UNKNOWN);
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
		const abcde: string = `{
			let a: int = 42;
			let b: int[] = [42];
			let unfixed c: int = 42;
			let d: mutable [42] = [42];
			let e: mutable int[] = List.<int>([42]);
		}`;
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
		it('allows assigning a collection literal to a wider mutable type.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
				let t1: mutable [42]         = [42];
				let r1: mutable [x: 42]      = [x= 42];
				let s1: mutable 42{}         = {42};
				let m1: mutable {true -> 42} = {true -> 42};

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
			goal.typeCheck(); // assert does not throw
		});
		it('disallows assigning a constructor call to a wider mutable type.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
				let a: mutable int[]         = List.<42>([42]);
				let b: mutable [:int]        = Hash.<42>([x= 42]);
				let c: mutable int{}         = Set.<42>([42]);
				let d: mutable {bool -> int} = Map.<true, 42>([[true, 42]]);
			}`);
			goal.varCheck();
			assert.throws(() => {
				goal.typeCheck();
			}, (err) => {
				assert.ok(err instanceof AggregateError);
				assertAssignable(err, {
					cons: AggregateError,
					errors: [
						{cons: TypeError03, message: 'Expression of type mutable List.<42> is not assignable to type mutable List.<int>.'},
						{cons: TypeError03, message: 'Expression of type mutable Hash.<42> is not assignable to type mutable Hash.<int>.'},
						{cons: TypeError03, message: 'Expression of type mutable Set.<42> is not assignable to type mutable Set.<int>.'},
						{cons: TypeError03, message: 'Expression of type mutable Map.<true, 42> is not assignable to type mutable Map.<bool, int>.'},
					],
				});
				return true;
			});
		});
		it('allows assigning a tuple/record collection literal to a corresponding list/hash type.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
				let t1: mutable 42[]  = [42];
				let r1: mutable [:42] = [x= 42];

				let t2: mutable (42 | 4.3)[] = [42];
				let r2: mutable [:42 | 4.3]  = [x= 42];

				let t3: mutable [int]  = [42];
				let r3: mutable [:int] = [x= 42];
			}`);
			goal.varCheck();
			goal.typeCheck(); // assert does not throw
		});
		it('always sets `SymbolStructure#type`.', () => {
			[
				CONFIG_DEFAULT,
				CONFIG_FOLDING_OFF,
			].forEach((config) => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(abcde, config);
				goal.varCheck();
				goal.typeCheck();
				assert.deepStrictEqual(
					[
						(goal.validator.getSymbolInfo(256n) as SymbolStructureVar).type,
						(goal.validator.getSymbolInfo(257n) as SymbolStructureVar).type,
						(goal.validator.getSymbolInfo(258n) as SymbolStructureVar).type,
						(goal.validator.getSymbolInfo(259n) as SymbolStructureVar).type,
						(goal.validator.getSymbolInfo(260n) as SymbolStructureVar).type,
					],
					[
						SolidType.INT,
						new SolidTypeList(SolidType.INT),
						SolidType.INT,
						SolidTypeTuple.fromTypes([typeConstInt(42n)]).mutableOf(),
						new SolidTypeList(SolidType.INT).mutableOf(),
					],
				);
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
			`, {
				...CONFIG_DEFAULT,
				compilerOptions: {
					...CONFIG_DEFAULT.compilerOptions,
					intCoercion: false,
				},
			}).typeCheck(), TypeError03);
		})
		it('with constant folding on, only sets `SymbolStructure#value` if type is immutable and variable is fixed.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(abcde);
			goal.varCheck();
			goal.typeCheck();
			assert.deepStrictEqual(
				[
					(goal.validator.getSymbolInfo(256n) as SymbolStructureVar).value,
					(goal.validator.getSymbolInfo(257n) as SymbolStructureVar).value,
					(goal.validator.getSymbolInfo(258n) as SymbolStructureVar).value,
					(goal.validator.getSymbolInfo(259n) as SymbolStructureVar).value,
					(goal.validator.getSymbolInfo(260n) as SymbolStructureVar).value,
				],
				[
					new Int16(42n),
					new SolidTuple<Int16>([new Int16(42n)]),
					null,
					null,
					null,
				],
			);
		});
		it('with constant folding off, never sets `SymbolStructure#value`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(abcde, CONFIG_FOLDING_OFF);
			goal.varCheck();
			goal.typeCheck();
			[
				(goal.validator.getSymbolInfo(256n) as SymbolStructureVar),
				(goal.validator.getSymbolInfo(257n) as SymbolStructureVar),
				(goal.validator.getSymbolInfo(258n) as SymbolStructureVar),
				(goal.validator.getSymbolInfo(259n) as SymbolStructureVar),
				(goal.validator.getSymbolInfo(260n) as SymbolStructureVar),
			].forEach((symbol) => {
				assert.strictEqual(symbol.value, null, symbol.source);
			});
		});
	});


	describe('#build', () => {
		it('with constant folding on, returns InstructionNone for fixed & foldable variables.', () => {
			const src: string = `{
				let x: int = 42;
				let y: float = 4.2 * 10;
			}`;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
			goal.varCheck();
			goal.typeCheck();
			const builder: Builder = new Builder(src)
			assert.deepStrictEqual(
				[
					goal.block!.children[0].build(builder),
					goal.block!.children[1].build(builder),
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
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
			goal.varCheck();
			goal.typeCheck();
			const builder: Builder = new Builder(src)
			assert.deepStrictEqual(
				[
					goal.block!.children[0].build(builder),
					goal.block!.children[1].build(builder),
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
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, CONFIG_FOLDING_OFF);
			goal.varCheck();
			goal.typeCheck();
			const builder: Builder = new Builder(src, CONFIG_FOLDING_OFF);
			assert.deepStrictEqual(
				[
					goal.block!.children[0].build(builder),
					goal.block!.children[1].build(builder),
				],
				[
					new INST.InstructionDeclareGlobal(0x100n, false, instructionConstInt(42n)),
					new INST.InstructionDeclareGlobal(0x101n, true,  instructionConstFloat(4.2)),
				],
			);
		});
	});
});
