import * as assert from 'assert';
import {
	ASTNODE_SOLID as AST,
	SymbolStructure,
	SymbolStructureType,
	SolidType,
	INST,
	Builder,
	AssignmentError01,
} from '../../../src/index.js';



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
			assert.strictEqual(info.typevalue, SolidType.UNKNOWN);
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
				SolidType.INT,
			);
		});
	});


	describe('#build', () => {
		it('always returns InstructionNone.', () => {
			const src: string = `{
				type T = int;
				type U = T | float;
			}`;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
			const builder: Builder = new Builder(src);
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
	});
});
