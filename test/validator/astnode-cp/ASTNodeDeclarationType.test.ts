import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	type SymbolSchema,
	SymbolSchemaType,
	TYPE,
	AssignmentErrorDuplicateDeclaration,
} from '../../../src/index.ts';
import {assertEqualBins} from '../../assert-helpers.ts';
import {setupScript} from '../../helpers.ts';



describe('ASTNodeDeclarationType', () => {
	describe('#varCheck', () => {
		it('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
				type T = int;
			}`);
			assert.ok(!goal.block!.validator.hasSymbol(0x100n));
			goal.varCheck();
			assert.ok(goal.block!.validator.hasSymbol(0x100n));
			const info: SymbolSchema | null = goal.block!.validator.getSymbolInfo(0x100n);
			assert_instanceof(info, SymbolSchemaType);
			assert.strictEqual(info.typevalue, TYPE.ANYTHING);
		});

		it('for blank identifiers, does not add to symbol table.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
				type _ = str;
			}`);
			assert.ok(!goal.block!.validator.hasSymbol(256n));
			goal.varCheck();
			return assert.ok(!goal.block!.validator.hasSymbol(256n));
		});

		it('throws if the validator already contains a record for the symbol.', () => {
			assert.throws(() => AST.ASTNodeGoal.fromSource(`{
				type T = int;
				type T = float;
			}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`{
				let FOO: int = 42;
				type FOO = float;
			}`).varCheck(), AssignmentErrorDuplicateDeclaration);
		});

		it('allows duplicate declaration of blank identifier.', () => {
			AST.ASTNodeGoal.fromSource(`{
				type _ = int | float;
				type _ = [str, bool];
			}`).varCheck(); // assert does not throw
		});
	});


	describe('#typeCheck', () => {
		it('sets `SymbolSchemaType#typevalue`.', () => {
			assert.strictEqual(
				(setupScript(`{
					type T = int;
				}`, null, {build: false}).goal.block!.validator.getSymbolInfo(0x100n) as SymbolSchemaType).typevalue,
				TYPE.INT,
			);
		});
	});


	describe('#build', () => {
		it('always returns `(nop)`.', () => {
			const {stmts, mod} = setupScript(`{
				type T = int;
				type U = T | float;
			}`);
			return xjs.Array.forEachAggregated(stmts, (stmt) => assertEqualBins(stmt.build(), mod.nop()));
		});
	});
});
