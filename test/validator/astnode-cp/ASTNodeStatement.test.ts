import * as assert from 'assert';
import * as test from 'node:test';
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



test.suite('ASTNodeStatement', () => {
	test.suite('#typeCheck', () => {
		test.suite('ASTNodeStatementLoop', () => {
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
			test.test('passes when condition is subtype of Boolean.', () => {
				xjs.Array.forEachAggregated([BOOLS, NON_BOOLS], (decl_set) => xjs.Array.forEachAggregated(decl_set, (decl) => {
					setupScript(`{
						${ decl }
						while ${ decl_set === NON_BOOLS ? '!!' : '' }cond do { "consequent"; };
						until ${ decl_set === NON_BOOLS ? '!!' : '' }cond do { "consequent"; };
					}`, null, {build: false}); // assert does not throw
				}));
			});
			test.test('throws when condition is not subtype of Boolean.', () => {
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

		test.suite('ASTNodeStatementIteration', () => {
			test.test('passes when iterable is subtype of List and iteration variable is a supertype of List item type.', () => {
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
			test.test('throws when iterable is not subtype of List.', () => {
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
			test.test('throws when iteration variable is not supertype of List item type.', () => {
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
			test.test('throws when block type-checking fails.', () => {
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


	test.suite('#build', () => {
		test.suite('ASTNodeStatementConditional', () => {
			test.suite('produces `(nop)` for entire statement when …', () => {
				test.test('… condition is foldable and truthy (or falsy for `unless`), and consequent is foldable.', () => {
					const {stmts, mod} = setupScript(`{
						let var value: float = 4.2;
						let truthy_cond: bool = true;
						if truthy_cond then {
							42;
						} else {
							set value = 6.9;
						};
						unless !truthy_cond then {
							42;
						};
					}`);
					return assertEqualBins(
						stmts.slice(2, 4).map((stmt) => (stmt as AST.ASTNodeStatementConditional).build()),
						[mod.nop(), mod.nop()],
					);
				});
				test.test('… condition is foldable and falsy (or truthy for `unless`), and alternative is foldable (or doesn’t exist).', () => {
					const {stmts, mod} = setupScript(`{
						let var value: float = 4.2;
						let falsy_cond: bool = !"hello";
						if falsy_cond then {
							set value = 6.9;
						} else {
							42;
						};
						if falsy_cond then {
							set value = 6.9;
						};
						unless !falsy_cond then {
							set value = 6.9;
						};
					}`);
					return assertEqualBins(
						stmts.slice(2, 5).map((stmt) => (stmt as AST.ASTNodeStatementConditional).build()),
						[mod.nop(), mod.nop(), mod.nop()],
					);
				});
			});
			test.test('if not foldable, retuns `(if)`.', () => {
				const {stmts, mod} = setupScript(`{
					let var unknown_cond: bool = false;
					if unknown_cond then {
						42;
					} else {
						4.2;
					};
				}`);
				const stmt1 = stmts[1] as AST.ASTNodeStatementConditional;
				return assertEqualBins(stmt1.build(), mod.if(
					new BinVect(mod, stmt1.condition.build()).isSpecial(true),
					stmt1.consequent.build(),
					stmt1.alternative!.build(),
				));
			});
		});

		test.suite('ASTNodeStatementLoop', () => {
			function makeLoop(mod: binaryen.Module, label_block: string, label_loop: string, instrs: readonly binaryen.ExpressionRef[], branch_depth: number): binaryen.ExpressionRef {
				return mod.block(label_block, [mod.loop(label_loop, mod.block(null, [...instrs, mod.br([label_loop, label_block][branch_depth])]))]);
			}
			test.test('produces `(nop)` if entire statement is foldable.', () => {
				const {stmts, mod} = setupScript(`{
					let cond: bool = true;
					while cond do {
						42;
					};
				}`);
				return assertEqualBins(stmts[1].build(), mod.nop());
			});
			test.test('if not foldable, retuns `(block (loop (block)))`.', () => {
				const {stmts, mod} = setupScript(`{
					let var cond: bool = false;
					while cond do {
						42;
						4.2;
					};
				}`);
				const stmt = stmts[1] as AST.ASTNodeStatementLoop;
				return assertEqualBins(stmt.build(), makeLoop(mod, 'exit0', 'repeat0', [
					mod.br_if('exit0', new BinVect(mod, stmt.condition.build()).isSpecial(false)),
					stmt.block.build(),
				], 0));
			});
			test.test('skips condition check if condition is definitely truthy/falsy.', () => {
				const {stmts, mod} = setupScript(`{
					let var TRUE:  true  = true;
					let var FALSE: false = false;
					while TRUE do {
						42;
					};
					do {
						42;
					} while TRUE;
					while FALSE do {
						42;
					};
					do {
						42;
					} while FALSE;
				}`);
				return assertEqualBins(stmts.slice(2).map((stmt) => stmt.build()), [
					makeLoop(mod, 'exit0', 'repeat0', [
						mod.drop((stmts[2] as AST.ASTNodeStatementLoop).condition.build()),
						(stmts[2] as AST.ASTNodeStatementLoop).block.build(),
					], 0),
					makeLoop(mod, 'exit1', 'repeat1', [
						(stmts[3] as AST.ASTNodeStatementLoop).block.build(),
						mod.drop((stmts[3] as AST.ASTNodeStatementLoop).condition.build()),
					], 0),
					makeLoop(mod, 'exit2', 'repeat2', [
						mod.drop((stmts[4] as AST.ASTNodeStatementLoop).condition.build()),
						(stmts[4] as AST.ASTNodeStatementLoop).block.build(),
					], 1),
					makeLoop(mod, 'exit3', 'repeat3', [
						(stmts[5] as AST.ASTNodeStatementLoop).block.build(),
						mod.drop((stmts[5] as AST.ASTNodeStatementLoop).condition.build()),
					], 1),
				]);
			});
			test.test('negates the condition for `until` statements.', () => {
				const {stmts, mod} = setupScript(`{
					let var cond: bool = false;
					until cond do {
						42;
					};
				}`);
				const stmt = stmts[1] as AST.ASTNodeStatementLoop;
				return assertEqualBins(stmt.build(), makeLoop(mod, 'exit0', 'repeat0', [
					mod.br_if('exit0', new BinVect(mod, mod.call('vnot', [stmt.condition.build()], binaryen.v128)).isSpecial(false)),
					stmt.block.build(),
				], 0));
			});
		});

		test.suite('ASTNodeStatementIteration', () => {
			test.test('produces `(nop)` if entire statement is foldable.', () => {
				const {stmts, mod} = setupScript(`{
					for it: int of [10, 20, 30, 40] do {
						42;
					};
				}`);
				return assertEqualBins(stmts[0].build(), mod.nop());
			});
			test.test('if not foldable, is not yet supported.', () => {
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

		test.suite('ASTNodeStatementBreak', () => {
			test.test('produces (br).', () => {
				const {stmts, mod} = setupScript(`{
					while true do {
						break;
						continue;
					};
				}`);
				const while_block: AST.ASTNodeBlock = (stmts[0] as AST.ASTNodeStatementLoop).block;
				return assertEqualBins([
					while_block.children[0].build(),
					while_block.children[1].build(),
				], [
					mod.br('exit0'),
					mod.br('repeat0'),
				]);
			});
			test.test('nested loops.', () => {
				const {stmts, mod} = setupScript(`{
					while true do {
						break;
						if true then {
							while true do {
								continue;
							};
						};
					};
				}`);
				const outer_block: AST.ASTNodeBlock = (stmts[0] as AST.ASTNodeStatementLoop).block;
				const inner_block: AST.ASTNodeBlock = ((outer_block.children[1] as AST.ASTNodeStatementConditional).consequent.children[0] as AST.ASTNodeStatementLoop).block;
				return assertEqualBins([
					outer_block.children[0].build(),
					inner_block.children[0].build(),
				], [
					mod.br('exit0'),
					mod.br('repeat1'),
				]);
			});
			test.test('throws if the parent block has not been built yet.', () => {
				const while_block: AST.ASTNodeBlock = (setupScript(`{
					while true do {
						break;
						continue;
					};
				}`, null, {build: false}).stmts[0] as AST.ASTNodeStatementLoop).block;
				assert.throws(() => while_block.children[0].build(), /Expected builder to store/);
				assert.throws(() => while_block.children[1].build(), /Expected builder to store/);
			});
		});
	});


	test.suite('ASTNodeStatementIteration', () => {
		test.suite('#varCheck', () => {
			test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything` and a preset null `value` value.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					for it: float of [1.1, 2.2, 3.3] do {
						42;
					};
				}`);
				const validator: Validator = (goal.block!.children[0] as AST.ASTNodeStatementIteration).block.validator;
				assert.ok(!validator.hasSymbol(0x100n));
				goal.varCheck();
				assert.ok(validator.hasSymbol(0x100n));
				const info_it: SymbolSchema | undefined = validator.getSymbol(0x100n);
				assert_instanceof(info_it, SymbolSchemaVar);
				return assert.partialDeepStrictEqual(info_it, {
					isUnfixed:       false,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
					value:           null,
				});
			});
			test.test('for blank identifiers, does not add to symbol table.', () => {
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
			test.test('allows duplicate declaration of iteration variable.', () => {
				AST.ASTNodeGoal.fromSource(`{
					for it: float of [1.1, 2.2, 3.3] do {
						42;
					};
					for it: float of [1.1, 2.2, 3.3] do {
						42;
					};
				}`).varCheck(); // assert does not throw
			});
			test.test('allows duplicate declaration in nested scopes (not technically shadowing).', () => {
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
			test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
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
