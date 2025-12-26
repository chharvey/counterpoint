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



test.suite('AstNode', () => {
	test.suite('Index', () => {
		test.suite('#index', () => {
			test.test('returns the cooked value of the integer token.', () => {
				[0n, 1n, 2n, 4n, 8n, 16n].forEach((index) => {
					const type_accessor: AST.Index | AST.Key = AST.TypeAccess.fromSource(`MyTuple.${ index }`).accessor;
					assert_instanceof(type_accessor, AST.Index);
					assert.strictEqual(type_accessor.index, index);

					const expr_accessor: AST.Index | AST.Key | AST.Expression = AST.Access.fromSource(`my_tuple.${ index }`).accessor;
					assert_instanceof(expr_accessor, AST.Index);
					assert.strictEqual(expr_accessor.index, index);
				});
			});
		});
	});



	test.suite('StatementExpression', () => {
		test.suite('#build', () => {
			test.test('returns `(nop)` for empty statement expression.', () => {
				const stmt: AST.StatementExpression = AST.StatementExpression.fromSource(';');
				return assertEqualBins(stmt.build(), stmt.builder.module.nop());
			});
			test.test('returns `(nop)` for nonempty foldable statement expression.', () => {
				const stmt: AST.StatementExpression = AST.StatementExpression.fromSource('42 + 420;');
				return assertEqualBins(stmt.build(), stmt.builder.module.nop());
			});
			test.test('returns `(drop)` for nonempty non-foldable statement expression.', () => {
				const {stmts, mod} = setupScript(`{
					val mut x: int = 42;
					x * 10;
				}`);
				assert_instanceof(stmts[1], AST.StatementExpression);
				assert.ok(stmts[1].expr);
				return assertEqualBins(
					stmts[1].build(),
					mod.drop(stmts[1].expr.build()),
				);
			});
		});
	});



	test.suite('StatementConditional', () => {
		test.suite('#typeCheck', () => {
			const NON_BOOLS: readonly string[] = extract_lines`
				val mut cond: int         = 42;
				val mut cond: int | false = 42;
				val mut cond: int | true  = 42;
				val mut cond: int | bool  = 42;
			`;
			const BOOLS: readonly string[] = extract_lines`
				val mut cond: false = false;
				val mut cond: true  = true;
				val mut cond: bool  = false;
			`;
			test.test('passes when condition is subtype of Boolean.', () => {
				xjs.Array.forEachAggregated([BOOLS, NON_BOOLS], (decl_set) => xjs.Array.forEachAggregated(decl_set, (decl) => {
					setupScript(`{
						${ decl }
						if     ${ decl_set === NON_BOOLS ? '!!' : '' }cond then { "consequent"; } else { "alternative"; };
						unless ${ decl_set === NON_BOOLS ? '!!' : '' }cond then { "consequent"; };
					}`, {build: false}); // assert does not throw
				}));
			});
			test.test('throws when condition is not subtype of Boolean.', () => {
				xjs.Array.forEachAggregated(NON_BOOLS, (decl) => {
					const {stmts} = setupScript(`{
						${ decl }
						if     cond then { "consequent"; } else { "alternative"; };
						unless cond then { "consequent"; };
					}`, {typeCheck: false});
					stmts[0].typeCheck(); // assert does not throw
					return xjs.Array.forEachAggregated(stmts.slice(1), (stmt) => assert.throws(() => stmt.typeCheck(), TypeErrorNotAssignable));
				});
			});
		});


		test.suite('#build', () => {
			test.test('produces `(nop)` for alternative if there is none.', () => {
				const {stmts, mod} = setupScript(`{
					val mut cond: bool = false;
					if cond then {
						42;
					};
				}`);
				const stmt = stmts[1] as AST.StatementConditional;
				return assertEqualBins(stmt.build(), mod.if(
					new BinVect(mod, stmt.condition.build()).isSpecial(true),
					stmt.consequent.build(),
					mod.nop(),
				));
			});
			test.test('produces a simple block if the condition is definitely truthy/falsy.', () => {
				const {stmts, mod} = setupScript(`{
					val mut TRUE:  true  = true;
					val mut FALSE: false = false;
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
						[(stmts[2] as AST.StatementConditional).condition.build()],
						(stmts[2] as AST.StatementConditional).consequent.build(),
					),
					drop_then(
						mod,
						[(stmts[3] as AST.StatementConditional).condition.build()],
						(stmts[3] as AST.StatementConditional).consequent.build(),
					),
					drop_then(
						mod,
						[(stmts[4] as AST.StatementConditional).condition.build()],
						mod.nop(),
					),
					drop_then(
						mod,
						[(stmts[5] as AST.StatementConditional).condition.build()],
						(stmts[5] as AST.StatementConditional).alternative!.build(),
					),
				]);
			});
			test.test('negates the condition for `unless` statements.', () => {
				const {stmts, mod} = setupScript(`{
					val mut cond: bool = false;
					unless cond then {
						42;
					};
				}`);
				const stmt = stmts[1] as AST.StatementConditional;
				return assertEqualBins(stmt.build(), mod.if(
					new BinVect(mod, mod.call('vnot', [stmt.condition.build()], binaryen.v128)).isSpecial(true),
					stmt.consequent.build(),
					mod.nop(),
				));
			});
			test.test('nested if–else.', () => {
				const {stmts, mod} = setupScript(`{
					val mut cond1: bool = false;
					val mut cond2: bool = true;
					if cond1 then {
						42;
					} else if cond2 then {
						4.2;
					} else {
						null;
					};
				}`);
				const stmt1 = stmts[2] as AST.StatementConditional;
				const stmt2 = stmt1.alternative as AST.StatementConditional;
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



	test.suite('Block', () => {
		test.suite('#build', () => {
			test.test('always retuns `(block)`.', () => {
				const {goal, stmts, mod} = setupScript(`{
					val mut x: int = 42;
					x;
				}`);
				assertEqualBins(goal.block!.build(), mod.block(null, stmts.map((stmt) => stmt.build())));
			});
			test.test('nesting scopes.', () => {
				setupScript(`{
					val mut x: int = 42;
					x;
					if true then {
						x;
						val mut y: float = 4.2;
						y;
					};
					x;
				}`); // assert does not throw
			});
		});
	});



	test.suite('Goal', () => {
		test.suite('#varCheck', () => {
			test.test('aggregates multiple errors.', () => {
				assert.throws(() => AST.Goal.fromSource(`{
					a + b || c * d;
					val y: V & W | X & Y = null;
					val x: int = 42;
					val x: int = 420;
					set x = 4200;
					type T = int;
					type T = float;
					val z: x = null;
					val z: int = T;
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
				const goal: AST.Goal = AST.Goal.fromSource(`{
					val a: null = null;
					val b: null = null;
					val c: null = null;
					val d: null = null;
					a * b + c * d;
					val e: null = null;
					val f: null = null;
					val g: null = null;
					val h: null = null;
					e * f + g * h;
					if null then 42 else 4.2;
					val x: int = 4.2;
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
				const empty: AST.Goal = AST.Goal.fromSource('');
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
						val x: int = 42;
						x;
					}`,
				], (src) => {
					const {goal, mod} = setupScript(src, {build: false});
					return assertEqualBins(goal.build(), mod.nop());
				});

				// modules
				return;
			});
		});
	});
});
