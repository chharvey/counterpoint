import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	AST,
	TYPE,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorInvalidOperation,
	TypeErrorNotAssignable,
	MutabilityError01,
} from '../../../src/index.ts';
import {assert_instanceof} from '../../../src/lib/index.ts';
import {
	assertAssignable,
	assertEqualBins,
} from '../../assert-helpers.ts';
import {typeUnit} from '../../helpers.ts';



describe('ASTNodeCP', () => {
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int = 42;
					x * 10;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const stmt: AST.ASTNodeStatement = goal.children[1];
				assert_instanceof(stmt, AST.ASTNodeStatementExpression);
				assert.ok(stmt.expr);
				return assertEqualBins(
					stmt.build(),
					goal.builder.module.drop(stmt.expr.build()),
				);
			});
		});
	});



	describe('ASTNodeAssignment', () => {
		describe('#varCheck', () => {
			it('throws if the variable is not unfixed.', () => {
				AST.ASTNodeGoal.fromSource(`
					val mut i: int = 42;
					i = 43;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					val i: int = 42;
					i = 43;
				`).varCheck(), AssignmentErrorReassignment);
			});
			it('always throws for type alias reassignment.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type T = 42;
					T = 43;
				`).varCheck(), ReferenceErrorKind);
			});
		});


		describe('#typeCheck', () => {
			context('for variable reassignment.', () => {
				it('throws when variable assignee type is not supertype.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						val mut i: int = 42;
						i = 4.3;
					`);
					goal.varCheck();
					assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
			});

			context('for property reassignment.', () => {
				it('allows assignment directly on objects.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						List.<int>([42]).0                   = 42;
						Dict.<int>([i= 42]).i                = 42;
						Set.<int>([42]).[43]                 = false;
						Map.<bool, int>([[true, 42]]).[true] = 42;
					`);
					goal.varCheck();
					return goal.typeCheck(); // assert does not throw
				});
				it('throws when property assignee type is not supertype.', () => {
					[
						`
							val l: mut int[] = List.<int>([42]);
							l.0 = 4.2;
						`,
						`
							val d: mut [:int] = Dict.<int>([i= 42]);
							d.i = 4.2;
						`,
						`
							val s: mut int{} = Set.<int>([42]);
							s.[42] = 4.2;
						`,
						`
							val m: mut {bool -> int} = Map.<bool, int>([[true, 42]]);
							m.[true] = 4.2;
						`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
					});
				});
				it('throws when assignee’s base type is not mutable.', () => {
					[
						`
							val t: [int] = [42];
							t.0 = 43;
						`,
						`
							val r: [i: int] = [i= 42];
							r.i = 43;
						`,
						`
							val l: int[] = List.<int>([42]);
							l.0 = 43;
						`,
						`
							val d: [:int] = Dict.<int>([i= 42]);
							d.i = 43;
						`,
						`
							val s: int{} = Set.<int>([42]);
							s.[43] = true;
						`,
						`
							val m: {bool -> int} = Map.<bool, int>([[true, 42]]);
							m.[true] = 43;
						`,
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut y: float = 4.2;
					y = y * 10;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				return assertEqualBins(
					goal.children[1].build(),
					goal.builder.module.local.set(0, (goal.children[1] as AST.ASTNodeAssignment).assigned.build()),
				);
			});
			it('coerces as necessary.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: float | int = 4.2;
					val mut y: int | float = 4.2;
					x = 8.4;
					x = 16;
					x = x;
					x = y;
					x = 52 + x;
					x = x + x;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build()),
					goal.children.slice(2).map((stmt) => goal.builder.module.local.set(0, (stmt as AST.ASTNodeAssignment).assigned.build())),
				);
			});
		});
	});



	describe('ASTNodeGoal', () => {
		describe('#varCheck', () => {
			it('aggregates multiple errors.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					a + b || c * d;
					val y: V & W | X & Y = null;
					val x: int = 42;
					val x: int = 420;
					x = 4200;
					type T = int;
					type T = float;
					val z: x = null;
					val z: int = T;
				`).varCheck(), (err) => {
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
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
				`);
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
				xjs.Array.forEachAggregated([
					'',
					'42;',
					`
						val x: int = 42;
						x;
					`,
				], (src) => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
					goal.varCheck();
					goal.typeCheck();
					return assertEqualBins(goal.build(), goal.builder.module.nop());
				});
			});
		});
	});
});
