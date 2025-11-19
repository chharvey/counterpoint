import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	type Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	TYPE,
	BinVect,
	AssignmentErrorDuplicateDeclaration,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
} from '../../../src/index.js';
import {assertEqualBins} from '../../assert-helpers.ts';
import {setupScript} from '../../helpers.js';
import {extract_lines} from '../../utils.ts';



describe('ASTNodeStatement', () => {
	describe('#typeCheck', () => {
		describe('ASTNodeStatementLoop', () => {
			const NON_BOOLS: readonly string[] = extract_lines`
				let var cond: int         = 42;
				let var cond: int | false = 42;
				let var cond: int | true  = 42;
				let var cond: int | bool  = 42;
			`;
			const BOOLS: readonly string[] = extract_lines`
				let var cond: false = false;
				let var cond: true  = true;
				let var cond: bool  = false;
			`;
			it('passes when condition is subtype of Boolean.', () => {
				xjs.Array.forEachAggregated([BOOLS, NON_BOOLS], (decl_set) => xjs.Array.forEachAggregated(decl_set, (decl) => {
					setupScript(`{
						${ decl }
						while ${ decl_set === NON_BOOLS ? '!!' : '' }cond do { "consequent"; };
						until ${ decl_set === NON_BOOLS ? '!!' : '' }cond do { "consequent"; };
					}`, null, {build: false}); // assert does not throw
				}));
			});
			it('throws when condition is not subtype of Boolean.', () => {
				xjs.Array.forEachAggregated(NON_BOOLS, (decl) => {
					const {stmts} = setupScript(`{
						${ decl }
						while cond do { "consequent"; };
						until cond do { "consequent"; };
					}`, null, {typeCheck: false});
					stmts[0].typeCheck(); // assert does not throw
					return xjs.Array.forEachAggregated(stmts.slice(1), (stmt) => assert.throws(() => stmt.typeCheck(), TypeErrorNotAssignable));
				});
			});
		});

		describe('ASTNodeStatementIteration', () => {
			it('passes when iterable is subtype of List and iteration variable is a supertype of List item type.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					str
					"hello" | "to the" | "world"
					anything
				`, (vartype) => {
					setupScript(`{
						for it: ${ vartype } of ["hello", "world"] do {
							let greeting: ${ vartype } = it;
						};
					}`, null, {build: false}); // assert does not throw
				});
			});
			it('throws when iterable is not subtype of List.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					"hello, world"
					("hello", "world")
					(a= "hello", b= "world")
					[a= "hello", b= "world"]
					{"hello", "world"}
					{"a" -> "hello", "b" -> "world"}
				`, (collection) => {
					const {stmts} = setupScript(`{
						for it: str of ${ collection } do {
							;
						};
					}`, null, {typeCheck: false});
					return assert.throws(() => stmts[0].typeCheck(), TypeErrorNotAssignable);
				});
			});
			it('throws when iteration variable is not supertype of List item type.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					int
					[str]
					"to the"
					"hello" & "world"
					"hello" | "to the"
					"to the" | "world"
					nothing
				`, (vartype) => {
					const {stmts} = setupScript(`{
						for it: ${ vartype } of ["hello", "world"] do {
							;
						};
					}`, null, {typeCheck: false});
					return assert.throws(() => stmts[0].typeCheck(), TypeErrorNotNarrow);
				});
			});
			it('throws when block type-checking fails.', () => {
				const {stmts} = setupScript(`{
					for it: str of ["hello", "world"] do {
						42 + it; %> TypeErrorInvalidOperation
					};
				}`, null, {typeCheck: false});
				assert.throws(() => (stmts[0] as AST.ASTNodeStatementIteration).block.children[0].typeCheck(), TypeErrorInvalidOperation);
				return assert.throws(() => stmts[0].typeCheck(), TypeErrorInvalidOperation);
			});
		});
	});


	describe('#build', () => {
		describe('ASTNodeStatementLoop', () => {
			it('always retuns `(block (loop (block)))`.', () => {
				const {stmts, mod} = setupScript(`{
					let var cond: bool = false;
					while cond do {
						42;
						4.2;
					};
				}`);
				const stmt = stmts[1] as AST.ASTNodeStatementLoop;
				return assertEqualBins(stmt.build(), mod.block('exit', [mod.loop('repeat', mod.block(null, [
					mod.br_if('exit', new BinVect(mod, stmt.condition.build()).isSpecial(false)),
					stmt.block.build(),
					mod.br('repeat'),
				]))]));
			});
			it('skips condition check if condition is definitely truthy/falsy.', () => {
				const {stmts, mod} = setupScript(`{
					let var TRUE:  true  = true;
					let var FALSE: false = false;
					while TRUE do {
						42;
					};
					%% FIXME: provide dynamic labels
					do {
						42;
					} while TRUE;
					while FALSE do {
						42;
					};
					do {
						42;
					} while FALSE;
					%%
				}`);
				return assertEqualBins(stmts.slice(2).map((stmt) => stmt.build()), [
					mod.block('exit', [mod.loop('repeat', mod.block(null, [
						mod.drop((stmts[2] as AST.ASTNodeStatementLoop).condition.build()),
						(stmts[2] as AST.ASTNodeStatementLoop).block.build(),
						mod.br('repeat'),
					]))]),
					/* FIXME: provide dynamic labels
					mod.block('exit', [mod.loop('repeat', mod.block(null, [
						(stmts[3] as AST.ASTNodeStatementLoop).block.build(),
						mod.drop((stmts[3] as AST.ASTNodeStatementLoop).condition.build()),
						mod.br('repeat'),
					]))]),
					mod.block('exit', [mod.loop('repeat', mod.block(null, [
						mod.drop((stmts[4] as AST.ASTNodeStatementLoop).condition.build()),
						(stmts[4] as AST.ASTNodeStatementLoop).block.build(),
						mod.br('exit'),
					]))]),
					mod.block('exit', [mod.loop('repeat', mod.block(null, [
						(stmts[5] as AST.ASTNodeStatementLoop).block.build(),
						mod.drop((stmts[5] as AST.ASTNodeStatementLoop).condition.build()),
						mod.br('exit'),
					]))]),
					 */
				]);
			});
			it('produces `(nop)` if entire statement is foldable.', () => {
				const {stmts, mod} = setupScript(`{
					let cond: bool = true;
					while cond do {
						42;
					};
				}`);
				return assertEqualBins(stmts[1].build(), mod.nop());
			});
			it('negates the condition for `until` statements.', () => {
				const {stmts, mod} = setupScript(`{
					let var cond: bool = false;
					until cond do {
						42;
					};
				}`);
				const stmt = stmts[1] as AST.ASTNodeStatementLoop;
				return assertEqualBins(stmt.build(), mod.block('exit', [mod.loop('repeat', mod.block(null, [
					mod.br_if('exit', new BinVect(mod, mod.call('vnot', [stmt.condition.build()], binaryen.v128)).isSpecial(false)),
					stmt.block.build(),
					mod.br('repeat'),
				]))]));
			});
		});

		describe('ASTNodeStatementIteration', () => {
			it('produces `(nop)` if entire statement is foldable.', () => {
				const {stmts, mod} = setupScript(`{
					for it: int of [10, 20, 30, 40] do {
						42;
					};
				}`);
				return assertEqualBins(stmts[0].build(), mod.nop());
			});
			it('if not foldable, is not yet supported.', () => {
				const {stmts} = setupScript(`{
					let var i: int = 42;
					for it: int of [10, 20, 30, 40] do {
						set i = it;
					};
				}`, null, {build: false});
				stmts[0].build(); // assert does not throw
				return assert.throws(() => stmts[1].build(), /not yet supported/);
			});
		});
	});


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
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let var x: int = 42;
					if true then {
						for x: bool of [false, true] do {
							null;
						};
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let var x: int = 42;
					while false do {
						for x: bool of [false, true] do {
							null;
						};
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let var x: int = 42;
					for it: float of [1.1, 2.2, 3.3] do {
						for x: bool of [false, true] do {
							null;
						};
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
		});
	});
});
