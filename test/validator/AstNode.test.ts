import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	TYPE,
	Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	TypeErrorInvalidOperation,
	TypeErrorNotAssignable,
	AssignmentErrorFunctionExit,
} from '../../src/index.ts';
import {
	repeat,
	assert_shallowStrictEqual,
	assertAssignable,
	setupScript,
} from '../utils.ts';



test.suite('AstNode', () => {
	test.suite('#typeCheck', () => {
		test.suite('ParameterFunction', () => {
			test.test('sets the SymbolSchemaVar `type`.', () => {
				const {stmts, visitors} = setupScript(`{
					\\(a: float, mut b: str): void { return; };
				}`, {typeCheck: false});
				const id_a: bigint = Validator.keyId('a');
				const id_b: bigint = Validator.keyId('b');
				const fn = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				assert.ok(fn.block.validator.hasSymbol(id_a));
				assert.ok(fn.block.validator.hasSymbol(id_b));
				const info_a: SymbolSchema | undefined = fn.block.validator.getSymbol(id_a);
				const info_b: SymbolSchema | undefined = fn.block.validator.getSymbol(id_b);
				assert_instanceof(info_a, SymbolSchemaVar);
				assert_instanceof(info_b, SymbolSchemaVar);
				assert_shallowStrictEqual(
					[info_a.type, info_b.type],
					repeat(TYPE.ANYTHING, 2),
				);
				fn.parameters.forEach((param) => visitors.typeCheck.visit(param));
				return assert_shallowStrictEqual(
					[info_a.type, info_b.type],
					[TYPE.FLOAT, TYPE.STR],
				);
			});
			test.test('throws when param default value is not assignable to declared type.', () => {
				const param: AST.ParameterFunction = AST.EXPR.Function.fromSource('\\(a?: float = 42): void { return; }').parameters[0];
				const visitor_type_check = new AST.AstNodeVisitorTypeCheck();
				return assert.throws(() => visitor_type_check.visit(param), TypeErrorNotAssignable);
			});
		});

		test.suite('Block', () => {
			test.test('throws for lack of return statement in every code path.', () => {
				const {stmts, visitors} = setupScript(`{
					func foo0(): float { "hello"; }
					func foo2(b: bool): float {
						if b then { return 4.2; } else { "world"; };
					}
				}`, {typeCheck: false});
				const fn1 = stmts[1] as AST.STMT.DeclarationFunction;
				const block0:  AST.Block = (stmts[0] as AST.STMT.DeclarationFunction).block;
				const block1a: AST.Block = (fn1.block.children[0] as AST.STMT.StatementConditional).consequent;
				const block1b: AST.Block = (fn1.block.children[0] as AST.STMT.StatementConditional).alternative as AST.Block;
				assert.throws(() => visitors.typeCheck.visit(block0), AssignmentErrorFunctionExit);
				xjs.Array.forEachAggregated(fn1.parameters, (p) => visitors.typeCheck.visit(p));
				visitors.typeCheck.visit(block1a); // assert does not throw
				visitors.typeCheck.visit(block1b); // assert does not throw
				return assert.throws(() => visitors.typeCheck.visit(fn1.block), AssignmentErrorFunctionExit);
			});
			test.test('throws when not all code paths return.', () => {
				const {stmts, visitors} = setupScript(`{
					\\(): void {
						42;
					};
					\\(b: bool): void {
						if b then {
							return;
						};
					};
					\\(b: bool): void {
						if b then ({
							return;
						}) else 42;
					};
					\\(mut b: bool): void {
						while b do {
							break;
						};
					};
					\\(): int {
						switch 1
							case 2 -> 3
							case 4 | 5 -> { return 6; }
						default { return 7; };
					};
					func f1(): void {
						42;
					}
					func f2(b: bool): void {
						if b then {
							return;
						};
					}
					func f3(b: bool): void {
						if b then ({
							return;
						}) else 42;
					}
					func f4(mut b: bool): void {
						while b do {
							break;
						};
					}
					func f5(): int {
						switch 1
							case 2 -> 3
							case 4 | 5 -> { return 6; }
						default { return 7; };
					}
				}`, {typeCheck: false});
				return xjs.Array.forEachAggregated([
					...stmts.slice(0, 5).map((stmt) => (stmt as AST.STMT.StatementExpression).expr as AST.EXPR.Function),
					...stmts.slice(5).map((stmt) => stmt as AST.STMT.DeclarationFunction),
				], (fn) => assert.throws(() => visitors.typeCheck.visit(fn), AssignmentErrorFunctionExit));
			});
		});
	});



	test.suite('Index', () => {
		test.suite('#index', () => {
			test.test('returns the cooked value of the integer token.', () => {
				[0n, 1n, 2n, 4n, 8n, 16n].forEach((index) => {
					const type_accessor: AST.Index | AST.Key = AST.TYPE.Access.fromSource(`MyTuple.${index}`).accessor;
					assert_instanceof(type_accessor, AST.Index);
					assert.strictEqual(type_accessor.index, index);

					const expr_accessor: AST.Index | AST.Key | AST.EXPR.Expression = AST.EXPR.Access.fromSource(`my_tuple.${index}`).accessor;
					assert_instanceof(expr_accessor, AST.Index);
					assert.strictEqual(expr_accessor.index, index);
				});
			});
		});
	});



	test.suite('Goal', () => {
		test.suite('#typeCheck', () => {
			test.test('aggregates multiple errors.', () => {
				const {goal, visitors} = setupScript(`{
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
				assert.throws(() => visitors.typeCheck.visit(goal), (err) => {
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
	});
});
