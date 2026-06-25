import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	assert_instanceof,
	TYPE,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorInvalidOperation,
	TypeErrorNotAssignable,
} from '../../src/index.ts';
import {
	repeat,
	assert_shallowStrictEqual,
	assertAssignable,
	setupScript,
} from '../utils.ts';



test.suite('AstNode', () => {
	test.suite('#varCheck', () => {
		test.suite('ParameterFunction', () => {
			test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
				const {stmts} = setupScript(`{
					\\(a: int, mut b: int, mut $c: int, delta= d: int): void { return; };
				}`, {varCheck: false});
				const fn = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				assert.ok(!fn.block.validator.hasSymbol(0x100n));
				assert.ok(!fn.block.validator.hasSymbol(0x101n));
				assert.ok(!fn.block.validator.hasSymbol(0x102n));
				assert.ok(!fn.block.validator.hasSymbol(0x103n));
				assert.ok(!fn.block.validator.hasSymbol(0x104n));
				fn.varCheck();
				assert.ok(fn.block.validator.hasSymbol(0x100n));
				assert.ok(fn.block.validator.hasSymbol(0x101n));
				assert.ok(fn.block.validator.hasSymbol(0x102n));
				assert.ok(!fn.block.validator.hasSymbol(0x103n)); // param key `delta` is not in symbol table
				assert.ok(fn.block.validator.hasSymbol(0x104n));
				const info_a: SymbolSchema | undefined = fn.block.validator.getSymbol(0x100n);
				const info_b: SymbolSchema | undefined = fn.block.validator.getSymbol(0x101n);
				const info_c: SymbolSchema | undefined = fn.block.validator.getSymbol(0x102n);
				const info_d: SymbolSchema | undefined = fn.block.validator.getSymbol(0x104n);
				assert_instanceof(info_a, SymbolSchemaVar);
				assert_instanceof(info_b, SymbolSchemaVar);
				assert_instanceof(info_c, SymbolSchemaVar);
				assert_instanceof(info_d, SymbolSchemaVar);
				assert.partialDeepStrictEqual(info_a, {
					isWritable:      false,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
				});
				assert.partialDeepStrictEqual(info_b, {
					isWritable:      true,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
				});
				assert.partialDeepStrictEqual(info_c, {
					isWritable:      true,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
				});
				return assert.partialDeepStrictEqual(info_d, {
					isWritable:      false,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
				});
			});
			test.test('for blank params, does not add to symbol table.', () => {
				const {stmts} = setupScript(`{
					\\(_: int): void { return; };
				}`, {varCheck: false});
				const fn = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				assert.ok(!fn.block.validator.hasSymbol(0x100n));
				fn.varCheck();
				return assert.ok(!fn.block.validator.hasSymbol(0x100n));
			});
			test.test('allows duplicate blank param.', () => {
				setupScript(`{
					\\(_: int, _: str): void { return; };
				}`, {typeCheck: false}); // assert does not throw
			});
			test.test('disallows duplicate param ids.', () => {
				const {stmts} = setupScript(`{
					\\(a: int, a: float): void { return; };
				}`, {varCheck: false});
				const fn0 = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				return assert.throws(() => fn0.varCheck());
			});
			test.test.todo('disallows duplicate param keys.', () => {
				const {stmts} = setupScript(`{
					\\(a= b: int, a= c: float): void { return; };
					\\($a: int, a= c: float): void { return; };
				}`, {varCheck: false});
				const fn0 = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				const fn1 = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				assert.throws(() => fn0.varCheck());
				return assert.throws(() => fn1.varCheck());
			});
			test.test('throws when parameter shadows outside scope.', () => {
				setupScript(`{
					val x: int = 42;
					\\(y: str): void { return; };
				}`, {typeCheck: false}); // assert does not throw
				return assert.throws(() => setupScript(`{
					val x: int = 42;
					\\(x: str): void { return; };
				}`, {typeCheck: false}), AssignmentErrorDuplicateDeclaration);
			});
			test.test('does not throw when parameter name is reused outside of function scope.', () => {
				setupScript(`{
					\\(x: str): void { return; };
					val x: int = 42;
				}`, {typeCheck: false}); // assert does not throw
			});
			test.test('parameter itself does not throw when it is shadowed.', () => {
				const {stmts} = setupScript(`{
					val x: int = 42;
					\\(y: str): void { % no error
						val y: float = 4.2; %> AssignmentErrorDuplicateDeclaration
						return;
					};
				}`, {varCheck: false});
				stmts[0].varCheck();
				const fn = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				fn.parameters[0].varCheck(); // assert does not throw
				return assert.throws(() => fn.block.varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			test.test('TEMP: allows implicit captures.', () => {
				setupScript(`{
					val x: int = 42;
					\\(y: str): void {
						x;
						return;
					};
				}`, {typeCheck: false});
			});
			test.test.todo('throws when capture is not explicit.', () => {
				const {stmts} = setupScript(`{
					val x: int = 42;
					\\(y: str): void {
						x; %> error
						return;
					};
				}`, {varCheck: false});
				stmts[0].varCheck();
				const fn = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				fn.parameters[0].varCheck();
				return assert.throws(() => fn.block.varCheck());
			});
		});
	});



	test.suite('#typeCheck', () => {
		test.suite('ParameterFunction', () => {
			test.test('sets the SymbolSchemaVar `type`.', () => {
				const {stmts} = setupScript(`{
					\\(a: float, mut b: str): void { return; };
				}`, {typeCheck: false});
				const fn = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				assert.ok(fn.block.validator.hasSymbol(0x100n));
				assert.ok(fn.block.validator.hasSymbol(0x101n));
				const info_a: SymbolSchema | undefined = fn.block.validator.getSymbol(0x100n);
				const info_b: SymbolSchema | undefined = fn.block.validator.getSymbol(0x101n);
				assert_instanceof(info_a, SymbolSchemaVar);
				assert_instanceof(info_b, SymbolSchemaVar);
				assert_shallowStrictEqual(
					[info_a.type, info_b.type],
					repeat(TYPE.ANYTHING, 2),
				);
				fn.parameters.forEach((param) => param.typeCheck());
				return assert_shallowStrictEqual(
					[info_a.type, info_b.type],
					[TYPE.FLOAT, TYPE.STR],
				);
			});
		});
	});



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
