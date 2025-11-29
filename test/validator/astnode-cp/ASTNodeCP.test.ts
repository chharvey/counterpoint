import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	drop_then,
	BinVect,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorInvalidOperation,
	TypeErrorNotAssignable,
} from '../../../src/index.ts';
import {
	assertAssignable,
	assertEqualBins,
} from '../../assert-helpers.ts';
import {setupScript} from '../../helpers.ts';
import {extract_lines} from '../../utils.ts';



test.suite('ASTNodeCP', () => {
	test.suite('ASTNodeIndex', () => {
		test.suite('#index', () => {
			test.test('returns the cooked value of the integer token.', () => {
				[0n, 1n, 2n, 4n, 8n, 16n].forEach((index) => {
					const type_accessor: AST.ASTNodeIndex | AST.ASTNodeKey = AST.ASTNodeTypeAccess.fromSource(`MyTuple.${ index }`).accessor;
					assert_instanceof(type_accessor, AST.ASTNodeIndex);
					assert.strictEqual(type_accessor.index, index);

					const expr_accessor: AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression = AST.ASTNodeAccess.fromSource(`my_tuple.${ index }`).accessor;
					assert_instanceof(expr_accessor, AST.ASTNodeIndex);
					assert.strictEqual(expr_accessor.index, index);
				});
			});
		});
	});



	test.suite('ASTNodeStatementExpression', () => {
		test.suite('#build', () => {
			test.test('returns `(nop)` for empty statement expression.', () => {
				const stmt: AST.ASTNodeStatementExpression = AST.ASTNodeStatementExpression.fromSource(';');
				return assertEqualBins(stmt.build(), stmt.builder.module.nop());
			});
			test.test('returns `(nop)` for nonempty foldable statement expression.', () => {
				const stmt: AST.ASTNodeStatementExpression = AST.ASTNodeStatementExpression.fromSource('42 + 420;');
				return assertEqualBins(stmt.build(), stmt.builder.module.nop());
			});
			test.test('returns `(drop)` for nonempty non-foldable statement expression.', () => {
				const {stmts, mod} = setupScript(`{
					let var x: int = 42;
					x * 10;
				}`);
				assert_instanceof(stmts[1], AST.ASTNodeStatementExpression);
				assert.ok(stmts[1].expr);
				return assertEqualBins(
					stmts[1].build(),
					mod.drop(stmts[1].expr.build()),
				);
			});
		});
	});



	test.suite('ASTNodeStatementConditional', () => {
		test.suite('#typeCheck', () => {
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
						if     ${ decl_set === NON_BOOLS ? '!!' : '' }cond then { "consequent"; } else { "alternative"; };
						unless ${ decl_set === NON_BOOLS ? '!!' : '' }cond then { "consequent"; };
					}`, null, {build: false}); // assert does not throw
				}));
			});
			test.test('throws when condition is not subtype of Boolean.', () => {
				xjs.Array.forEachAggregated(NON_BOOLS, (decl) => {
					const {stmts} = setupScript(`{
						${ decl }
						if     cond then { "consequent"; } else { "alternative"; };
						unless cond then { "consequent"; };
					}`, null, {typeCheck: false});
					stmts[0].typeCheck(); // assert does not throw
					return xjs.Array.forEachAggregated(stmts.slice(1), (stmt) => assert.throws(() => stmt.typeCheck(), TypeErrorNotAssignable));
				});
			});
		});


		test.suite('#build', () => {
			test.test('produces `(nop)` for alternative if there is none.', () => {
				const {stmts, mod} = setupScript(`{
					let var cond: bool = false;
					if cond then {
						42;
					};
				}`);
				const stmt = stmts[1] as AST.ASTNodeStatementConditional;
				return assertEqualBins(stmt.build(), mod.if(
					new BinVect(mod, stmt.condition.build()).isSpecial(true),
					stmt.consequent.build(),
					mod.nop(),
				));
			});
			test.test('produces a simple block if the condition is definitely truthy/falsy.', () => {
				const {stmts, mod} = setupScript(`{
					let var TRUE:  true  = true;
					let var FALSE: false = false;
					if TRUE then {
						42;
					};
					if TRUE then {
						42;
					} else {
						69;
					};
					if FALSE then {
						42;
					};
					if FALSE then {
						42;
					} else {
						69;
					};
				}`);
				return assertEqualBins(stmts.slice(2).map((stmt) => stmt.build()), [
					drop_then(
						mod,
						[(stmts[2] as AST.ASTNodeStatementConditional).condition.build()],
						(stmts[2] as AST.ASTNodeStatementConditional).consequent.build(),
					),
					drop_then(
						mod,
						[(stmts[3] as AST.ASTNodeStatementConditional).condition.build()],
						(stmts[3] as AST.ASTNodeStatementConditional).consequent.build(),
					),
					drop_then(
						mod,
						[(stmts[4] as AST.ASTNodeStatementConditional).condition.build()],
						mod.nop(),
					),
					drop_then(
						mod,
						[(stmts[5] as AST.ASTNodeStatementConditional).condition.build()],
						(stmts[5] as AST.ASTNodeStatementConditional).alternative!.build(),
					),
				]);
			});
			test.test('negates the condition for `unless` statements.', () => {
				const {stmts, mod} = setupScript(`{
					let var cond: bool = false;
					unless cond then {
						42;
					};
				}`);
				const stmt = stmts[1] as AST.ASTNodeStatementConditional;
				return assertEqualBins(stmt.build(), mod.if(
					new BinVect(mod, mod.call('vnot', [stmt.condition.build()], binaryen.v128)).isSpecial(true),
					stmt.consequent.build(),
					mod.nop(),
				));
			});
			test.test('nested if–else.', () => {
				const {stmts, mod} = setupScript(`{
					let var cond1: bool = false;
					let var cond2: bool = true;
					if cond1 then {
						42;
					} else if cond2 then {
						4.2;
					} else {
						null;
					};
				}`);
				const stmt1 = stmts[2] as AST.ASTNodeStatementConditional;
				const stmt2 = stmt1.alternative as AST.ASTNodeStatementConditional;
				assertEqualBins(stmt1.build(), mod.if(
					new BinVect(mod, stmt1.condition.build()).isSpecial(true),
					stmt1.consequent.build(),
					stmt2.build(),
				));
				assertEqualBins(stmt2.build(), mod.if(
					new BinVect(mod, stmt2.condition.build()).isSpecial(true),
					stmt2.consequent.build(),
					stmt2.alternative!.build(),
				));
			});
		});
	});



	test.suite('ASTNodeBlock', () => {
		test.suite('#build', () => {
			test.test('always retuns `(block)`.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let var x: int = 42;
					x;
				}`);
				assertEqualBins(goal.block!.build(), mod.block(null, stmts.map((stmt) => stmt.build())));
			});
			test.test('nesting scopes.', () => {
				setupScript(`{
					let var x: int = 42;
					x;
					if true then {
						x;
						let var y: float = 4.2;
						y;
					};
					x;
				}`); // assert does not throw
			});
		});
	});



	test.suite('ASTNodeGoal', () => {
		test.suite('#varCheck', () => {
			test.test('aggregates multiple errors.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					a + b || c * d;
					let y: V & W | X & Y = null;
					let x: int = 42;
					let x: int = 420;
					set x = 4200;
					type T = int;
					type T = float;
					let z: x = null;
					let z: int = T;
				}`).varCheck(), (err) => {
					assert_instanceof(err, AggregateError);
					assertAssignable(err, {
						cons:   AggregateError,
						errors: [
							{
								cons:   AggregateError,
								errors: [
									{
										cons:   AggregateError,
										errors: [
											{cons: ReferenceErrorUndeclared, message: '`a` is never declared.'},
											{cons: ReferenceErrorUndeclared, message: '`b` is never declared.'},
										],
									},
									{
										cons:   AggregateError,
										errors: [
											{cons: ReferenceErrorUndeclared, message: '`c` is never declared.'},
											{cons: ReferenceErrorUndeclared, message: '`d` is never declared.'},
										],
									},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{
										cons:   AggregateError,
										errors: [
											{cons: ReferenceErrorUndeclared, message: '`V` is never declared.'},
											{cons: ReferenceErrorUndeclared, message: '`W` is never declared.'},
										],
									},
									{
										cons:   AggregateError,
										errors: [
											{cons: ReferenceErrorUndeclared, message: '`X` is never declared.'},
											{cons: ReferenceErrorUndeclared, message: '`Y` is never declared.'},
										],
									},
								],
							},
							{cons: AssignmentErrorDuplicateDeclaration, message: 'Duplicate declaration of `x`.'},
							{cons: AssignmentErrorReassignment,         message: 'Reassignment of fixed variable `x`.'},
							{cons: AssignmentErrorDuplicateDeclaration, message: 'Duplicate declaration of `T`.'},
							{cons: ReferenceErrorKind,                  message: '`x` refers to a value, but is used as a type.'},
							{cons: ReferenceErrorKind,                  message: '`T` refers to a type, but is used as a value.'},
						],
					});
					return true;
				});
			});
		});


		test.suite('#typeCheck', () => {
			test.test('aggregates multiple errors.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					let a: null = null;
					let b: null = null;
					let c: null = null;
					let d: null = null;
					a * b + c * d;
					let e: null = null;
					let f: null = null;
					let g: null = null;
					let h: null = null;
					e * f + g * h;
					if null then 42 else 4.2;
					let x: int = 4.2;
				}`);
				goal.varCheck();
				assert.throws(() => goal.typeCheck(), (err) => {
					assert_instanceof(err, AggregateError);
					assertAssignable(err, {
						cons:   AggregateError,
						errors: [
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `a * b` at line 6 col 6.'}, // TODO remove line&col numbers from message
									{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `c * d` at line 6 col 14.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `e * f` at line 11 col 6.'},
									{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `g * h` at line 11 col 14.'},
								],
							},
							{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `if null then 42 else 4.2` at line 12 col 6.'},
							{cons: TypeErrorNotAssignable,    message: 'Expression `4.2` is not assignable to type `int`.'},
						],
					});
					return true;
				});
			});
		});


		test.suite('#build', () => {
			test.test('always returns `(nop)`.', () => {
				// empty
				const empty: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource('');
				empty.varCheck();
				empty.typeCheck();
				assertEqualBins(empty.build(), empty.builder.module.nop());

				// scripts
				xjs.Array.forEachAggregated([
					'{;}',
					`{
						42;
					}`,
					`{
						let x: int = 42;
						x;
					}`,
				], (src) => {
					const {goal, mod} = setupScript(src, null, {build: false});
					return assertEqualBins(goal.build(), mod.nop());
				});

				// modules
				return;
			});
		});
	});
});
