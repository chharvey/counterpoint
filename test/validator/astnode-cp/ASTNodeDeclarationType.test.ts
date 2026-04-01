import * as assert from 'node:assert';
import {
	assert_instanceof,
	AST,
	type SymbolSchema,
	SymbolSchemaType,
	TYPE,
	AssignmentErrorDuplicateDeclaration,
} from '../../../src/index.ts';



describe('ASTNodeDeclarationType', () => {
	describe('#varCheck', () => {
		it('adds a SymbolSchema to the symbol table with a preset `type` value of `unknown`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
			`);
			assert.ok(!goal.validator.hasSymbol(0x100n));
			goal.varCheck();
			assert.ok(goal.validator.hasSymbol(0x100n));
			const info: SymbolSchema | null = goal.validator.getSymbolInfo(0x100n);
			assert_instanceof(info, SymbolSchemaType);
			assert.strictEqual(info.typevalue, TYPE.UNKNOWN);
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
				val FOO: int = 42;
				type FOO = float;
			`).varCheck(), AssignmentErrorDuplicateDeclaration);
		});

		it('allows duplicate declaration of blank identifier.', () => {
			AST.ASTNodeGoal.fromSource(`
				type _ = int | float;
				type _ = (str, bool);
			`).varCheck(); // assert does not throw
		});
	});


	describe('#typeCheck', () => {
		it('sets `SymbolSchema#value`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				type T = int;
			`);
			goal.varCheck();
			goal.typeCheck();
			return assert.strictEqual(
				(goal.validator.getSymbolInfo(0x100n) as SymbolSchemaType).typevalue,
				TYPE.INT,
			);
		});
	});
});
