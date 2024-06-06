import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	AST,
	type SymbolStructure,
	SymbolStructureType,
	TYPE,
	AssignmentErrorDuplicateDeclaration,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {assertEqualBins} from '../../assert-helpers.js';



describe('ASTNodeDeclarationType', () => {
	describe('#varCheck', () => {
		it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
			`);
			assert.ok(!goal.validator.hasSymbol(0x100n));
			goal.varCheck();
			assert.ok(goal.validator.hasSymbol(0x100n));
			const info: SymbolStructure | null = goal.validator.getSymbolInfo(0x100n);
			assert_instanceof(info, SymbolStructureType);
			assert.strictEqual(info.typevalue, TYPE.UNKNOWN);
		});
		it('throws if the validator already contains a record for the symbol.', () => {
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				type T = int;
				type T = float;
			`).varCheck(), AssignmentErrorDuplicateDeclaration);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				let FOO: int = 42;
				type FOO = float;
			`).varCheck(), AssignmentErrorDuplicateDeclaration);
		});
	});


	describe('#typeCheck', () => {
		it('sets `SymbolStructure#value`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
			`);
			goal.varCheck();
			goal.typeCheck();
			assert.deepStrictEqual(
				(goal.validator.getSymbolInfo(0x100n) as SymbolStructureType).typevalue,
				TYPE.INT,
			);
		});
	});


	describe('#build', () => {
		it('always returns `(nop)`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
				type U = T | float;
			`);
			return xjs.Array.forEachAggregated(goal.children, (stmt) => assertEqualBins(stmt.build(), goal.builder.module.nop()));
		});
	});
});
