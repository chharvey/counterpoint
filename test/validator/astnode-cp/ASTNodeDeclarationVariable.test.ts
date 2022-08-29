import * as assert from 'assert';
import {
	Operator,
	AST,
	SymbolStructure,
	SymbolStructureVar,
	TYPE,
	INST,
	Builder,
	AssignmentError01,
	TypeError03,
} from '../../../src/index.js';
import {assertAssignable} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	CONFIG_COERCION_OFF,
	instructionConstInt,
	instructionConstFloat,
} from '../../helpers.js';



describe('ASTNodeDeclarationVariable', () => {
	describe('#varCheck', () => {
		it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let x: int = 42;
			`);
			assert.ok(!goal.validator.hasSymbol(256n));
			goal.varCheck();
			assert.ok(goal.validator.hasSymbol(256n));
			const info: SymbolStructure | null = goal.validator.getSymbolInfo(256n);
			assert.ok(info instanceof SymbolStructureVar);
			assert.strictEqual(info.type, TYPE.Type.UNKNOWN);
			assert.strictEqual(info.value, null);
		});
		it('throws if the validator already contains a record for the variable.', () => {
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				let i: int = 42;
				let i: int = 43;
			`).varCheck(), AssignmentError01);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				type FOO = float;
				let FOO: int = 42;
			`).varCheck(), AssignmentError01);
		});
	});


	describe('#typeCheck', () => {
		it('checks the assigned expression’s type against the variable assignee’s type.', () => {
			AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  int | float =  21  *  2;
			`).typeCheck();
		});
		it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  null =  21  *  2;
			`).typeCheck(), TypeError03);
		});
		it('disallows assigning a collection literal to a wider mutable type.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
			`);
			goal.varCheck();
			assert.throws(() => goal.typeCheck(), (err) => {
				assert.ok(err instanceof AggregateError);
				assertAssignable(err, {
					cons:   AggregateError,
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
		});
		it('with int coersion off, throws when assigning int to float.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let x: float = 42;
			`, CONFIG_COERCION_OFF).typeCheck(), TypeError03);
		});
	});


	describe('#build', () => {
		it('with constant folding on, returns InstructionNone for fixed & foldable variables.', () => {
			const src: string = `
				let x: int = 42;
				let y: float = 4.2 * 10;
			`;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
			goal.varCheck();
			goal.typeCheck();
			const builder: Builder = new Builder(src);
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
			goal.varCheck();
			goal.typeCheck();
			const builder: Builder = new Builder(src);
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
			goal.varCheck();
			goal.typeCheck();
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
