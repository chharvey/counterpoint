import * as assert from 'assert';
import {
	CONFIG_DEFAULT,
	Operator,
	// {ASTNodeKey, ...} as AST,
	SymbolStructure,
	SymbolStructureVar,
	Validator,
	SolidType,
	SolidTypeList,
	Int16,
	SolidTuple,
	INST,
	Builder,
	AssignmentError01,
	TypeError03,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	CONFIG_FOLDING_OFF,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeDeclarationVariable', () => {
	describe('#varCheck', () => {
		it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
			const validator: Validator = new Validator();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let x: int = 42;
			`);
			assert.ok(!validator.hasSymbol(256n));
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


	describe('#typeCheck', () => {
		it('checks the assigned expression’s type against the variable assignee’s type.', () => {
			AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  int | float =  21  *  2;
			`).typeCheck(new Validator());
		})
		it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  null =  21  *  2;
			`).typeCheck(new Validator()), TypeError03);
		})
		it('always sets `SymbolStructure#type`.', () => {
			[
				CONFIG_DEFAULT,
				CONFIG_FOLDING_OFF,
			].forEach((config) => {
				const validator: Validator = new Validator(config);
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let x: int = 42;
					let y: int[] = [42];
					let z: mutable int[] = List.<int>([42]);
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.deepStrictEqual(
					[
						(validator.getSymbolInfo(256n) as SymbolStructureVar).type,
						(validator.getSymbolInfo(257n) as SymbolStructureVar).type,
						(validator.getSymbolInfo(258n) as SymbolStructureVar).type,
					],
					[
						Int16,
						new SolidTypeList(Int16),
						new SolidTypeList(Int16).mutableOf(),
					],
				);
			});
		});
		it('with int coersion on, allows assigning ints to floats.', () => {
			AST.ASTNodeDeclarationVariable.fromSource(`
				let x: float = 42;
			`).typeCheck(new Validator());
		})
		it('with int coersion off, throws when assigning int to float.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let x: float = 42;
			`).typeCheck(new Validator({
				...CONFIG_DEFAULT,
				compilerOptions: {
					...CONFIG_DEFAULT.compilerOptions,
					intCoercion: false,
				},
			})), TypeError03);
		})
		it('with constant folding on, only sets `SymbolStructure#value` if type is immutable and variable is fixed.', () => {
			const validator: Validator = new Validator();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let x: int = 42;
				let y: int[] = [42];
				let z: mutable int[] = List.<int>([42]);
				let unfixed w: int = 42;
			`);
			goal.varCheck(validator);
			goal.typeCheck(validator);
			assert.deepStrictEqual(
				[
					(validator.getSymbolInfo(256n) as SymbolStructureVar).value,
					(validator.getSymbolInfo(257n) as SymbolStructureVar).value,
					(validator.getSymbolInfo(258n) as SymbolStructureVar).value,
					(validator.getSymbolInfo(260n) as SymbolStructureVar).value, // 259n is TokenWorth("List")
				],
				[
					new Int16(42n),
					new SolidTuple<Int16>([new Int16(42n)]),
					null,
					null,
				],
			);
		});
		it('with constant folding off, never sets `SymbolStructure#value`.', () => {
			const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let x: int = 42;
				let y: int[] = [42];
				let z: mutable int[] = List.<int>([42]);
				let unfixed w: int = 42;
			`);
			goal.varCheck(validator);
			goal.typeCheck(validator);
			[
				(validator.getSymbolInfo(256n) as SymbolStructureVar),
				(validator.getSymbolInfo(257n) as SymbolStructureVar),
				(validator.getSymbolInfo(258n) as SymbolStructureVar),
				(validator.getSymbolInfo(260n) as SymbolStructureVar), // 259n is TokenWorth("List")
			].forEach((symbol) => {
				assert.strictEqual(symbol.value, null, symbol.source);
			});
		});
	});


	describe('#build', () => {
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
});
