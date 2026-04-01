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
import {assertAssignable} from '../../assert-helpers.ts';
import {typeUnit} from '../../helpers.ts';



describe('ASTNodeCP', () => {
	describe('ASTNodeIndex', () => {
		describe('#index', () => {
			it('returns the cooked value of the integer token.', () => {
				[0n, 1n, 2n, 4n, 8n, 16n].forEach((index) => {
					const type_accessor: AST.ASTNodeIndex | AST.ASTNodeKey = AST.ASTNodeTypeAccess.fromSource(`MyTuple.${ index }`).accessor;
					assert_instanceof(type_accessor, AST.ASTNodeIndex);
					assert.strictEqual(type_accessor.index, index);

					const expr_accessor: AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression = AST.ASTNodeAccess.fromSource(`my_tuple.${ index };`).accessor;
					assert_instanceof(expr_accessor, AST.ASTNodeIndex);
					assert.strictEqual(expr_accessor.index, index);
				});
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
				it('allows reassignment when uninitialized.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						val mut x?: int;
						x = 42;
					`);
					goal.varCheck();
					goal.typeCheck();
					return assert.partialDeepStrictEqual(goal.validator.getSymbolInfo(0x100n), {
						unfixed:       true,
						uninitialized: true,
						type:          TYPE.INT,
						value:         null,
					});
				});
				it('does not allow reassignment of `null` when uninitialized.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						val mut x?: int;
						x = null;
					`);
					goal.varCheck();
					assert.partialDeepStrictEqual(goal.validator.getSymbolInfo(0x100n), {
						unfixed:       true,
						uninitialized: true,
					});
					return assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
			});

			context('for property reassignment.', () => {
				it('allows assignment directly on objects.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						List.<int>((42,)).[0]                 = 42;
						Dict.<int>((i= 42)).[@i]              = 42;
						Set.<int>((42,)).[43]                 = false;
						Map.<bool, int>(((true, 42),)).[true] = 42;
					`);
					goal.varCheck();
					return goal.typeCheck(); // assert does not throw
				});
				it('throws when property assignee type is not supertype.', () => {
					[
						`
							val l: mut [int] = [42];
							l.[0] = 4.2;
						`,
						`
							val d: mut [:int] = [i= 42];
							d.[@i] = 4.2;
						`,
						`
							val s: mut {int} = {42};
							s.[42] = 4.2;
						`,
						`
							val m: mut {bool -> int} = {true -> 42};
							m.[true] = 4.2;
						`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
					});
				});
				it('throws when Set/Map accessor expression is not a valid type.', () => {
					xjs.Array.forEachAggregated([`
						val s: mut {int} = {42};
						s.[4.3] = true;
					`, `
						val m: mut {bool -> int} = {true -> 42};
						m.["true"] = 43;
					`], (src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotNarrow);
					});
				});
				it('throws when assignee’s base type is not mutable.', () => {
					[
						`
							val t: (int,) = (42,);
							t.0 = 43;
						`,
						`
							val r: (i: int) = (i= 42);
							r.i = 43;
						`,
						`
							val l: [int] = [42];
							l.[0] = 43;
						`,
						`
							val d: [:int] = [i= 42];
							d.[@i] = 43;
						`,
						`
							val s: {int} = {42};
							s.[43] = true;
						`,
						`
							val m: {bool -> int} = {true -> 42};
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
	});
});
