import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	TYPE,
	FUNC_API,
	CORE_LIB_NAMES,
	Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaVar,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorDuplicateKey,
	AssignmentErrorReassignment,
	AssignmentErrorDeletion,
} from '../../../src/index.ts';
import {
	extract_lines,
	assertAssignable,
	setupScript,
} from '../../utils.ts';



test.suite('AstNodeVisitorRefCheck#visit', () => {
	test.suite('ParameterFunction', () => {
		test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				\\(a: int, mut b: int, mut $c: int, delta= d: int, $e?: int): void { return; };
			}`, {refCheck: false});
			const id_a:     bigint = Validator.keyId('a');
			const id_b:     bigint = Validator.keyId('b');
			const id_c:     bigint = Validator.keyId('c');
			const id_delta: bigint = Validator.keyId('delta');
			const id_d:     bigint = Validator.keyId('d');
			const id_e:     bigint = Validator.keyId('e');
			const fn = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
			assert.ok(!fn.block.validator.hasSymbol(id_a));
			assert.ok(!fn.block.validator.hasSymbol(id_b));
			assert.ok(!fn.block.validator.hasSymbol(id_c));
			assert.ok(!fn.block.validator.hasSymbol(id_delta));
			assert.ok(!fn.block.validator.hasSymbol(id_d));
			assert.ok(!fn.block.validator.hasSymbol(id_e));
			VISITOR.visit(fn);
			assert.ok(fn.block.validator.hasSymbol(id_a));
			assert.ok(fn.block.validator.hasSymbol(id_b));
			assert.ok(fn.block.validator.hasSymbol(id_c));
			assert.ok(!fn.block.validator.hasSymbol(id_delta)); // param key `delta` is not in symbol table
			assert.ok(fn.block.validator.hasSymbol(id_d));
			assert.ok(fn.block.validator.hasSymbol(id_e));
			const info_a: SymbolSchema | undefined = fn.block.validator.getSymbol(id_a);
			const info_b: SymbolSchema | undefined = fn.block.validator.getSymbol(id_b);
			const info_c: SymbolSchema | undefined = fn.block.validator.getSymbol(id_c);
			const info_d: SymbolSchema | undefined = fn.block.validator.getSymbol(id_d);
			const info_e: SymbolSchema | undefined = fn.block.validator.getSymbol(id_e);
			assert_instanceof(info_a, SymbolSchemaVar);
			assert_instanceof(info_b, SymbolSchemaVar);
			assert_instanceof(info_c, SymbolSchemaVar);
			assert_instanceof(info_d, SymbolSchemaVar);
			assert_instanceof(info_e, SymbolSchemaVar);
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
			assert.partialDeepStrictEqual(info_d, {
				isWritable:      false,
				isUninitialized: false,
				type:            TYPE.ANYTHING,
			});
			return assert.partialDeepStrictEqual(info_e, {
				isWritable:      false,
				isUninitialized: true,
				type:            TYPE.ANYTHING,
			});
		});
		test.test('for blank params, does not add to symbol table.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				\\(_: int): void { return; };
			}`, {refCheck: false});
			const fn = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
			assert.ok(!fn.block.validator.hasSymbol(0x100n));
			VISITOR.visit(fn);
			return assert.ok(!fn.block.validator.hasSymbol(0x100n));
		});
		test.test('allows duplicate blank param.', () => {
			setupScript(`{
				\\(_: int, _: str): void { return; };
			}`, {typeCheck: false}); // assert does not throw
		});
		test.test('disallows duplicate param ids.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				\\(a: int, a: float): void { return; };
			}`, {refCheck: false});
			return assert.throws(() => VISITOR.visit((stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function), AssignmentErrorDuplicateDeclaration);
		});
		test.test('default values may not reference each other.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				\\(a: int, b?: int = a): int => a + b;
				\\($a?: int = b, $b: int): int => a + b;
				\\(alpha= a?: int = b, bravo= b: int): int => a + b;
			}`, {refCheck: false});
			return xjs.Array.forEachAggregated(stmts, (stmt) => assert.throws(() => VISITOR.visit(stmt), ReferenceErrorUndeclared));
		});
		test.test('parameters do not shadow outside scope.', () => {
			setupScript(`{
				val x: int = 42;
				\\(x: str): void { x; return; };
				\\(z: float): void {
					\\(z: bool): void { z; return; };
					z;
					return;
				};
				x;
			}`, {typeCheck: false}); // assert does not throw
		});
		test.test('does not throw when parameter name is reused outside of function scope.', () => {
			setupScript(`{
				\\(x: str): void { return; };
				val x: int = 42;
			}`, {typeCheck: false}); // assert does not throw
		});
		test.test('parameter itself does not throw when it is shadowed.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				val x: int = 42;
				\\(y: str): void { % no error
					val y: float = 4.2; %> AssignmentErrorDuplicateDeclaration
					return;
				};
			}`, {refCheck: false});
			VISITOR.visit(stmts[0]);
			const fn = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
			VISITOR.visit(fn.parameters[0]); // assert does not throw
			return assert.throws(() => VISITOR.visit(fn.block), AssignmentErrorDuplicateDeclaration);
		});
	});


	test.suite('Block', () => {
		test.suite('hoisting.', () => {
			test.test('allows function declaration overloads.', () => {
				const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
					{
						func f(): void { return; };
						func f(a: int): void { return; };
					};
					{
						type f = \\(int) => void;
						func f(a: int): void { return; };
					};
					{
						val f = \\(): void { return; };
						func f(a: int): void { return; };
					};
				}`, {refCheck: false});
				const blocks: readonly AST.Block[] = stmts.map((stmt) => ((stmt as AST.STMT.StatementExpression).expr as AST.EXPR.ExpressionBlock).block);
				VISITOR.visit(blocks[0]); // assert does not throw
				assert.throws(() => VISITOR.visit(blocks[1]), AssignmentErrorDuplicateDeclaration);
				return assert.throws(() => VISITOR.visit(blocks[2]), AssignmentErrorDuplicateDeclaration);
			});
			test.test('disallows function declaration of existing symbols.', () => {
				const errmsg = /Only function names should be hoisted/;
				const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
					func f(): void { return; }
					func f(a: int): void { return; }
					type T = \\(int) => void;
					func T(a: int): void { return; }
					val x = \\(): void { return; };
					func x(a: int): void { return; }
				}`, {refCheck: false});
				VISITOR.visit(stmts[0]);
				VISITOR.visit(stmts[1]); // allows overloads
				VISITOR.visit(stmts[2]);
				assert.throws(() => VISITOR.visit(stmts[3]), errmsg);
				VISITOR.visit(stmts[4]);
				return assert.throws(() => VISITOR.visit(stmts[5]), errmsg);
			});
			test.test('allows function declaration backreferences.', () => {
				setupScript(`{
					f.();
					func f(): void { return; };
				}`, {typeCheck: false});
				setupScript(`{
					func f(): void { g.(); return; };
					func g(): void { f.(); return; };
				}`, {typeCheck: false});
			});
		});
		test.suite('function blocks.', () => {
			test.test('allows implicit captures for type aliases and function names.', () => {
				setupScript(`{
					type T = float;
					func f(): void { return; }
					\\(): void {
						val x: T = 42;
						f.();
						return;
					};
					\\(): void => f.() as <T>;
					func g(): void {
						val x: T = 42;
						f.();
						return;
					}
					func h(): void => f.() as <T>;
				}`, {typeCheck: false}); // assert does not throw
			});
			test.test('allows explicit variable captures.', () => {
				setupScript(`{
					val x: int = 42;
					val mut y: float = 4.2;
					\\() with (x, y): void {
						x;
						return;
					};
					\\() with (x, y): int => x;
					func f() with (x, ref y): void {
						x;
						set y = 5.2;
						return;
					}
					func g() with (x, ref y): int => x;
				}`, {typeCheck: false}); // assert does not throw
			});
			test.test('throws when variable capture is not explicit.', () => {
				const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
					val x: int = 42;
					\\(): void {
						x;
						return;
					};
					\\(): int => x;
					func f(): void {
						x;
						return;
					}
					func g(): int => x;
				}`, {refCheck: false});
				VISITOR.visit(stmts[0]);
				return xjs.Array.forEachAggregated([
					...(stmts.slice(1, 3) as AST.STMT.StatementExpression[]).map((stmt) => stmt.expr as AST.EXPR.Function),
					...(stmts.slice(3) as AST.STMT.DeclarationFunction[]),
				], (fn) => assert.throws(() => VISITOR.visit(fn.block), ReferenceErrorUndeclared));
			});
			test.test('throws for undeclared variables.', () => {
				const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
					\\(): void {
						x;
						return;
					};
					\\(): int => x;
					func f(): void {
						x;
						return;
					}
					func g(): int => x;
				}`, {refCheck: false});
				xjs.Array.forEachAggregated([
					...(stmts.slice(0, 2) as AST.STMT.StatementExpression[]).map((stmt) => stmt.expr as AST.EXPR.Function),
					...(stmts.slice(2) as AST.STMT.DeclarationFunction[]),
				], (fn) => assert.throws(() => VISITOR.visit(fn.block), ReferenceErrorUndeclared));
			});
			test.test('throws for duplicate variable declaration.', () => {
				const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
					val x: int = 42;
					\\() with (x): void {
						val x: float = 4.2;
						return;
					};
					func f() with (x): void {
						val x: float = 4.2;
						return;
					}
				}`, {refCheck: false});
				VISITOR.visit(stmts[0]);
				return xjs.Array.forEachAggregated([
					(stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function,
					stmts[2] as AST.STMT.DeclarationFunction,
				], (fn) => {
					VISITOR.visit(fn.captures[0]);
					return assert.throws(() => VISITOR.visit(fn.block), AssignmentErrorDuplicateDeclaration);
				});
			});
			test.test('throws when reassigning non-ref capture.', () => {
				const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
					val mut x: int = 42;
					\\() with (x): void {
						set x = 43;
						return;
					};
					func f() with (x): void {
						set x = 43;
						return;
					}
					func g() with (ref x): void {
						set x = 43;
						return;
					}
				}`, {refCheck: false});
				VISITOR.visit(stmts[0]);
				xjs.Array.forEachAggregated([
					(stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function,
					stmts[2] as AST.STMT.DeclarationFunction,
				], (fn) => {
					VISITOR.visit(fn.captures[0]);
					return assert.throws(() => VISITOR.visit(fn.block), AssignmentErrorReassignment);
				});
				return VISITOR.visit(stmts[3]); // assert does not throw
			});
		});
	});


	test.suite('Goal', () => {
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


	test.suite('TypeAlias', () => {
		test.test('throws if the validator does not contain a record for the identifier.', () => {
			setupScript(`{
				type T = int;
				type U = float | T;
			}`, {typeCheck: false}); // assert does not throw
			assert.throws(() => setupScript(`{
				type U = float | T;
			}`, {typeCheck: false}), ReferenceErrorUndeclared);
		});
		test.test('throws when declared in an inner scope.', () => {
			assert.throws(() => setupScript(`{
				if true then {
					type T = int;
				};
				type _ = float | T;
			}`, {typeCheck: false}), ReferenceErrorUndeclared);
		});
		test.test('throws when there is a temporal dead zone.', {expectFailure: true}, () => {
			assert.throws(() => setupScript(`{
				T;
				type T = int;
			}`, {typeCheck: false}), ReferenceErrorDeadZone);
		});
		test.test('allows core lib class references if they are not generic.', () => {
			setupScript(`{
				type Nu = Null;
				type Bo = Boolean;
				type Sy = Symbol;
				type In = Integer;
				type Na = Natural;
				type Fl = Float;
				type St = String;
				type Ob = Object;
				type Ex = Exception;
				type Fu = Function;
				type Cl = Class;
			}`, {typeCheck: false}); // assert does not throw
		});
		test.test('throws if core lib generic class references are referenced with no generic arguments.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				List
				Dict
				Set
				Map
				Maybe
				None
				Some
				Result
				Fail
				Ok
			`, (src) => {
				const alias: AST.TYPE.TypeAlias = AST.TYPE.TypeAlias.fromSource(src);
				return assert.throws(() => new AST.AstNodeVisitorRefCheck().visit(alias), ReferenceErrorKind);
			});
		});
		test.test('throws if referencing a variable declaration.', () => {
			assert.throws(() => setupScript(`{
				val FOO: int = 42;
				type _ = FOO | float;
			}`, {typeCheck: false}), ReferenceErrorKind);
			assert.throws(() => setupScript(`{
				for FOO: int in [42] do {
					type _ = FOO | float;
				};
			}`, {typeCheck: false}), ReferenceErrorKind);
		});
		test.test('throws if referencing a function declaration.', () => {
			const {stmts, visitors} = setupScript(`{
				func f(): void { return; }
				type U = f;
			}`, {refCheck: false});
			visitors.refCheck.visit(stmts[0]);
			return assert.throws(() => visitors.refCheck.visit(((stmts[1] as AST.STMT.DeclarationType).assigned)), ReferenceErrorKind);
		});
	});


	test.suite('TypeRecord, ExpressionRecord, EXPR.Dict', () => {
		test.test('throws if containing duplicate keys.', () => {
			const VISITOR = new AST.AstNodeVisitorRefCheck();

			[
				AST.TYPE.Record .fromSource('(a: int, b: float, c: str)'),
				AST.EXPR.Record .fromSource('(a= 1, b= 2.0, c= "three")'),
				AST.EXPR.Dict   .fromSource('[a= 1, b= 2.0, c= "three"]'),
			].forEach((node) => VISITOR.visit(node)); // assert does not throw

			[
				AST.TYPE.Record .fromSource('(a: int, b: float, a: str)'),
				AST.TYPE.Record .fromSource('(_: int, b: float, _: str)'),
				AST.EXPR.Record .fromSource('(a= 1, b= 2.0, a= "three")'),
				AST.EXPR.Record .fromSource('(_= 1, b= 2.0, _= "three")'),
				AST.EXPR.Dict   .fromSource('[a= 1, b= 2.0, a= "three"]'),
				AST.EXPR.Dict   .fromSource('[_= 1, b= 2.0, _= "three"]'),
			].forEach((node) => assert.throws(() => VISITOR.visit(node), AssignmentErrorDuplicateKey));

			new Map<AST.AstNode, string[]>([
				[AST.TYPE.Record .fromSource('(c: int, d: float, c: str, d: bool)'),  ['c', 'd']],
				[AST.TYPE.Record .fromSource('(e: int, f: float, e: str, e: bool)'),  ['e', 'e']],
				[AST.EXPR.Record .fromSource('(c= 1, d= 2.0, c= "three", d= false)'), ['c', 'd']],
				[AST.EXPR.Record .fromSource('(e= 1, f= 2.0, e= "three", e= false)'), ['e', 'e']],
				[AST.EXPR.Dict   .fromSource('[c= 1, d= 2.0, c= "three", d= false]'), ['c', 'd']],
				[AST.EXPR.Dict   .fromSource('[e= 1, f= 2.0, e= "three", e= false]'), ['e', 'e']],
			]).forEach((dupes, node) => assert.throws(() => VISITOR.visit(node), (err) => {
				assertAssignable(err as Error, {
					cons:   AggregateError,
					errors: dupes.map((k) => ({
						cons:    AssignmentErrorDuplicateKey,
						message: `Duplicate record/dict/parameter key \`${k}\`.`,
					})),
				});
				return true;
			}));
		});
	});


	test.suite('TYPE.Call', () => {
		test.test('catches ReferenceErrorKind thrown by `TypeAlias#varCheck`.', () => {
			new AST.AstNodeVisitorRefCheck().visit(AST.TYPE.Call.fromSource('List.<int>')); // assert does not throw
			return assert.throws(() => new AST.AstNodeVisitorRefCheck().visit(AST.TYPE.Type.fromSource('List | Dict')), (err) => {
				assertAssignable(err as Error, {
					cons:   AggregateError,
					errors: [
						{cons: ReferenceErrorKind, message: '`List` refers to a type function, but is used as a type.'},
						{cons: ReferenceErrorKind, message: '`Dict` refers to a type function, but is used as a type.'},
					],
				});
				return true;
			});
		});
		test.test('throws if named generic args have duplicate keys.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				type Callable = int;
				type Actual1 = Callable.<int, A= nat, B= float>; % no error
				type Actual2 = Callable.<int, A= nat, A= float>; %> AssignmentErrorDuplicateKey
			}`, {refCheck: false});
			xjs.Array.forEachAggregated(stmts.slice(0, 1), (stmt) => VISITOR.visit(stmt));
			return assert.throws(() => VISITOR.visit(stmts[2]), AssignmentErrorDuplicateKey);
		});
	});


	test.suite('TypeFunction', () => {
		test.test('throws for duplicate param labels.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				type T = \\(a: int, b: bool) => void;
				type U = \\(a: int, b: bool) => void;
				type V = \\(a: int, a: bool) => void;
			}`, {refCheck: false});
			stmts.slice(0, 2).forEach((stmt) => VISITOR.visit(stmt));
			return assert.throws(() => VISITOR.visit(stmts[2]), AssignmentErrorDuplicateKey);
		});
		test.test('single underscore is considered a word, not an identifier.', () => {
			const decl: AST.STMT.DeclarationType = AST.STMT.DeclarationType.fromSource('type X = \\(_: bool, _: int) => void;');
			return assert.throws(() => new AST.AstNodeVisitorRefCheck().visit(decl), AssignmentErrorDuplicateKey);
		});
	});


	test.suite('EXPR.Constant', () => {
		test.test('never throws.', () => {
			new AST.AstNodeVisitorRefCheck().visit(AST.EXPR.Constant.fromSource('42'));
		});
	});


	test.suite('Variable', () => {
		test.test('allows core lib class references.', () => {
			setupScript(`{
				${CORE_LIB_NAMES.join(';')};
			}`, {typeCheck: false}); // assert does not throw
		});
		test.test('throws if the validator does not contain a record for the identifier.', () => {
			const {visitors: {refCheck: VISITOR}} = setupScript(`{
				val mut i: int = 42;
				i;
			}`, {typeCheck: false}); // assert does not throw
			assert.throws(() => VISITOR.visit(AST.EXPR.Variable.fromSource('i')), ReferenceErrorUndeclared);
		});
		test.test('throws when declared in an inner scope.', () => {
			assert.throws(() => setupScript(`{
				if true then {
					val mut i: int = 42;
				};
				i;
			}`, {typeCheck: false}), ReferenceErrorUndeclared);
		});
		test.test('throws when there is a temporal dead zone.', {expectFailure: true}, () => {
			assert.throws(() => setupScript(`{
				i;
				val mut i: int = 42;
			}`, {typeCheck: false}), ReferenceErrorDeadZone);
		});
		test.test('throws if it was declared as a type alias.', () => {
			assert.throws(() => setupScript(`{
				type FOO = int;
				42 || FOO;
			}`, {typeCheck: false}), ReferenceErrorKind);
		});
		test.test('throws if it was declared as a function.', () => {
			const {stmts, visitors} = setupScript(`{
				func inc(x: int): int => x + 1;
				inc;
			}`, {refCheck: false});
			visitors.refCheck.visit(stmts[0]);
			return assert.throws(() => visitors.refCheck.visit((stmts[1] as AST.STMT.StatementExpression).expr!), ReferenceErrorKind);
		});
		test.test('disallows uncalled built-in function names.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				${[...FUNC_API.keys().map((name) => `${name};`)].join('\n')}
			}`, {refCheck: false});
			return xjs.Array.forEachAggregated(stmts, (stmt) => assert.throws(() => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!), ReferenceErrorKind));
		});
		test.test('iteration variable of `for` loop is scoped only to the block.', () => {
			setupScript(`{
				for it: float in [1.1, 2.2, 3.3] do {
					it;
				};
			}`, {typeCheck: false}); // assert does not throw
			assert.throws(() => setupScript(`{
				for it: float in [1.1, 2.2, 3.3, it] do {
					42;
				};
			}`, {typeCheck: false}), ReferenceErrorUndeclared, 'iteraion variable cannot be referenced in the iterator expression.');
			assert.throws(() => setupScript(`{
				for it: float in [1.1, 2.2, 3.3] do {
					42;
				};
				it;
			}`, {typeCheck: false}), ReferenceErrorUndeclared, 'iteration variable cannot be referenced after the iteration statement.');
		});
	});


	test.suite('EXPR.Call', () => {
		test.test('catches ReferenceErrorKind thrown by `Variable#varCheck`.', () => {
			setupScript(`{
				func inc(x: int): int => x + 1;
				inc.(42);
			}`, {typeCheck: false}); // assert does not throw
			const {stmts, visitors} = setupScript(`{
				func inc1(x: int): int => x + 1;
				val inc2: \\(int) => int = \\(x: int): int => x + 2;
				inc2;
				(inc1).(42); % parsed exactly like \`inc1.(42)\`
				(inc1 || inc2).(42);
			}`, {refCheck: false});
			xjs.Array.forEachAggregated(stmts.slice(0, 4), (stmt) => visitors.refCheck.visit(stmt));
			return assert.throws(() => visitors.refCheck.visit((stmts[4] as AST.STMT.StatementExpression).expr!), ReferenceErrorKind);
		});
		test.test('allows built-in function names when called.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				${[...FUNC_API.keys().map((name) => `${name}.(42);`)].join('\n')}
			}`, {refCheck: false});
			return xjs.Array.forEachAggregated(stmts, (stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)); // assert does not throw
		});
		test.test('throws if named args have duplicate keys.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				func callable(): int => 42;
				callable.(42, a= +43, b= 4.4);                        % no error
				callable.(42, a= +43, a= 4.4);                        %> AssignmentErrorDuplicateKey
				callable.<int, A= nat, B= float>();                   % no error
				callable.<int, A= nat, A= float>();                   %> AssignmentErrorDuplicateKey
				callable.<int, A= nat, B= float>(42, a= +43, b= 4.4); % no error
				callable.<int, A= nat, B= float>(42, a= +43, a= 4.4); %> AssignmentErrorDuplicateKey
				callable.<int, A= nat, A= float>(42, a= +43, b= 4.4); %> AssignmentErrorDuplicateKey
				callable.<int, A= nat, A= float>(42, a= +43, a= 4.4); %> AssignmentErrorDuplicateKey
			}`, {refCheck: false});
			xjs.Array.forEachAggregated([
				stmts[0],
				stmts[1],
				stmts[3],
				stmts[5],
			], (stmt) => VISITOR.visit(stmt));
			return xjs.Array.forEachAggregated([
				stmts[2],
				stmts[4],
				stmts[6],
				stmts[7],
				stmts[8],
			], (stmt) => assert.throws(() => VISITOR.visit(stmt), AssignmentErrorDuplicateKey));
		});
		test.test('allows named generic args and named args to share keys.', () => {
			setupScript(`{
				func callable(): int => 42;
				callable.<A= nat, b= float>(b= 42, A= 4.4);
			}`, {typeCheck: false}); // assert does not throw
		});
	});


	test.suite('ExpressionFunction, DeclarationFunction', () => {
		test.test('disallows duplicate param keys.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				\\(a= b: int, a= c: float): void { return; };
				\\($a: int, a= c: float): void { return; };
			}`, {refCheck: false});
			const fn0 = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
			const fn1 = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
			assert.throws(() => VISITOR.visit(fn0), AssignmentErrorDuplicateKey);
			return assert.throws(() => VISITOR.visit(fn1), AssignmentErrorDuplicateKey);
		});
		test.test('throws when capture is not declared.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				\\() with (x): void { return; };
			}`, {refCheck: false});
			return assert.throws(() => VISITOR.visit(stmts[0]), ReferenceErrorUndeclared);
		});
		test.test('disallows duplicate captures.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				val x: int = 42;
				\\() with (x, x): void { return; };
			}`, {refCheck: false});
			VISITOR.visit(stmts[0]);
			const fn0 = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
			return assert.throws(() => VISITOR.visit(fn0), AssignmentErrorDuplicateDeclaration);
		});
	});


	test.suite('DeclarationType', () => {
		test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
			const goal: AST.Goal = AST.Goal.fromSource(`{
				type T = int;
			}`);
			const id: bigint = Validator.keyId('T');
			assert.ok(!goal.block!.validator.hasSymbol(id));
			new AST.AstNodeVisitorRefCheck().visit(goal);
			assert.ok(goal.block!.validator.hasSymbol(id));
			const info: SymbolSchema | undefined = goal.block!.validator.getSymbol(id);
			assert_instanceof(info, SymbolSchemaType);
			assert.strictEqual(info.typevalue, TYPE.ANYTHING);
		});
		test.test('for blank identifiers, does not add to symbol table.', () => {
			const goal: AST.Goal = AST.Goal.fromSource(`{
				type _ = str;
			}`);
			assert.ok(!goal.block!.validator.hasSymbol(0x100n));
			new AST.AstNodeVisitorRefCheck().visit(goal);
			return assert.ok(!goal.block!.validator.hasSymbol(0x100n));
		});
		test.test('throws if the validator already contains a record for the symbol.', () => {
			xjs.Array.forEachAggregated([`{
				type T = int;
				type T = float;
			}`, `{
				val FOO: int = 42;
				type FOO = float;
			}`, `{
				for it: float in [1.1, 2.2, 3.3] do {
					type it = int;
				};
			}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
		});
		test.test('disallows duplicate type declarations of built-in functions.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				${[...FUNC_API.keys().map((name) => `type ${name} = int;`)].join('\n')}
			}`, {refCheck: false});
			return xjs.Array.forEachAggregated(stmts, (stmt) => assert.throws(() => VISITOR.visit(stmt), AssignmentErrorDuplicateDeclaration));
		});
		test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
			xjs.Array.forEachAggregated([`{
				type T = int;
				if true then {
					type T = float;
				};
			}`, `{
				type T = int;
				while false do {
					type T = float;
				};
			}`, `{
				type T = int;
				for it: float in [1.1, 2.2, 3.3] do {
					type T = float;
				};
			}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
		});
		test.test('allows duplicate declaration of blank identifier.', () => {
			setupScript(`{
				type _ = int | float;
				type _ = (str, bool);
			}`, {typeCheck: false}); // assert does not throw
		});
	});


	test.suite('DeclarationVariable', () => {
		test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
			const goal: AST.Goal = AST.Goal.fromSource(`{
				val     a:  int = 42;
				val mut b:  int = 42;
				val mut c?: int;
			}`);
			const id_a: bigint = Validator.keyId('a');
			const id_b: bigint = Validator.keyId('b');
			const id_c: bigint = Validator.keyId('c');
			assert.ok(!goal.block!.validator.hasSymbol(id_a));
			assert.ok(!goal.block!.validator.hasSymbol(id_b));
			assert.ok(!goal.block!.validator.hasSymbol(id_c));
			new AST.AstNodeVisitorRefCheck().visit(goal);
			assert.ok(goal.block!.validator.hasSymbol(id_a));
			assert.ok(goal.block!.validator.hasSymbol(id_b));
			assert.ok(goal.block!.validator.hasSymbol(id_c));
			const info_a: SymbolSchema | undefined = goal.block!.validator.getSymbol(id_a);
			const info_b: SymbolSchema | undefined = goal.block!.validator.getSymbol(id_b);
			const info_c: SymbolSchema | undefined = goal.block!.validator.getSymbol(id_c);
			assert_instanceof(info_a, SymbolSchemaVar);
			assert_instanceof(info_b, SymbolSchemaVar);
			assert_instanceof(info_c, SymbolSchemaVar);
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
				isUninitialized: true,
				type:            TYPE.ANYTHING,
			});
		});
		test.test('for blank identifiers, does not add to symbol table.', () => {
			const goal: AST.Goal = AST.Goal.fromSource(`{
				val _: float = 4.2;
			}`);
			assert.ok(!goal.block!.validator.hasSymbol(0x100n));
			new AST.AstNodeVisitorRefCheck().visit(goal);
			return assert.ok(!goal.block!.validator.hasSymbol(0x100n));
		});
		test.test('throws if the validator already contains a record for the variable.', () => {
			xjs.Array.forEachAggregated([`{
				val i: int = 42;
				val i: int = 43;
			}`, `{
				type FOO = float;
				val FOO: int = 42;
			}`, `{
				for it: float in [1.1, 2.2, 3.3] do {
					val it: int = 42;
				};
			}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
		});
		test.test('disallows duplicate variable declarations of built-in functions.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				${[...FUNC_API.keys().map((name) => `val ${name}: int = 42;`)].join('\n')}
			}`, {refCheck: false});
			return xjs.Array.forEachAggregated(stmts, (stmt) => assert.throws(() => VISITOR.visit(stmt), AssignmentErrorDuplicateDeclaration));
		});
		test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
			xjs.Array.forEachAggregated([`{
				val mut x: int = 42;
				if true then {
					val mut x: float = 4.2;
				};
			}`, `{
				val mut x: int = 42;
				while false do {
					val mut x: float = 4.2;
				};
			}`, `{
				val mut x: int = 42;
				for it: float in [1.1, 2.2, 3.3] do {
					val mut x: float = 4.2;
				};
			}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
		});
		test.test('allows duplicate declaration of blank identifier.', () => {
			setupScript(`{
				val _: int = 42;
				val _: str = "the answer";
			}`, {typeCheck: false}); // assert does not throw
		});
	});


	test.suite('DeclarationFunction', () => {
		test.test('allows duplicate blank identifier.', () => {
			setupScript(`{
				func _(): void { return; };
				func _(a: int): void { return; };
			}`, {typeCheck: false}); // assert does not throw
		});
		test.test('allows self-reference, but not self-shadowing.', () => {
			setupScript(`{
				func f(): void {
					f.();
					return;
				};
			}`, {typeCheck: false}); // assert does not throw
			assert.throws(() => setupScript(`{
				func f(): void { % no error
					val f: int = 42; %> AssignmentErrorDuplicateDeclaration
					return;
				};
			}`, {typeCheck: false}), AssignmentErrorDuplicateDeclaration);
			return assert.throws(() => setupScript(`{
				func f( % no error
					f: int, %> AssignmentErrorDuplicateDeclaration
				): void {
					return;
				};
			}`, {typeCheck: false}), AssignmentErrorDuplicateDeclaration);
		});
	});


	test.suite('StatementReassignment', () => {
		test.test('`set` throws if the variable is read-only.', () => {
			const {goal, stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				val mut i: int = 42;
				val     j: int = 42;
				set i = 24;
				set j = 24;
			}`, {refCheck: false});
			stmts.slice(0, 3).forEach((stmt) => VISITOR.visit(stmt));
			assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('i'), {
				isWritable:      true,
				isUninitialized: false,
			});
			assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('j'), {
				isWritable:      false,
				isUninitialized: false,
			});
			return assert.throws(() => VISITOR.visit(stmts[3]), AssignmentErrorReassignment);
		});
		test.test('`set` always throws for type alias reassignment.', () => {
			assert.throws(() => setupScript(`{
				type T = 42;
				set T = 43;
			}`, {typeCheck: false}), ReferenceErrorKind);
		});
		test.test('`set` disallows manual reassignment of the iteration variable.', () => {
			assert.throws(() => setupScript(`{
				for it: int in [11, 22, 33] do {
					set it = 44;
				};
			}`, {typeCheck: false}), AssignmentErrorReassignment);
		});
		test.test('`delete` throws if the variable was initialized.', () => {
			const {goal, stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				val mut i?: int;
				val mut j:  int = 42;
				delete i;
				delete j;
			}`, {refCheck: false});
			stmts.slice(0, 3).forEach((stmt) => VISITOR.visit(stmt));
			assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('i'), {
				isWritable:      true,
				isUninitialized: true,
			});
			assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('j'), {
				isWritable:      true,
				isUninitialized: false,
			});
			return assert.throws(() => VISITOR.visit(stmts[3]), AssignmentErrorDeletion);
		});
		test.test('`delete` always throws for type alias deletion.', () => {
			assert.throws(() => setupScript(`{
				type T = 42;
				delete T;
			}`, {typeCheck: false}), ReferenceErrorKind);
		});
		test.test('`delete` disallows deletion of the iteration variable.', () => {
			assert.throws(() => setupScript(`{
				for it: int in [11, 22, 33] do {
					delete it;
				};
			}`, {typeCheck: false}), AssignmentErrorDeletion);
		});
		test.test('throws when non-ref-captured variable is reassigned, even if writable.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				val mut x: int = 42;
				val mut y: float = 4.2;
				func f() with (x, ref y): void {
					set y = 5.2;
					set x = 10;
					return;
				}
			}`, {refCheck: false});
			xjs.Array.forEachAggregated(stmts.slice(0, 2), (stmt) => VISITOR.visit(stmt));
			const fn = stmts[2] as AST.STMT.DeclarationFunction;
			xjs.Array.forEachAggregated(fn.captures, (capt) => VISITOR.visit(capt));
			const fn_stmts = fn.block.children;
			VISITOR.visit(fn_stmts[0]);
			return assert.throws(() => VISITOR.visit(fn_stmts[1]), AssignmentErrorReassignment);
		});
		test.test('throws when ref-captured read-only variable is reassigned.', () => {
			const {stmts, visitors: {refCheck: VISITOR}} = setupScript(`{
				val y: float = 4.2;
				func f() with (ref y): void {
					set y = 5.2;
					return;
				}
			}`, {refCheck: false});
			VISITOR.visit(stmts[0]);
			const fn = stmts[1] as AST.STMT.DeclarationFunction;
			VISITOR.visit(fn.captures[0]);
			return assert.throws(() => VISITOR.visit(fn.block.children[0]), AssignmentErrorReassignment);
		});
	});


	test.suite('StatementIteration', () => {
		test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
			const goal: AST.Goal = AST.Goal.fromSource(`{
				for it: float in [1.1, 2.2, 3.3] do {
					42;
				};
			}`);
			const validator: Validator = (goal.block!.children[0] as AST.STMT.StatementIteration).block.validator;
			const id: bigint = Validator.keyId('it');
			assert.ok(!validator.hasSymbol(id));
			new AST.AstNodeVisitorRefCheck().visit(goal);
			assert.ok(validator.hasSymbol(id));
			const info_it: SymbolSchema | undefined = validator.getSymbol(id);
			assert_instanceof(info_it, SymbolSchemaVar);
			return assert.partialDeepStrictEqual(info_it, {
				isWritable:      false,
				isUninitialized: false,
				type:            TYPE.ANYTHING,
			});
		});
		test.test('for blank identifiers, does not add to symbol table.', () => {
			const goal: AST.Goal = AST.Goal.fromSource(`{
				for _: float in [1.1, 2.2, 3.3] do {
					42;
				};
			}`);
			const validator: Validator = (goal.block!.children[0] as AST.STMT.StatementIteration).block.validator;
			const id: bigint = Validator.keyId('_');
			assert.ok(!validator.hasSymbol(id));
			new AST.AstNodeVisitorRefCheck().visit(goal);
			return assert.ok(!validator.hasSymbol(id));
		});
		test.test('allows duplicate declaration of iteration variable.', () => {
			setupScript(`{
				for it: float in [1.1, 2.2, 3.3] do {
					42;
				};
				for it: float in [1.1, 2.2, 3.3] do {
					42;
				};
			}`, {typeCheck: false}); // assert does not throw
		});
		test.test('allows duplicate declaration in nested scopes (not technically shadowing).', () => {
			xjs.Array.forEachAggregated([`{
				for it: int in [11, 22, 33] do {
					42;
				};
				if true then {
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
				};
			}`, `{
				for it: int in [11, 22, 33] do {
					42;
				};
				while false do {
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
				};
			}`, `{
				for it: int in [11, 22, 33] do {
					42;
				};
				for b: bool in [false, true] do {
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
				};
			}`], (src) => {
				setupScript(src, {typeCheck: false}); // assert does not throw
			});
		});
		test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
			xjs.Array.forEachAggregated([`{
				val i: int = 42;
				for i: bool in [false, true] do {
					null;
				};
			}`, `{
				type FOO = float;
				for FOO: bool in [false, true] do {
					null;
				};
			}`, `{
				for it: float in [1.1, 2.2, 3.3] do {
					for it: bool in [false, true] do {
						null;
					};
				};
			}`, `{
				val mut x: int = 42;
				if true then {
					for x: bool in [false, true] do {
						null;
					};
				};
			}`, `{
				val mut x: int = 42;
				while false do {
					for x: bool in [false, true] do {
						null;
					};
				};
			}`, `{
				val mut x: int = 42;
				for it: float in [1.1, 2.2, 3.3] do {
					for x: bool in [false, true] do {
						null;
					};
				};
			}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
		});
	});
});
