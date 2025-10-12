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



describe('ASTNodeDeclarationType', () => {
	describe('#varCheck', () => {
		it('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
				type nominal U = str;
			`);
			assert.ok(!goal.validator.hasSymbol(0x100n));
			assert.ok(!goal.validator.hasSymbol(0x101n));
			goal.varCheck();
			assert.ok(goal.validator.hasSymbol(0x100n));
			assert.ok(goal.validator.hasSymbol(0x101n));
			const info_t: SymbolSchema | null = goal.validator.getSymbolInfo(0x100n);
			const info_u: SymbolSchema | null = goal.validator.getSymbolInfo(0x101n);
			assert_instanceof(info_t, SymbolSchemaType);
			assert_instanceof(info_u, SymbolSchemaType);
			assert.partialDeepStrictEqual(info_t, {
				isNominal: false,
				typevalue: TYPE.ANYTHING,
			});
			assert.partialDeepStrictEqual(info_u, {
				isNominal: true,
				typevalue: TYPE.ANYTHING,
			});
		});

		it('for blank identifiers, does not add to symbol table.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type _ = str;
			`);
			assert.ok(!goal.validator.hasSymbol(256n));
			goal.varCheck();
			return assert.ok(!goal.validator.hasSymbol(256n));
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

		it('allows duplicate declaration of blank identifier.', () => {
			AST.ASTNodeGoal.fromSource(`
				type _ = int | float;
				type _ = [str, bool];
			`).varCheck(); // assert does not throw
		});
	});


	describe('#typeCheck', () => {
		it('sets `SymbolSchemaType#typevalue`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
				type nominal U = str;
			`);
			goal.varCheck();
			goal.typeCheck();
			assert.strictEqual(
				(goal.validator.getSymbolInfo(0x100n) as SymbolSchemaType).typevalue,
				TYPE.INT,
			);
			return assert.deepStrictEqual(
				(goal.validator.getSymbolInfo(0x101n) as SymbolSchemaType).typevalue,
				new TYPE.Nominal(0x101n, TYPE.STR),
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
