import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	type Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	TYPE,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	MutabilityError01,
} from '../../../src/index.js';
import {assertAssignable} from '../../assert-helpers.ts';
import {setupScript} from '../../helpers.js';
import {extract_lines} from '../../utils.ts';



test.suite('ASTNodeStatement', () => {
	test.suite('#varCheck', () => {
		test.suite('ASTNodeStatementReassignment', () => {
			test.test('throws if the variable is read-only.', () => {
				AST.ASTNodeGoal.fromSource(`{
					val mut i: int = 42;
					set i = 43;
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					val i: int = 42;
					set i = 43;
				}`).varCheck(), AssignmentErrorReassignment);
			});
			test.test('always throws for type alias reassignment.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = 42;
					set T = 43;
				}`).varCheck(), ReferenceErrorKind);
			});
			test.test('disallows manual reassignment of the iteration variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: int in [11, 22, 33] do {
						set it = 44;
					};
				}`).varCheck(), AssignmentErrorReassignment);
			});
		});

		test.suite('ASTNodeStatementIteration', () => {
			test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything` and a preset null `value` value.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3] do {
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
					isWritable:      false,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
					value:           null,
				});
			});
			test.test('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					for _: float in [1.1, 2.2, 3.3] do {
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
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
				}`).varCheck(); // assert does not throw
			});
			test.test('allows duplicate declaration in nested scopes (not technically shadowing).', () => {
				AST.ASTNodeGoal.fromSource(`{
					for it: int in [11, 22, 33] do {
						42;
					};
					if true then {
						for it: float in [1.1, 2.2, 3.3] do {
							42;
						};
					};
				}`).varCheck(); // assert does not throw
				AST.ASTNodeGoal.fromSource(`{
					for it: int in [11, 22, 33] do {
						42;
					};
					while false do {
						for it: float in [1.1, 2.2, 3.3] do {
							42;
						};
					};
				}`).varCheck(); // assert does not throw
				AST.ASTNodeGoal.fromSource(`{
					for it: int in [11, 22, 33] do {
						42;
					};
					for b: bool in [false, true] do {
						for it: float in [1.1, 2.2, 3.3] do {
							42;
						};
					};
				}`).varCheck(); // assert does not throw
			});
			test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					val i: int = 42;
					for i: bool in [false, true] do {
						null;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type FOO = float;
					for FOO: bool in [false, true] do {
						null;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3] do {
						for it: bool in [false, true] do {
							null;
						};
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					val mut x: int = 42;
					if true then {
						for x: bool in [false, true] do {
							null;
						};
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					val mut x: int = 42;
					while false do {
						for x: bool in [false, true] do {
							null;
						};
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					val mut x: int = 42;
					for it: float in [1.1, 2.2, 3.3] do {
						for x: bool in [false, true] do {
							null;
						};
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
		});
	});


	test.suite('#typeCheck', () => {
		test.suite('ASTNodeStatementClaim', () => {
			test.suite('for variables.', () => {
				test.test('allows claimed type to be a subtype of assignee type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						claim x: int;
						claim x: float;
					`, (stmt) => {
						setupScript(`{
							val mut x: int | float = 4.2;
							${ stmt }
						}`, {lower: false}); // assert does not throw
					});
				});
				test.test('throws when the claimed type is not a subtype of the assignee type (including int and float).', () => {
					xjs.Array.forEachAggregated([`{
						val x: int = 3;
						claim x: str; % disjoint
					}`, `{
						val x: int = 3;
						claim x: float; % disjoint
					}`, `{
						val x: float = 3.0;
						claim x: int; % disjoint
					}`, `{
						val x: 42 | 43 | 44 = 42;
						claim x: 43 | 44 | 45; % overlapping
					}`, `{
						val x: int | float = 42;
						claim x: int | float | str; % supertype
					}`, `{
						val x: int | float = 42;
						claim x: anything; % supertype
					}`], (src) => {
						const {stmts} = setupScript(src, {typeCheck: false});
						stmts[0].typeCheck(); // assert does not throw
						return assert.throws(() => stmts[1].typeCheck(), TypeErrorNotNarrow);
					});
				});
				test.test('accessing variable after claim is narrowed.', () => {
					const {stmts} = setupScript(`{
						val mut x: int | float = 4.2;
						x;            % type \`int | float\`
						claim x: int;
						x;            % type \`int\`
					}`, {lower: false});
					return assert.deepStrictEqual(
						[stmts[1], stmts[3]].map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
						[TYPE.INT.union(TYPE.FLOAT), TYPE.INT],
					);
				});
				test.test('allows claim after reassignment.', () => {
					setupScript(`{
						val mut x: bool | null = false;
						set x = true;
						claim x: null;
					}`, {lower: false}); // assert does not throw
				});
				test.test('allows reassigning correct type after claim.', () => {
					setupScript(`{
						val mut x: bool | null = false;
						claim x: bool;
						set x = true;
					}`, {lower: false}); // assert does not throw
				});
				test.test('disallows reassigning incorrect type after claim.', () => {
					const {stmts} = setupScript(`{
						val mut x: bool | null = false;
						claim x: bool;
						set x = null;
					}`, {typeCheck: false});
					stmts[0].typeCheck(); // assert does not throw
					stmts[1].typeCheck(); // assert does not throw
					return assert.throws(() => stmts[2].typeCheck(), TypeErrorNotAssignable);
				});
			});
			test.suite('for accesses.', () => {
				test.test('allows claiming access of compound types.', () => {
					setupScript(`{
						val mut tuple: (int | null, (value: int | null)) = (null, (value= 42));
						claim tuple.0:       int;
						claim tuple.1.value: null;

						%% TODO: uncomment these
						val mut list: [int | float] = [2.718, 6.283];
						claim list.[0]: float;
						claim list.[1]: float;

						val mut dict: [: int | float] = [e= 2.718, tau= 6.283];
						claim dict.[@e]:   float;
						claim dict.[@tau]: float;

						val mut 'set': {int | float} = {2.718, 6.283};
						claim 'set'.[2.718]: true;
						claim 'set'.[6.283]: true;

						val mut map: {str -> int | float} = {"e" -> 2.718, "tau" -> 6.283};
						claim map.["e"]:   float;
						claim map.["tau"]: float;
						%%
					}`, {lower: false}); // assert does not throw
				});
				test.test('accessing property after claim is narrowed.', () => {
					const {stmts} = setupScript(`{
						val mut record: (value: int | null, tuple: (int | null,)) = (value= null, tuple= (42,));
						record.value;               % type \`int | null\`
						record.tuple.0;             % type \`int | null\`
						claim record.value:   null;
						claim record.tuple.0: int;
						record.value;               % type \`null\`
						record.tuple.0;             % type \`int\`
					}`, {lower: false});
					const INT_NULL: TYPE.Type = TYPE.INT.union(TYPE.NULL);
					return assert.deepStrictEqual(
						[...stmts.slice(1, 3), ...stmts.slice(5, 7)].map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
						[INT_NULL, INT_NULL, TYPE.NULL, TYPE.INT],
					);
				});
				test.test('allows claim after mutation.', () => {
					xjs.Array.forEachAggregated([`{
						val mut record: (value: int | null, tuple: (int | null,)) = (value= null, tuple= (42,));
						set record = (value= 43, tuple= (null,));
						claim record.value:   null;
						claim record.tuple.0: int;
					}`, `{
						val mut list: mut [int | float] = [2.718, 6.283];
						set list.[0] = 1.618;
						claim list.[0]: int;
					}`], (src, i) => {
						i === 0 && setupScript(src, {lower: false}); // assert does not throw
						i === 1 && assert.throws(() => setupScript(src, {lower: false}), /not yet supported/);
					});
				});
				test.test('allows mutating correct type after claim.', () => {
					xjs.Array.forEachAggregated([`{
						val mut record: (value: int | null, tuple: (int | null,)) = (value= null, tuple= (42,));
						claim record.value:   int;
						claim record.tuple.0: null;
						set record = (value= 43, tuple= (null,));
					}`, `{
						val mut list: mut [int | float] = [2.718, 6.283];
						claim list.[0]: float;
						set list.[0] = 1.618;
					}`], (src, i) => {
						i === 0 && setupScript(src, {lower: false}); // assert does not throw
						i === 1 && assert.throws(() => setupScript(src, {lower: false}), /not yet supported/);
					});
				});
				test.test('disallows mutating incorrect type after claim.', () => {
					xjs.Array.forEachAggregated([`{
						val mut record: (value: int | null, tuple: (int | null,)) = (value= null, tuple= (42,));
						claim record.value:   int;
						claim record.tuple.0: null;
						set record = (value= null, tuple= (42,));
					}`, `{
						val mut list: mut [int | float] = [2.718, 6.283];
						claim list.[0]: float;
						set list.[0] = 42;
					}`], (src, i) => {
						const {stmts} = setupScript(src, {typeCheck: false});
						if (i === 0) {
							xjs.Array.forEachAggregated(stmts.slice(0, -1), (stmt) => stmt.typeCheck()); // assert does not throw
							return assert.throws(() => stmts.at(-1)!.typeCheck(), (err) => {
								assertAssignable(err as Error, {
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression `null` is not assignable to type `int`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression `42` is not assignable to type `null`.'},
									],
								});
								return true;
							});
						} else {
							stmts[0].typeCheck(); // assert does not throw
							assert.throws(() => stmts[1].typeCheck(), /not yet supported/);
						}
					});
				});
			});
		});

		test.suite('ASTNodeStatementReassignment', () => {
			test.suite('for variable reassignment.', () => {
				test.test('throws when variable assignee type is not supertype.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
						val mut i: int = 42;
						set i = 4.3;
					}`);
					goal.varCheck();
					assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
				test.test('allows reassignment when uninitialized.', () => {
					assert.partialDeepStrictEqual(setupScript(`{
						val mut x?: int;
						set x = 42;
					}`, {lower: false}).goal.block!.validator.getSymbol(0x100n), {
						isWritable:      true,
						isUninitialized: true,
						type:            TYPE.INT,
						value:           null,
					});
				});
				test.test('does not allow reassignment of `null` when uninitialized.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
						val mut x?: int;
						set x = null;
					}`);
					goal.varCheck();
					assert.partialDeepStrictEqual(goal.block!.validator.getSymbol(0x100n), {
						isWritable:      true,
						isUninitialized: true,
					});
					return assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
			});
			test.suite('for property reassignment.', () => {
				test.test('allows assignment directly on objects.', () => {
					setupScript(`{
						set List.<int>((42,)).[0]                 = 42;
						set Dict.<int>((i= 42)).[@i]              = 42;
						set Set.<int>((42,)).[43]                 = false;
						set Map.<bool, int>(((true, 42),)).[true] = 42;
					}`, {lower: false}); // assert does not throw
				});
				test.test('widens assignee write type for collection literals.', () => { // TODO: use NodeJS v25.5 `test.expectFailure()`
					const {goal} = setupScript(`{
						set [1.01].[1]                      = 1.02;  %> TypeErrorNotAssignable
						set [i= 2.03].[@j]                  = 2.04;  %> TypeErrorNotAssignable
						set {3.05}.[3.05]                   = false; %  no error
						set {4.07 -> @a, 4.08 -> @b}.[4.07] = @c;    %> TypeErrorNotAssignable
						set {3.05}.[3.06]                   = true;  %> TypeErrorNotNarrow
						set {4.07 -> @a, 4.08 -> @b}.[4.09] = @a;    %> TypeErrorNotNarrow
					}`, {typeCheck: false});
					return assert.throws(() => goal.typeCheck(), (err) => {
						assertAssignable(err as Error, {
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorNotAssignable, message: 'Expression `1.02` is not assignable to type `1.01`.'},
								{cons: TypeErrorNotAssignable, message: 'Expression `2.04` is not assignable to type `2.03`.'},
								{cons: TypeErrorNotAssignable, message: 'Expression `@c` is not assignable to type `@a | @b`.'},
								{cons: TypeErrorNotNarrow,     message: 'Type `3.06` is not a subtype of type `3.05`.'},
								{cons: TypeErrorNotNarrow,     message: 'Type `4.09` is not a subtype of type `4.07 | 4.08`.'},
							],
						});
						return true;
					});
				});
				test.test('throws when property assignee type is not supertype.', () => {
					[
						`{
							val l: mut [int] = [42];
							set l.[0] = 4.2;
						}`,
						`{
							val d: mut [:int] = [i= 42];
							set d.[@i] = 4.2;
						}`,
						`{
							val s: mut {int} = {42};
							set s.[42] = 4.2;
						}`,
						`{
							val m: mut {bool -> int} = {true -> 42};
							set m.[true] = 4.2;
						}`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
					});
				});
				test.test('throws when Set/Map accessor expression is not a valid type.', () => {
					xjs.Array.forEachAggregated([`{
						val s: mut {int} = {42};
						set s.[4.3] = true;
					}`, `{
						val m: mut {bool -> int} = {true -> 42};
						set m.["true"] = 43;
					}`], (src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotNarrow);
					});
				});
				test.test('throws when assignee’s base type is not mutable.', () => {
					[
						`{
							val t: (int,) = (42,);
							set t.0 = 43;
						}`,
						`{
							val r: (i: int) = (i= 42);
							set r.i = 43;
						}`,
						`{
							val l: [int] = [42];
							set l.[0] = 43;
						}`,
						`{
							val d: [:int] = [i= 42];
							set d.[@i] = 43;
						}`,
						`{
							val s: {int} = {42};
							set s.[43] = true;
						}`,
						`{
							val m: {bool -> int} = {true -> 42};
							set m.[true] = 43;
						}`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), MutabilityError01);
					});
				});
			});
		});

		test.suite('ASTNodeStatementConditional', () => {
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
					}`, {lower: false}); // assert does not throw
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

		test.suite('ASTNodeStatementLoop', () => {
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
						while ${ decl_set === NON_BOOLS ? '!!' : '' }cond do { "consequent"; };
						until ${ decl_set === NON_BOOLS ? '!!' : '' }cond do { "consequent"; };
					}`, {lower: false}); // assert does not throw
				}));
			});
			test.test('throws when condition is not subtype of Boolean.', () => {
				xjs.Array.forEachAggregated(NON_BOOLS, (decl) => {
					const {stmts} = setupScript(`{
						${ decl }
						while cond do { "consequent"; };
						until cond do { "consequent"; };
					}`, {typeCheck: false});
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
						for it: ${ vartype } in ["hello", "world"] do {
							val greeting: ${ vartype } = it;
						};
					}`, {lower: false}); // assert does not throw
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
						for it: str in ${ collection } do {
							;
						};
					}`, {typeCheck: false});
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
						for it: ${ vartype } in ["hello", "world"] do {
							;
						};
					}`, {typeCheck: false});
					return assert.throws(() => stmts[0].typeCheck(), TypeErrorNotNarrow);
				});
			});
			test.test('throws when block type-checking fails.', () => {
				const {stmts} = setupScript(`{
					for it: str in ["hello", "world"] do {
						42 + it; %> TypeErrorInvalidOperation
					};
				}`, {typeCheck: false});
				assert.throws(() => (stmts[0] as AST.ASTNodeStatementIteration).block.children[0].typeCheck(), TypeErrorInvalidOperation);
				return assert.throws(() => stmts[0].typeCheck(), TypeErrorInvalidOperation);
			});
		});
	});


	test.suite('#lower', () => {
		test.test('AST.StatementExpression pushes DROP instruction if expression exists.', () => {
			const {stmts, opt} = setupScript(`{
				val mut x: int = 42;
				x;
				42;
				;
			}`, {lower: false});
			assert.strictEqual(opt.instructions.length, 0);
			(stmts[1] as AST.ASTNodeStatementExpression).lower(opt);
			assert.strictEqual(opt.instructions.length, 1);
			(stmts[2] as AST.ASTNodeStatementExpression).lower(opt);
			assert.strictEqual(opt.instructions.length, 2);
			(stmts[3] as AST.ASTNodeStatementExpression).lower(opt);
			assert.strictEqual(opt.instructions.length, 2);
			return assert.strictEqual(opt.print(), extract_lines`
				(DROP (GET x))
				(DROP (INT.CONST 42))
			`.join('\n'));
		});

		test.test('AST.StatementClaim pushes DROP.', () => {
			const {stmts, opt} = setupScript(`{%
				val mut x: int | float = 42;
				claim x: int;
			}`, {lower: false});
			(stmts[1] as AST.ASTNodeStatementClaim).lower(opt);
			return assert.strictEqual(opt.print(), extract_lines`
				(DROP (GET x))
			`.join('\n'));
		});

		test.suite('AST.StatementReassignment', () => {
			test.test('for variables: pushes SET instruction.', () => {
				const {stmts, opt} = setupScript(`{
					val mut x: int = 42;
					set x = 43;
					set x = 44;
					set x = -42;
				}`, {lower: false});
				stmts.slice(1).forEach((stmt) => (stmt as AST.ASTNodeStatementReassignment).lower(opt));
				return assert.strictEqual(opt.print(), extract_lines`
					(SET x (INT.CONST 43))
					(SET x (INT.CONST 44))
					(SET x (INT.CONST -42))
				`.join('\n'));
			});
			test.test('for collections: pushes IR.CollectionDynamicSet.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list: mut [int]        = [41, 42];
					val mut my_dict: mut [:int]       = [a= 41, b= 42];
					val mut my_set:  mut {int}        = {41 + 1, 42 / 2, 43 ^ 3};
					val mut my_map:  mut {int -> int} = {21 -> 41, 22 -> 42, 23 -> 43};

					val mut accessor: int = 22;
					set my_list.[0 + 1]   = 84;
					set my_dict.[@b]      = 84;
					set my_set.[accessor] = true;
					set my_map.[accessor] = 84;
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <List> my_list (LIST.NEW (INT.CONST 41) (INT.CONST 42)))
					(DECL <Dict> my_dict (DICT.NEW @a->(INT.CONST 41) @b->(INT.CONST 42)))
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
					(DECL <Set> my_set (SET.NEW (GET $0) (GET $1) (GET $2)))
					(DECL <Map> my_map (MAP.NEW (INT.CONST 21)->(INT.CONST 41) (INT.CONST 22)->(INT.CONST 42) (INT.CONST 23)->(INT.CONST 43)))
					(DECL <int> accessor (INT.CONST 22))
					(DECL <int> $3 (INT.ADD (INT.CONST 0) (INT.CONST 1)))
					(LIST.SET (GET my_list) (GET $3) (INT.CONST 84))
					(DICT.SET (GET my_dict) (SYM.CONST @b) (INT.CONST 84))
					(SET.SET (GET my_set) (GET accessor) (BOOL.CONST true))
					(MAP.SET (GET my_map) (GET accessor) (INT.CONST 84))
				`.join('\n'));
			});
		});

		test.suite('AST.StatementConditional', () => {
			test.test('pushes an if_false block.', () => {
				assert.strictEqual(setupScript(`{
					if true then {
						(2 * 1 + 0);
						2.2;
					} else {
						(6 / (1 + 1));
						3.3;
					};
				}`, {codegen: false}).opt.print(), extract_lines`
					if_false (BOOL.CONST true), goto "block-1".
					"block-0":
					(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
					(DROP (INT.ADD (GET $0) (INT.CONST 0)))
					(DROP (FLOAT.CONST 2.2))
					goto "block-2".
					"block-1":
					(DECL <int> $1 (INT.ADD (INT.CONST 1) (INT.CONST 1)))
					(DROP (INT.DIV (INT.CONST 6) (GET $1)))
					(DROP (FLOAT.CONST 3.3))
					"block-2":
				`.join('\n'));
			});
			test.test('with no alternative.', () => {
				assert.strictEqual(setupScript(`{
					if false then {
						(2 * 1 + 0);
						2.2;
					};
				}`, {codegen: false}).opt.print(), extract_lines`
					if_false (BOOL.CONST false), goto "block-2".
					"block-0":
					(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
					(DROP (INT.ADD (GET $0) (INT.CONST 0)))
					(DROP (FLOAT.CONST 2.2))
					"block-2":
				`.join('\n'));
			});
			test.test('negates the condition for `unless` statements.', () => {
				assert.strictEqual(setupScript(`{
					unless false then {
						(2 * 1 + 0);
						2.2;
					};
				}`, {codegen: false}).opt.print(), extract_lines`
					if_false (NOT (BOOL.CONST false)), goto "block-2".
					"block-0":
					(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
					(DROP (INT.ADD (GET $0) (INT.CONST 0)))
					(DROP (FLOAT.CONST 2.2))
					"block-2":
				`.join('\n'));
			});
			test.test('SSA.', () => {
				assert.strictEqual(setupScript(`{
					val mut unknown_cond: bool = false;
					val mut x: int = 42;
					if unknown_cond then {
						set x = x * (1 + 1);
						val y: float = 2.2;
					} else {
						set x = x - (6 / 2);
						val y: float = 3.3;
					};
					x;
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <bool> unknown_cond (BOOL.CONST false))
					(DECL <int> x (INT.CONST 42))
					if_false (GET unknown_cond), goto "block-1".
					"block-0":
					(DECL <int> $0 (INT.ADD (INT.CONST 1) (INT.CONST 1)))
					(SET x (INT.MUL (GET x) (GET $0)))
					(DECL <float> y (FLOAT.CONST 2.2))
					goto "block-2".
					"block-1":
					(DECL <int> $1 (INT.DIV (INT.CONST 6) (INT.CONST 2)))
					(SET x (INT.SUB (GET x) (GET $1)))
					(DECL <float> y (FLOAT.CONST 3.3))
					"block-2":
					(DROP (GET x))
				`.join('\n'));
			});
			test.test('if–else chains.', () => {
				assert.strictEqual(setupScript(`{
					val mut cond?: bool;
					set cond = true;
					if cond == true then {
						10;
					} else if cond == false then {
						20;
					} else {
						30;
					};
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <null> cond (NULL.CONST null))
					(SET cond (BOOL.CONST true))
					if_false (EQ (GET cond) (BOOL.CONST true)), goto "block-1".
					"block-0":
					(DROP (INT.CONST 10))
					goto "block-2".
					"block-1":
					if_false (EQ (GET cond) (BOOL.CONST false)), goto "block-4".
					"block-3":
					(DROP (INT.CONST 20))
					goto "block-5".
					"block-4":
					(DROP (INT.CONST 30))
					"block-5":
					"block-2":
				`.join('\n'));
			});
		});

		test.suite('StatementLoop', () => {
			test.test('pushes an if_false block.', () => {
				assert.strictEqual(setupScript(`{
					val mut cond: bool = false;
					while cond do {
						42;
						4.2;
					};
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <bool> cond (BOOL.CONST false))
					"block-0":
					if_false (GET cond), goto "block-1".
					(DROP (INT.CONST 42))
					(DROP (FLOAT.CONST 4.2))
					goto "block-0".
					"block-1":
				`.join('\n'));
			});
			test.test('negates the condition for `until` statements.', () => {
				assert.strictEqual(setupScript(`{
					val mut cond: bool = false;
					until cond do {
						42;
					};
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <bool> cond (BOOL.CONST false))
					"block-0":
					if_false (NOT (GET cond)), goto "block-1".
					(DROP (INT.CONST 42))
					goto "block-0".
					"block-1":
				`.join('\n'));
			});
			test.test('bottom-tested conditions.', () => {
				assert.strictEqual(setupScript(`{
					val mut cond: bool = false;
					do {
						42;
						4.2;
					} while cond;
					do {
						42;
					} until cond;
				}`, {codegen: false}).opt.print(), extract_lines`
					(DECL <bool> cond (BOOL.CONST false))
					"block-0":
					(DROP (INT.CONST 42))
					(DROP (FLOAT.CONST 4.2))
					if_false (GET cond), goto "block-1".
					goto "block-0".
					"block-1":
					"block-2":
					(DROP (INT.CONST 42))
					if_false (NOT (GET cond)), goto "block-3".
					goto "block-2".
					"block-3":
				`.join('\n'));
			});
		});

		test.test('StatementIteration', () => {
			assert.strictEqual(setupScript(`{
				for item: int in [10, 20, 30] do {
					item + 5;
				};
				for _: float in [4.4, 5.5, 6.6] do {
					null;
				};
			}`, {codegen: false}).opt.print(), extract_lines`
				(DECL <List> $0 (LIST.NEW (INT.CONST 10) (INT.CONST 20) (INT.CONST 30)))
				(DECL <nat> $1 (NAT.CONST +0))
				"block-0":
				if_false (LT (GET $1) (LIST.COUNT (GET $0))), goto "block-1".
				(DECL <int> item (LIST.GET (GET $0) (GET $1)))
				(DROP (INT.ADD (GET item) (INT.CONST 5)))
				(SET $1 (NAT.ADD (GET $1) (NAT.CONST +1)))
				goto "block-0".
				"block-1":
				(DECL <List> $2 (LIST.NEW (FLOAT.CONST 4.4) (FLOAT.CONST 5.5) (FLOAT.CONST 6.6)))
				(DECL <nat> $3 (NAT.CONST +0))
				"block-2":
				if_false (LT (GET $3) (LIST.COUNT (GET $2))), goto "block-3".
				(DROP (NULL.CONST null))
				(SET $3 (NAT.ADD (GET $3) (NAT.CONST +1)))
				goto "block-2".
				"block-3":
			`.join('\n'));
		});

		test.suite('StatementBreak', () => {
			test.test('[skip=false] returns IR.Goto("endwhile"). [skip=true] returns IR.Goto("while").', () => {
				assert.strictEqual(setupScript(`{
					while true do {
						41;
						break;
						42;
						skip;
						43;
					};
					for word: str in ["alpha", "beta", "gamma"] do {
						10;
						skip;
						20;
						break;
						30;
					};
				}`, {codegen: false}).opt.print(), extract_lines`
					"block-0":
					if_false (BOOL.CONST true), goto "block-1".
					(DROP (INT.CONST 41))
					goto "block-1".
					(DROP (INT.CONST 42))
					goto "block-0".
					(DROP (INT.CONST 43))
					goto "block-0".
					"block-1":
					(DECL <List> $0 (LIST.NEW (STR.CONST "alpha") (STR.CONST "beta") (STR.CONST "gamma")))
					(DECL <nat> $1 (NAT.CONST +0))
					"block-2":
					if_false (LT (GET $1) (LIST.COUNT (GET $0))), goto "block-3".
					(DECL <str> word (LIST.GET (GET $0) (GET $1)))
					(DROP (INT.CONST 10))
					goto "block-2".
					(DROP (INT.CONST 20))
					goto "block-3".
					(DROP (INT.CONST 30))
					(SET $1 (NAT.ADD (GET $1) (NAT.CONST +1)))
					goto "block-2".
					"block-3":
				`.join('\n'));
			});
			test.test('nested loops.', () => {
				assert.strictEqual(setupScript(`{
					while true do {
						10;
						break;
						20;
						if true then {
							30;
							while true do {
								40;
								skip;
								50;
							};
							60;
						};
						70;
					};
				}`, {codegen: false}).opt.print(), extract_lines`
					"block-0":
					if_false (BOOL.CONST true), goto "block-1".
					(DROP (INT.CONST 10))
					goto "block-1".
					(DROP (INT.CONST 20))
					if_false (BOOL.CONST true), goto "block-4".
					"block-2":
					(DROP (INT.CONST 30))
					"block-5":
					if_false (BOOL.CONST true), goto "block-6".
					(DROP (INT.CONST 40))
					goto "block-5".
					(DROP (INT.CONST 50))
					goto "block-5".
					"block-6":
					(DROP (INT.CONST 60))
					"block-4":
					(DROP (INT.CONST 70))
					goto "block-0".
					"block-1":
				`.join('\n'));
			});
		});
	});
});
