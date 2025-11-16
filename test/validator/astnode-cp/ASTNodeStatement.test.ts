import * as assert from 'assert';
import {
	type Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	TYPE,
	AssignmentErrorDuplicateDeclaration,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';



describe('ASTNodeStatement', () => {
	describe('ASTNodeStatementIteration', () => {
		describe('#varCheck', () => {
			it('adds a SymbolSchema to the symbol table with a preset `type` value of `anything` and a preset null `value` value.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					for it: float of [1.1, 2.2, 3.3] do {
						42;
					};
				}`);
				const validator: Validator = (goal.block!.children[0] as AST.ASTNodeStatementIteration).block.validator;
				assert.ok(!validator.hasSymbol(0x100n));
				goal.varCheck();
				assert.ok(validator.hasSymbol(0x100n));
				const info_it: SymbolSchema | null = validator.getSymbolInfo(0x100n);
				assert_instanceof(info_it, SymbolSchemaVar);
				return assert.partialDeepStrictEqual(info_it, {
					isUnfixed:       false,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
					value:           null,
				});
			});
			it('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					for _: float of [1.1, 2.2, 3.3] do {
						42;
					};
				}`);
				const validator: Validator = (goal.block!.children[0] as AST.ASTNodeStatementIteration).block.validator;
				assert.ok(!validator.hasSymbol(0x100n));
				goal.varCheck();
				return assert.ok(!validator.hasSymbol(0x100n));
			});
			it('allows duplicate declaration of iteration variable.', () => {
				AST.ASTNodeGoal.fromSource(`{
					for it: float of [1.1, 2.2, 3.3] do {
						42;
					};
					for it: float of [1.1, 2.2, 3.3] do {
						42;
					};
				}`).varCheck(); // assert does not throw
			});
			it('allows duplicate declaration in nested scopes (not technically shadowing).', () => {
				AST.ASTNodeGoal.fromSource(`{
					for it: int of [11, 22, 33] do {
						42;
					};
					if true then {
						for it: float of [1.1, 2.2, 3.3] do {
							42;
						};
					};
				}`).varCheck(); // assert does not throw
				AST.ASTNodeGoal.fromSource(`{
					for it: int of [11, 22, 33] do {
						42;
					};
					while false do {
						for it: float of [1.1, 2.2, 3.3] do {
							42;
						};
					};
				}`).varCheck(); // assert does not throw
				AST.ASTNodeGoal.fromSource(`{
					for it: int of [11, 22, 33] do {
						42;
					};
					for b: bool of [false, true] do {
						for it: float of [1.1, 2.2, 3.3] do {
							42;
						};
					};
				}`).varCheck(); // assert does not throw
			});
			it('throws if the same identifier was declared in an outer scope (shadowing).', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let i: int = 42;
					for i: bool of [false, true] do {
						null;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type FOO = float;
					for FOO: bool of [false, true] do {
						null;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: float of [1.1, 2.2, 3.3] do {
						for it: bool of [false, true] do {
							null;
						};
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
		});
	});
});
