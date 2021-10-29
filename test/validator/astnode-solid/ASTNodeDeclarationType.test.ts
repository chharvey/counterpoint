import * as assert from 'assert';
import {
	// {ASTNodeKey, ...} as AST,
	SymbolStructure,
	SymbolStructureType,
	Validator,
	SolidType,
	INST,
	Builder,
	AssignmentError01,
} from '../../../src/index.js';
import * as AST from '../../../src/validator/astnode-solid/index.js'; // HACK



describe('ASTNodeDeclarationType', () => {
	describe('#varCheck', () => {
		it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown`.', () => {
			const validator: Validator = new Validator();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
			`);
			assert.ok(!validator.hasSymbol(256n));
			goal.varCheck(validator);
			assert.ok(validator.hasSymbol(256n));
			const info: SymbolStructure | null = validator.getSymbolInfo(256n);
			assert.ok(info instanceof SymbolStructureType);
			assert.strictEqual(info.typevalue, SolidType.UNKNOWN);
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


	describe('#typeCheck', () => {
		it('sets `SymbolStructure#value`.', () => {
			const validator: Validator = new Validator();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
			`);
			goal.varCheck(validator);
			goal.typeCheck(validator);
			assert.deepStrictEqual(
				(validator.getSymbolInfo(256n) as SymbolStructureType).typevalue,
				SolidType.INT,
			);
		});
	});


	describe('#build', () => {
		it('always returns InstructionNone.', () => {
			const src: string = `
				type T = int;
				type U = T | float;
			`;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
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
	});
});
