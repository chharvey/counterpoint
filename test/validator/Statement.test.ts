import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	TYPE,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	AssignmentErrorDeletion,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	MutabilityError01,
} from '../../src/index.ts';
import {
	extract_lines,
	assertAssignable,
	setupScript,
} from '../utils.ts';



test.suite('Statement', () => {
	test.suite('#varCheck', () => {
		test.suite('StatementReassignment', () => {
			test.test('does not throw if the variable is writable.', () => {
				const {goal} = setupScript(`{
					val mut i: int = 42;
					set i = 43;
				}`, {typeCheck: false}); // assert does not throw
				return assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('i'), {
					isWritable:      true,
					isUninitialized: false,
				});
			});
			test.test('throws if the variable is read-only.', () => {
				assert.throws(() => setupScript(`{
					val i: int = 42;
					set i = 43;
				}`, {typeCheck: false}), AssignmentErrorReassignment);
			});
			test.test('always throws for type alias reassignment.', () => {
				assert.throws(() => setupScript(`{
					type T = 42;
					set T = 43;
				}`, {typeCheck: false}), ReferenceErrorKind);
			});
			test.test('disallows manual reassignment of the iteration variable.', () => {
				assert.throws(() => setupScript(`{
					for it: int in [11, 22, 33] do {
						set it = 44;
					};
				}`, {typeCheck: false}), AssignmentErrorReassignment);
			});
			test.test('does not throw if the variable was uninitialized.', () => {
				const {goal} = setupScript(`{
					val mut i?: int;
					delete i;
				}`, {typeCheck: false}); // assert does not throw
				return assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('i'), {
					isWritable:      true,
					isUninitialized: true,
				});
			});
			test.test('throws if the variable was initialized.', () => {
				assert.throws(() => setupScript(`{
					val mut i: int = 42;
					delete i;
				}`, {typeCheck: false}), AssignmentErrorDeletion);
				assert.throws(() => setupScript(`{
					val i: int = 42;
					delete i;
				}`, {typeCheck: false}), AssignmentErrorDeletion);
			});
			test.test('always throws for type alias deletion.', () => {
				assert.throws(() => setupScript(`{
					type T = 42;
					delete T;
				}`, {typeCheck: false}), ReferenceErrorKind);
			});
			test.test('disallows deletion of the iteration variable.', () => {
				assert.throws(() => setupScript(`{
					for it: int in [11, 22, 33] do {
						delete it;
					};
				}`, {typeCheck: false}), AssignmentErrorDeletion);
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
				const id: bigint = Validator.cookTokenIdentifier('it');
				assert.ok(!validator.hasSymbol(id));
				goal.varCheck();
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
				const id: bigint = Validator.cookTokenIdentifier('_');
				assert.ok(!validator.hasSymbol(id));
				goal.varCheck();
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


	test.suite('#typeCheck', () => {
		test.suite('StatementClaim', () => {
			test.suite('for variables.', () => {
				test.test('allows claimed type to be a subtype of assignee type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						claim x: int;
						claim x: float;
					`, (stmt) => {
						setupScript(`{
							val mut x: int | float = 4.2;
							${ stmt }
						}`, {build: false}); // assert does not throw
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
					}`, {build: false});
					return assert.deepStrictEqual(
						[stmts[1], stmts[3]].map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
						[TYPE.INT.union(TYPE.FLOAT), TYPE.INT],
					);
				});
				test.test('allows claim after reassignment.', () => {
					setupScript(`{
						val mut x: bool | null = false;
						set x = true;
						claim x: null;
					}`, {build: false}); // assert does not throw
				});
				test.test('allows reassigning correct type after claim.', () => {
					setupScript(`{
						val mut x: bool | null = false;
						claim x: bool;
						set x = true;
					}`, {build: false}); // assert does not throw
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
					}`, {build: false}); // assert does not throw
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
					}`, {build: false});
					const INT_NULL: TYPE.Type = TYPE.INT.union(TYPE.NULL);
					return assert.deepStrictEqual(
						[...stmts.slice(1, 3), ...stmts.slice(5, 7)].map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
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
						i === 0 && setupScript(src, {build: false}); // assert does not throw
						i === 1 && assert.throws(() => setupScript(src, {build: false}), /not yet supported/);
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
						i === 0 && setupScript(src, {build: false}); // assert does not throw
						i === 1 && assert.throws(() => setupScript(src, {build: false}), /not yet supported/);
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

		test.suite('StatementReassignment', () => {
			test.suite('for variable reassignment.', () => {
				test.test('throws when variable assignee type is not supertype.', () => {
					const {goal} = setupScript(`{
						val mut i: int = 42;
						set i = 4.3;
					}`, {typeCheck: false});
					assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
				test.test('allows reassignment when uninitialized.', () => {
					assert.partialDeepStrictEqual(setupScript(`{
						val mut x?: int;
						set x = 42;
					}`, {build: false}).goal.block!.validator.getSymbolBySource('x'), {
						isWritable:      true,
						isUninitialized: true,
						type:            TYPE.INT,
					});
				});
				test.test('does not allow reassignment of `null` when uninitialized.', () => {
					const {goal} = setupScript(`{
						val mut x?: int;
						set x = null;
					}`, {typeCheck: false});
					assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('x'), {
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
					}`, {build: false}); // assert does not throw
				});
				test.test('widens assignee write type for collection literals.', {expectFailure: true}, () => {
					setupScript(`{
						set [1.01].[1]                      = 1.02;
						set [i= 2.03].[@j]                  = 2.04;
						set {3.05}.[3.05]                   = false;
						set {4.07 -> @a, 4.08 -> @b}.[4.07] = @c;
						set {3.05}.[3.06]                   = true;
						set {4.07 -> @a, 4.08 -> @b}.[4.09] = @a;
					}`, {build: false}); // assert does not throw
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
						const {goal} = setupScript(src, {typeCheck: false});
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
						const {goal} = setupScript(src, {typeCheck: false});
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
						const {goal} = setupScript(src, {typeCheck: false});
						assert.throws(() => goal.typeCheck(), MutabilityError01);
					});
				});
			});
			test.suite('for property deletion.', () => {
				test.test('throws for deletion on non-interface objects.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						List.<int>((42,)).[0]
						Dict.<int>((i= 42)).[@i]
						Set.<int>((42,)).[43]
						Map.<bool, int>(((true, 42),)).[true]
					`, (src) => {
						const {goal} = setupScript(`{ delete ${ src }; }`, {typeCheck: false});
						assert.throws(() => goal.typeCheck(), /only applicable to interface types/);
					});
				});
				test.test('throws when assignee’s base type is not mutable.', {expectFailure: true}, () => {
					const {stmts} = setupScript(`{
						claim p: interface {
							readonly x: int;
							y: int;
							z?: int;
						};
						delete p.x;
						delete p.y;
						delete p.z;
					}`, {typeCheck: false});
					stmts[0].typeCheck();
					assert.throws(() => stmts[1].typeCheck(), MutabilityError01);
					assert.throws(() => stmts[2].typeCheck(), MutabilityError01);
					assert.throws(() => stmts[3].typeCheck(), MutabilityError01);
				});
				test.test('throws when assignee’s property is read-only or non-optional.', {expectFailure: true}, () => {
					const {stmts} = setupScript(`{
						claim p: mut interface {
							readonly x: int;
							y: int | null;
							z?: int;
						};
						delete p.x; % cannot delete a read-only property
						delete p.y; % cannot delete a non-optional property (even if type is nullish)
						delete p.z; % allowed
					}`, {typeCheck: false});
					stmts[0].typeCheck();
					assert.throws(() => stmts[1].typeCheck(), MutabilityError01);
					assert.throws(() => stmts[2].typeCheck(), MutabilityError01);
					stmts[3].typeCheck();
				});
			});
		});

		test.suite('StatementConditional', () => {
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

		test.suite('StatementLoop', () => {
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
					}`, {build: false}); // assert does not throw
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

		test.suite('StatementIteration', () => {
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
					}`, {build: false}); // assert does not throw
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
				assert.throws(() => (stmts[0] as AST.STMT.StatementIteration).block.children[0].typeCheck(), TypeErrorInvalidOperation);
				return assert.throws(() => stmts[0].typeCheck(), TypeErrorInvalidOperation);
			});
		});
	});


	test.suite('#build', () => {
		test.test('StatementExpression pushes OP.Drop instruction if expression exists.', () => {
			const {stmts, builder} = setupScript(`{
				val mut x: int = 42;
				x;
				42;
				;
			}`, {build: false});
			assert.strictEqual(builder.instructions.length, 0);
			(stmts[1] as AST.STMT.StatementExpression).build(builder);
			assert.strictEqual(builder.instructions.length, 1);
			(stmts[2] as AST.STMT.StatementExpression).build(builder);
			assert.strictEqual(builder.instructions.length, 2);
			(stmts[3] as AST.STMT.StatementExpression).build(builder);
			assert.strictEqual(builder.instructions.length, 2);
			return assert.strictEqual(builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (GET x))
					(DROP (INT.CONST 42))
			`.trim());
		});

		test.test('StatementClaim pushes OP.Drop.', () => {
			const {stmts, builder} = setupScript(`{%
				val mut x: int | float = 42;
				claim x: int;
			}`, {build: false});
			(stmts[1] as AST.STMT.StatementClaim).build(builder);
			return assert.strictEqual(builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (GET x))
			`.trim());
		});

		test.suite('StatementReassignment', () => {
			test.test('for variables: pushes OP.Set instruction.', () => {
				const {stmts, builder} = setupScript(`{
					val mut x: int = 42;
					set x = 43;
					set x = 44;
					set x = -42;
				}`, {build: false});
				stmts.slice(1).forEach((stmt) => (stmt as AST.STMT.StatementReassignment).build(builder));
				return assert.strictEqual(builder.print(), xjs.String.dedent`
					"block-0":
						(SET x (INT.CONST 43))
						(SET x (INT.CONST 44))
						(SET x (INT.CONST -42))
				`.trim());
			});
			test.test('deletion: pushes OP.Set instruction.', () => {
				const {stmts, builder} = setupScript(`{
					val mut x?: int;
					delete x;
				}`, {build: false});
				(stmts[1] as AST.STMT.StatementReassignment).build(builder);
				return assert.strictEqual(builder.print(), xjs.String.dedent`
					"block-0":
						(SET x)
				`.trim());
			});
			test.test('for collections: pushes OP.CollectionDynamicSet.', () => {
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
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
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
						(ENDPROGRAM)
				`.trim());
			});
		});

		test.suite('StatementConditional', () => {
			test.test('pushes OP.GotoConditional.', () => {
				assert.strictEqual(setupScript(`{
					if true then {
						(2 * 1 + 0);
						2.2;
					} else {
						(6 / (1 + 1));
						3.3;
					};
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(GOTO.IF (BOOL.CONST true) "block-1" "block-2")
					"block-1":
						(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
						(DROP (INT.ADD (GET $0) (INT.CONST 0)))
						(DROP (FLOAT.CONST 2.2))
						(GOTO "block-3")
					"block-2":
						(DECL <int> $1 (INT.ADD (INT.CONST 1) (INT.CONST 1)))
						(DROP (INT.DIV (INT.CONST 6) (GET $1)))
						(DROP (FLOAT.CONST 3.3))
						(GOTO "block-3")
					"block-3":
						(ENDPROGRAM)
				`.trim());
			});
			test.test('with no alternative.', () => {
				assert.strictEqual(setupScript(`{
					if false then {
						(2 * 1 + 0);
						2.2;
					};
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(GOTO.IF (BOOL.CONST false) "block-1" "block-2")
					"block-1":
						(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
						(DROP (INT.ADD (GET $0) (INT.CONST 0)))
						(DROP (FLOAT.CONST 2.2))
						(GOTO "block-2")
					"block-2":
						(ENDPROGRAM)
				`.trim());
			});
			test.test('negates the condition for `unless` statements.', () => {
				assert.strictEqual(setupScript(`{
					unless false then {
						(2 * 1 + 0);
						2.2;
					};
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(GOTO.IF (NOT (BOOL.CONST false)) "block-1" "block-2")
					"block-1":
						(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
						(DROP (INT.ADD (GET $0) (INT.CONST 0)))
						(DROP (FLOAT.CONST 2.2))
						(GOTO "block-2")
					"block-2":
						(ENDPROGRAM)
				`.trim());
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
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <bool> unknown_cond (BOOL.CONST false))
						(DECL <int> x (INT.CONST 42))
						(GOTO.IF (GET unknown_cond) "block-1" "block-2")
					"block-1":
						(DECL <int> $0 (INT.ADD (INT.CONST 1) (INT.CONST 1)))
						(SET x (INT.MUL (GET x) (GET $0)))
						(DECL <float> y (FLOAT.CONST 2.2))
						(GOTO "block-3")
					"block-2":
						(DECL <int> $1 (INT.DIV (INT.CONST 6) (INT.CONST 2)))
						(SET x (INT.SUB (GET x) (GET $1)))
						(DECL <float> y (FLOAT.CONST 3.3))
						(GOTO "block-3")
					"block-3":
						(DROP (GET x))
						(ENDPROGRAM)
				`.trim());
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
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <null> cond)
						(SET cond (BOOL.CONST true))
						(GOTO.IF (EQ (GET cond) (BOOL.CONST true)) "block-1" "block-2")
					"block-1":
						(DROP (INT.CONST 10))
						(GOTO "block-3")
					"block-2":
						(GOTO.IF (EQ (GET cond) (BOOL.CONST false)) "block-4" "block-5")
					"block-4":
						(DROP (INT.CONST 20))
						(GOTO "block-6")
					"block-5":
						(DROP (INT.CONST 30))
						(GOTO "block-6")
					"block-6":
						(GOTO "block-3")
					"block-3":
						(ENDPROGRAM)
				`.trim());
			});
		});

		test.suite('StatementLoop', () => {
			test.test('pushes OP.GotoConditional.', () => {
				assert.strictEqual(setupScript(`{
					val mut cond: bool = false;
					while cond do {
						42;
						4.2;
					};
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <bool> cond (BOOL.CONST false))
						(GOTO "block-1")
					"block-1":
						(GOTO.IF (GET cond) "block-2" "block-3")
					"block-2":
						(DROP (INT.CONST 42))
						(DROP (FLOAT.CONST 4.2))
						(GOTO "block-1")
					"block-3":
						(ENDPROGRAM)
				`.trim());
			});
			test.test('negates the condition for `until` statements.', () => {
				assert.strictEqual(setupScript(`{
					val mut cond: bool = false;
					until cond do {
						42;
					};
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <bool> cond (BOOL.CONST false))
						(GOTO "block-1")
					"block-1":
						(GOTO.IF (NOT (GET cond)) "block-2" "block-3")
					"block-2":
						(DROP (INT.CONST 42))
						(GOTO "block-1")
					"block-3":
						(ENDPROGRAM)
				`.trim());
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
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <bool> cond (BOOL.CONST false))
						(GOTO "block-1")
					"block-1":
						(DROP (INT.CONST 42))
						(DROP (FLOAT.CONST 4.2))
						(GOTO.IF (GET cond) "block-1" "block-2")
					"block-2":
						(GOTO "block-3")
					"block-3":
						(DROP (INT.CONST 42))
						(GOTO.IF (NOT (GET cond)) "block-3" "block-4")
					"block-4":
						(ENDPROGRAM)
				`.trim());
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
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <List> $0 (LIST.NEW (INT.CONST 10) (INT.CONST 20) (INT.CONST 30)))
					(DECL <nat> $1 (NAT.CONST +0))
					(GOTO "block-1")
				"block-1":
					(DECL <nat> $2 (LIST.COUNT (GET $0)))
					(GOTO.IF (LT (GET $1) (GET $2)) "block-2" "block-3")
				"block-2":
					(DECL <int> item (LIST.GET (GET $0) (GET $1)))
					(DROP (INT.ADD (GET item) (INT.CONST 5)))
					(SET $1 (NAT.ADD (GET $1) (NAT.CONST +1)))
					(GOTO "block-1")
				"block-3":
					(DECL <List> $3 (LIST.NEW (FLOAT.CONST 4.4) (FLOAT.CONST 5.5) (FLOAT.CONST 6.6)))
					(DECL <nat> $4 (NAT.CONST +0))
					(GOTO "block-4")
				"block-4":
					(DECL <nat> $5 (LIST.COUNT (GET $3)))
					(GOTO.IF (LT (GET $4) (GET $5)) "block-5" "block-6")
				"block-5":
					(DROP (NULL.CONST null))
					(SET $4 (NAT.ADD (GET $4) (NAT.CONST +1)))
					(GOTO "block-4")
				"block-6":
					(ENDPROGRAM)
			`.trim());
		});

		test.suite('StatementBreak', () => {
			test.test('[skip=false] returns OP.Goto("endwhile"). [skip=true] returns OP.Goto("while").', () => {
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
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(GOTO "block-1")
					"block-1":
						(GOTO.IF (BOOL.CONST true) "block-2" "block-3")
					"block-2":
						(DROP (INT.CONST 41))
						(GOTO "block-3")
					"unreachable-4":
						(DROP (INT.CONST 42))
						(GOTO "block-1")
					"unreachable-5":
						(DROP (INT.CONST 43))
						(GOTO "block-1")
					"block-3":
						(DECL <List> $0 (LIST.NEW (STR.CONST "alpha") (STR.CONST "beta") (STR.CONST "gamma")))
						(DECL <nat> $1 (NAT.CONST +0))
						(GOTO "block-6")
					"block-6":
						(DECL <nat> $2 (LIST.COUNT (GET $0)))
						(GOTO.IF (LT (GET $1) (GET $2)) "block-7" "block-8")
					"block-7":
						(DECL <str> word (LIST.GET (GET $0) (GET $1)))
						(DROP (INT.CONST 10))
						(GOTO "block-6")
					"unreachable-9":
						(DROP (INT.CONST 20))
						(GOTO "block-8")
					"unreachable-10":
						(DROP (INT.CONST 30))
						(SET $1 (NAT.ADD (GET $1) (NAT.CONST +1)))
						(GOTO "block-6")
					"block-8":
						(ENDPROGRAM)
				`.trim());
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
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(GOTO "block-1")
					"block-1":
						(GOTO.IF (BOOL.CONST true) "block-2" "block-3")
					"block-2":
						(DROP (INT.CONST 10))
						(GOTO "block-3")
					"unreachable-4":
						(DROP (INT.CONST 20))
						(GOTO.IF (BOOL.CONST true) "block-5" "block-6")
					"block-5":
						(DROP (INT.CONST 30))
						(GOTO "block-7")
					"block-7":
						(GOTO.IF (BOOL.CONST true) "block-8" "block-9")
					"block-8":
						(DROP (INT.CONST 40))
						(GOTO "block-7")
					"unreachable-10":
						(DROP (INT.CONST 50))
						(GOTO "block-7")
					"block-9":
						(DROP (INT.CONST 60))
						(GOTO "block-6")
					"block-6":
						(DROP (INT.CONST 70))
						(GOTO "block-1")
					"block-3":
						(ENDPROGRAM)
				`.trim());
			});
		});
	});
});
