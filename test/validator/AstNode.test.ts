import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	assert_instanceof,
	AST,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorInvalidOperation,
	TypeErrorNotAssignable,
} from '../../src/index.ts';
import {
	assertAssignable,
	setupScript,
} from '../utils.ts';



test.suite('AstNode', () => {
	test.suite('Index', () => {
		test.suite('#index', () => {
			test.test('returns the cooked value of the integer token.', () => {
				[0n, 1n, 2n, 4n, 8n, 16n].forEach((index) => {
					const type_accessor: AST.Index | AST.Key = AST.TYPE.Access.fromSource(`MyTuple.${ index }`).accessor;
					assert_instanceof(type_accessor, AST.Index);
					assert.strictEqual(type_accessor.index, index);

					const expr_accessor: AST.Index | AST.Key | AST.EXPR.Expression = AST.EXPR.Access.fromSource(`my_tuple.${ index }`).accessor;
					assert_instanceof(expr_accessor, AST.Index);
					assert.strictEqual(expr_accessor.index, index);
				});
			});
		});
	});



	test.suite('Goal', () => {
		test.suite('#varCheck', () => {
			test.test('aggregates multiple errors.', () => {
				assert.throws(() => setupScript(`{
					a + b || c * d;
					val y: V & W | X & Y = null;
					val x: int = 42;
					val x: int = 420;
					set x = 4200;
					type T = int;
					type T = float;
					val z: x = null;
					val z: int = T;
				}`, {typeCheck: false}), (err) => {
					assertAssignable(err as Error, {
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
							{cons: AssignmentErrorReassignment,         message: 'Reassignment of read-only variable `x`.'},
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
				const {goal} = setupScript(`{
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
				}`, {typeCheck: false});
				assert.throws(() => goal.typeCheck(), (err) => {
					assertAssignable(err as Error, {
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
			test.test('Goal builds each statement.', () => {
				assert.strictEqual(setupScript(`{
					val mut assignee_b?: int;
					val mut assignee_c:  int = 42;
					val     _:           int = assignee_c;
					val     assignee_d:  int = assignee_c;
					val mut assignee_e:  int = assignee_c;

					assignee_b;
					assignee_c;
					assignee_d;
					assignee_e;

					set assignee_e = 43;
					set assignee_e = 44;
					set assignee_e = -42;
				}`, {codegen: false}).builder.instructions.length, 12);
			});
		});
	});
});
