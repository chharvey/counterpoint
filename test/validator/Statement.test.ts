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
			test.test('`set` throws if the variable is read-only.', () => {
				const {goal, stmts} = setupScript(`{
					val mut i: int = 42;
					val     j: int = 42;
					set i = 24;
					set j = 24;
				}`, {varCheck: false});
				stmts.slice(0, 3).forEach((stmt) => stmt.varCheck());
				assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('i'), {
					isWritable:      true,
					isUninitialized: false,
				});
				assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('j'), {
					isWritable:      false,
					isUninitialized: false,
				});
				return assert.throws(() => stmts[3].varCheck(), AssignmentErrorReassignment);
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
				const {goal, stmts} = setupScript(`{
					val mut i?: int;
					val mut j:  int = 42;
					delete i;
					delete j;
				}`, {varCheck: false});
				stmts.slice(0, 3).forEach((stmt) => stmt.varCheck());
				assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('i'), {
					isWritable:      true,
					isUninitialized: true,
				});
				assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('j'), {
					isWritable:      true,
					isUninitialized: false,
				});
				return assert.throws(() => stmts[3].varCheck(), AssignmentErrorDeletion);
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
							${stmt}
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
					return assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
				test.test('does not allow reassignment of `null` or `Maybe` when uninitialized.', () => {
					const {goal, stmts} = setupScript(`{
						val mut x?: int;
						val mut y?: int;
						set x = 42;
						set x = null;
						set x = y;
					}`, {typeCheck: false});
					stmts.slice(0, 3).forEach((stmt) => stmt.typeCheck());
					assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('x'), {
						isWritable:      true,
						isUninitialized: true,
					});
					return xjs.Array.forEachAggregated(stmts.slice(3), (stmt) => assert.throws(() => stmt.typeCheck(), TypeErrorNotAssignable));
				});
				test.test('None/Some assignable to Maybe, but not to each other.', () => {
					setupScript(`{
						val a: Maybe.<int> = None.<int>();
						val b: Maybe.<int> = Some.<int>(42);
					}`, {build: false}); // assert does not throw
					const {stmts} = setupScript(`{
						val c: Maybe.<float> = None.<int>();
						val d: Maybe.<float> = Some.<int>(42);
						val e: Some.<int> = None.<int>();
						val f: None.<int> = Some.<int>(42);
					}`, {typeCheck: false});
					return xjs.Array.forEachAggregated(stmts, (stmt) => assert.throws(() => stmt.typeCheck(), TypeErrorNotAssignable));
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
						const {goal} = setupScript(`{ delete ${src}; }`, {typeCheck: false});
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
						${decl}
						if     ${decl_set === NON_BOOLS ? '!!' : ''}cond then { "consequent"; } else { "alternative"; };
						unless ${decl_set === NON_BOOLS ? '!!' : ''}cond then { "consequent"; };
					}`, {build: false}); // assert does not throw
				}));
			});
			test.test('throws when condition is not subtype of Boolean.', () => {
				xjs.Array.forEachAggregated(NON_BOOLS, (decl) => {
					const {stmts} = setupScript(`{
						${decl}
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
						${decl}
						while ${decl_set === NON_BOOLS ? '!!' : ''}cond do { "consequent"; };
						until ${decl_set === NON_BOOLS ? '!!' : ''}cond do { "consequent"; };
					}`, {build: false}); // assert does not throw
				}));
			});
			test.test('throws when condition is not subtype of Boolean.', () => {
				xjs.Array.forEachAggregated(NON_BOOLS, (decl) => {
					const {stmts} = setupScript(`{
						${decl}
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
						for it: ${vartype} in ["hello", "world"] do {
							val greeting: ${vartype} = it;
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
						for it: str in ${collection} do {
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
						for it: ${vartype} in ["hello", "world"] do {
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

		test.suite('StatementReturn', () => {
			test.test('throws when returned expression is not assignable to declared return type.', () => {
				const {stmts} = setupScript(`{
					func foo0(): float { return 40; }
					func foo1(): float => 41;
					func foo2(b: bool): float {
						if b then { return 4.2; } else { return 42; };
					}
					func foo3(b: bool): float => if b then 4.2 else 43;
				}`, {typeCheck: false});
				const fn2 = stmts[2] as AST.STMT.DeclarationFunction;
				const fn3 = stmts[3] as AST.STMT.DeclarationFunction;
				const ret0:  AST.STMT.Statement = (stmts[0] as AST.STMT.DeclarationFunction).block.children[0];
				const ret1:  AST.STMT.Statement = (stmts[1] as AST.STMT.DeclarationFunction).block.children[0];
				const ret2a: AST.STMT.Statement = (fn2.block.children[0] as AST.STMT.StatementConditional).consequent.children[0];
				const ret2b: AST.STMT.Statement = ((fn2.block.children[0] as AST.STMT.StatementConditional).alternative as AST.Block).children[0];
				const ret3:  AST.STMT.Statement = fn3.block.children[0];
				xjs.Array.forEachAggregated([ret0, ret1, ret2a, ret2b, ret3], (ret) => assert_instanceof(ret, AST.STMT.StatementReturn));
				assert.throws(() => ret0.typeCheck(), TypeErrorNotAssignable);
				assert.throws(() => ret1.typeCheck(), TypeErrorNotAssignable);
				xjs.Array.forEachAggregated(fn2.parameters, (p) => p.typeCheck());
				ret2a.typeCheck(); // assert does not throw
				assert.throws(() => ret2b.typeCheck(), TypeErrorNotAssignable);
				xjs.Array.forEachAggregated(fn3.parameters, (p) => p.typeCheck());
				return assert.throws(() => ret3.typeCheck(), TypeErrorNotAssignable);
			});
			test.test('throws when returned expression is present in void function.', () => {
				const {stmts} = setupScript(`{
					func foo0(): void { return 40; }
					func foo1(): void => 41;
					func foo2(b: bool): void {
						if b then { return; } else { return 42; };
					}
					func foo3(b: bool): void => if b then 4.2 else 43;
				}`, {typeCheck: false});
				const fn2 = stmts[2] as AST.STMT.DeclarationFunction;
				const fn3 = stmts[3] as AST.STMT.DeclarationFunction;
				const ret0:  AST.STMT.Statement = (stmts[0] as AST.STMT.DeclarationFunction).block.children[0];
				const ret1:  AST.STMT.Statement = (stmts[1] as AST.STMT.DeclarationFunction).block.children[0];
				const ret2a: AST.STMT.Statement = (fn2.block.children[0] as AST.STMT.StatementConditional).consequent.children[0];
				const ret2b: AST.STMT.Statement = ((fn2.block.children[0] as AST.STMT.StatementConditional).alternative as AST.Block).children[0];
				const ret3:  AST.STMT.Statement = fn3.block.children[0];
				xjs.Array.forEachAggregated([ret0, ret1, ret2a, ret2b, ret3], (ret) => assert_instanceof(ret, AST.STMT.StatementReturn));
				const expected: RegExp = /is returned from a void function/;
				assert.throws(() => ret0.typeCheck(), expected);
				assert.throws(() => ret1.typeCheck(), expected);
				xjs.Array.forEachAggregated(fn2.parameters, (p) => p.typeCheck());
				ret2a.typeCheck(); // assert does not throw
				assert.throws(() => ret2b.typeCheck(), expected);
				xjs.Array.forEachAggregated(fn3.parameters, (p) => p.typeCheck());
				return assert.throws(() => ret3.typeCheck(), expected);
			});
			test.test('throws for empty return statement in non-void function.', () => {
				const {stmts} = setupScript(`{
					func foo0(): float { return; }
					func foo2(b: bool): float {
						if b then { return 4.2; } else { return; };
					}
				}`, {typeCheck: false});
				const fn1 = stmts[1] as AST.STMT.DeclarationFunction;
				const ret0:  AST.STMT.Statement = (stmts[0] as AST.STMT.DeclarationFunction).block.children[0];
				const ret1a: AST.STMT.Statement = (fn1.block.children[0] as AST.STMT.StatementConditional).consequent.children[0];
				const ret1b: AST.STMT.Statement = ((fn1.block.children[0] as AST.STMT.StatementConditional).alternative as AST.Block).children[0];
				xjs.Array.forEachAggregated([ret0, ret1a, ret1b], (ret) => assert_instanceof(ret, AST.STMT.StatementReturn));
				const expected: RegExp = /does not return a value/;
				assert.throws(() => ret0.typeCheck(), expected);
				xjs.Array.forEachAggregated(fn1.parameters, (p) => p.typeCheck());
				ret1a.typeCheck(); // assert does not throw
				return assert.throws(() => ret1b.typeCheck(), expected);
			});
			test.test('throws when panicked expression is not an Exception.', () => {
				const {stmts} = setupScript(`{
					panic Exception.("error1");
					panic "error2";
				}`, {typeCheck: false});
				stmts[0].typeCheck(); // assert does not throw
				return assert.throws(() => stmts[1].typeCheck(), TypeErrorNotAssignable);
			});
		});
	});
});
