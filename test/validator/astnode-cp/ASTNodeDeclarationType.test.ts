import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	AST,
	type SymbolStructure,
	SymbolStructureType,
	TYPE,
	Builder,
	AssignmentError01,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {assertEqualBins} from '../../assert-helpers.js';



describe('ASTNodeDeclarationType', () => {
	describe('#varCheck', () => {
		it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
			`);
			assert.ok(!goal.validator.hasSymbol(256n));
			goal.varCheck();
			assert.ok(goal.validator.hasSymbol(256n));
			const info: SymbolStructure | null = goal.validator.getSymbolInfo(256n);
			assert_instanceof(info, SymbolStructureType);
			assert.strictEqual(info.typevalue, TYPE.UNKNOWN);
		});
		it('throws if the validator already contains a record for the symbol.', () => {
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				type T = int;
				type T = float;
			`).varCheck(), AssignmentError01);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				let FOO: int = 42;
				type FOO = float;
			`).varCheck(), AssignmentError01);
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
				(goal.validator.getSymbolInfo(256n) as SymbolStructureType).typevalue,
				TYPE.INT,
			);
		});
	});


	describe('#build', () => {
		it('always returns `(nop)`.', () => {
			const src: string = `
				type T = int;
				type U = T | float;
			`;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
			const builder = new Builder(src);
			return xjs.Array.forEachAggregated(goal.children, (stmt) => assertEqualBins(stmt.build(builder), builder.module.nop()));
		});
	});
});
