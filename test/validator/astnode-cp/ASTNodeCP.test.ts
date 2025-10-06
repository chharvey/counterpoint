import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	TYPE,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	MutabilityError01,
} from '../../../src/index.ts';
import {
	assertAssignable,
	assertEqualBins,
} from '../../assert-helpers.ts';
import {
	setupScript,
	typeUnit,
} from '../../helpers.ts';



describe('ASTNodeCP', () => {
	describe('ASTNodeIndex', () => {
		describe('#index', () => {
			it('returns the cooked value of the integer token.', () => {
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



	describe('ASTNodeStatementExpression', () => {
		describe('#build', () => {
			it('returns `(nop)` for empty statement expression.', () => {
				const stmt: AST.ASTNodeStatementExpression = AST.ASTNodeStatementExpression.fromSource(';');
				return assertEqualBins(stmt.build(), stmt.builder.module.nop());
			});
			it('returns `(nop)` for nonempty foldable statement expression.', () => {
				const stmt: AST.ASTNodeStatementExpression = AST.ASTNodeStatementExpression.fromSource('42 + 420;');
				return assertEqualBins(stmt.build(), stmt.builder.module.nop());
			});
			it('returns `(drop)` for nonempty non-foldable statement expression.', () => {
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



	describe('ASTNodeAssignment', () => {
		describe('#varCheck', () => {
			it('throws if the variable is not unfixed.', () => {
				AST.ASTNodeGoal.fromSource(`{
					let var i: int = 42;
					i = 43;
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let i: int = 42;
					i = 43;
				}`).varCheck(), AssignmentErrorReassignment);
			});
			it('always throws for type alias reassignment.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = 42;
					T = 43;
				}`).varCheck(), ReferenceErrorKind);
			});
		});


		describe('#typeCheck', () => {
			context('for variable reassignment.', () => {
				it('throws when variable assignee type is not supertype.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
						let var i: int = 42;
						i = 4.3;
					}`);
					goal.varCheck();
					assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
				it('allows reassignment when uninitialized.', () => {
					assert.partialDeepStrictEqual(setupScript(`{
						let var x?: int;
						x = 42;
					}`, null, {build: false}).goal.block!.validator.getSymbolInfo(0x100n), {
						unfixed:       true,
						uninitialized: true,
						type:          TYPE.INT,
						value:         null,
					});
				});
				it('does not allow reassignment of `null` when uninitialized.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
						let var x?: int;
						x = null;
					}`);
					goal.varCheck();
					assert.partialDeepStrictEqual(goal.block!.validator.getSymbolInfo(0x100n), {
						unfixed:       true,
						uninitialized: true,
					});
					return assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
			});

			context('for property reassignment.', () => {
				it('allows assignment directly on objects.', () => {
					setupScript(`{
						List.<int>([42]).[0]                 = 42;
						Dict.<int>([i= 42]).[@i]             = 42;
						Set.<int>([42]).[43]                 = false;
						Map.<bool, int>([[true, 42]]).[true] = 42;
					}`, null, {build: false}); // assert does not throw
				});
				it('throws when property assignee type is not supertype.', () => {
					[
						`{
							let l: mut int[] = List.<int>([42]);
							l.[0] = 4.2;
						}`,
						`{
							let d: mut [:int] = Dict.<int>([i= 42]);
							d.[@i] = 4.2;
						}`,
						`{
							let s: mut int{} = Set.<int>([42]);
							s.[42] = 4.2;
						}`,
						`{
							let m: mut {bool -> int} = Map.<bool, int>([[true, 42]]);
							m.[true] = 4.2;
						}`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
					});
				});
				it('throws when Set/Map accessor expression is not a valid type.', () => {
					xjs.Array.forEachAggregated([`{
						let s: mut int{} = Set.<int>([42]);
						s.[4.3] = true;
					}`, `{
						let m: mut {bool -> int} = Map.<bool, int>([[true, 42]]);
						m.["true"] = 43;
					}`], (src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotNarrow);
					});
				});
				it('throws when assignee’s base type is not mutable.', () => {
					[
						`{
							let t: [int] = [42];
							t.0 = 43;
						}`,
						`{
							let r: [i: int] = [i= 42];
							r.i = 43;
						}`,
						`{
							let l: int[] = List.<int>([42]);
							l.[0] = 43;
						}`,
						`{
							let d: [:int] = Dict.<int>([i= 42]);
							d.[@i] = 43;
						}`,
						`{
							let s: int{} = Set.<int>([42]);
							s.[43] = true;
						}`,
						`{
							let m: {bool -> int} = Map.<bool, int>([[true, 42]]);
							m.[true] = 43;
						}`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), MutabilityError01);
					});
				});
			});
		});


		describe('#build', () => {
			it('always returns `(local.set)`.', () => {
				const {stmts, mod} = setupScript(`{
					let var y: float = 4.2;
					y = y * 10.0;
				}`);
				return assertEqualBins(
					stmts[1].build(),
					mod.local.set(0, (stmts[1] as AST.ASTNodeAssignment).assigned.build()),
				);
			});
			it('allows switching between union members.', () => {
				const {stmts, mod} = setupScript(`{
					let var x: float | int = 4.2;
					let var y: int | float = 4.2;
					x = 8.4;
					x = 16;
					x = x;
					x = y;
				}`);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					stmts.slice(2).map((stmt) => mod.local.set(0, (stmt as AST.ASTNodeAssignment).assigned.build())),
				);
			});
		});
	});



	describe('ASTNodeGoal', () => {
		describe('#varCheck', () => {
			it('aggregates multiple errors.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					a + b || c * d;
					let y: V & W | X & Y = null;
					let x: int = 42;
					let x: int = 420;
					x = 4200;
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


		describe('#typeCheck', () => {
			it('aggregates multiple errors.', () => {
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
							{cons: TypeErrorNotAssignable,    message: `Expression of type \`${ typeUnit(4.2) }\` is not assignable to type \`${ TYPE.INT }\`.`},
						],
					});
					return true;
				});
			});
		});


		describe('#build', () => {
			it('always returns `(nop)`.', () => {
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
