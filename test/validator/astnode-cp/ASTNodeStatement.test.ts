import * as assert from 'assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	type Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	TYPE,
	BinVect,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	MutabilityError01,
} from '../../../src/index.js';
import {
	assertEqualBins,
	assertAssignable,
} from '../../assert-helpers.ts';
import {setupScript} from '../../helpers.js';
import {extract_lines} from '../../utils.ts';



test.suite('ASTNodeStatement', () => {
	test.suite('#varCheck', () => {
		test.suite('ASTNodeStatementReassignment', () => {
			test.test('throws if the variable is not unfixed.', () => {
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
				const info_it: SymbolSchema | null = validator.getSymbolInfo(0x100n);
				assert_instanceof(info_it, SymbolSchemaVar);
				return assert.partialDeepStrictEqual(info_it, {
					isUnfixed:       false,
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
						[stmts[1], stmts[3]].map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
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
								assert_instanceof(err, AggregateError);
								assertAssignable(err, {
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
					}`, {build: false}).goal.block!.validator.getSymbolInfo(0x100n), {
						isUnfixed:       true,
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
					assert.partialDeepStrictEqual(goal.block!.validator.getSymbolInfo(0x100n), {
						isUnfixed:       true,
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
				assert.throws(() => (stmts[0] as AST.ASTNodeStatementIteration).block.children[0].typeCheck(), TypeErrorInvalidOperation);
				return assert.throws(() => stmts[0].typeCheck(), TypeErrorInvalidOperation);
			});
		});
	});


	test.suite('#build', () => {
		test.suite('ASTNodeStatementClaim', () => {
			test.test('always returns `(nop)`.', () => {
				const {stmts, mod} = setupScript(`{
					type T = int;
					val mut x: int = 42;
					claim x: T;
				}`);
				return assertEqualBins(stmts[2].build(), mod.nop());
			});
		});

		test.suite('ASTNodeStatementReassignment', () => {
			test.test('always returns `(local.set)`.', () => {
				const {stmts, mod} = setupScript(`{
					val mut y: float = 4.2;
					set y = y * 10.0;
				}`);
				return assertEqualBins(
					stmts[1].build(),
					mod.local.set(0, (stmts[1] as AST.ASTNodeStatementReassignment).assigned.build()),
				);
			});
			test.test('allows switching between union members.', () => {
				const {stmts, mod} = setupScript(`{
					val mut x: float | int = 4.2;
					val mut y: int | float = 4.2;
					set x = 8.4;
					set x = 16;
					set x = x;
					set x = y;
				}`);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					stmts.slice(2).map((stmt) => mod.local.set(0, (stmt as AST.ASTNodeStatementReassignment).assigned.build())),
				);
			});
		});

		test.suite('ASTNodeStatementConditional', () => {
			test.suite('produces `(nop)` for entire statement when …', () => {
				test.test('… condition is foldable and truthy (or falsy for `unless`), and consequent is foldable.', () => {
					const {stmts, mod} = setupScript(`{
						val mut value: float = 4.2;
						val truthy_cond: bool = true;
						if truthy_cond then {
							42;
						} else {
							set value = 6.9;
						};
						unless !truthy_cond then {
							42;
						};
					}`);
					return assertEqualBins(
						stmts.slice(2, 4).map((stmt) => (stmt as AST.ASTNodeStatementConditional).build()),
						[mod.nop(), mod.nop()],
					);
				});
				test.test('… condition is foldable and falsy (or truthy for `unless`), and alternative is foldable (or doesn’t exist).', () => {
					const {stmts, mod} = setupScript(`{
						val mut value: float = 4.2;
						val falsy_cond: bool = !"hello";
						if falsy_cond then {
							set value = 6.9;
						} else {
							42;
						};
						if falsy_cond then {
							set value = 6.9;
						};
						unless !falsy_cond then {
							set value = 6.9;
						};
					}`);
					return assertEqualBins(
						stmts.slice(2, 5).map((stmt) => (stmt as AST.ASTNodeStatementConditional).build()),
						[mod.nop(), mod.nop(), mod.nop()],
					);
				});
			});
			test.test('if not foldable, retuns `(if)`.', () => {
				const {stmts, mod} = setupScript(`{
					val mut unknown_cond: bool = false;
					if unknown_cond then {
						42;
					} else {
						4.2;
					};
				}`);
				const stmt1 = stmts[1] as AST.ASTNodeStatementConditional;
				return assertEqualBins(stmt1.build(), mod.if(
					new BinVect(mod, stmt1.condition.build()).isSpecial(true),
					stmt1.consequent.build(),
					stmt1.alternative!.build(),
				));
			});
		});

		test.suite('ASTNodeStatementLoop', () => {
			function makeLoop(
				mod:          binaryen.Module,
				label_exit:   string,
				label_repeat: string,
				label_body:   string,
				instrs:       (build_body: (block_build: binaryen.ExpressionRef) => binaryen.ExpressionRef) => binaryen.ExpressionRef[],
				while_false:  boolean = false,
			): binaryen.ExpressionRef {
				return mod.block(label_exit, [mod.loop(label_repeat, mod.block(null, [
					...instrs.call(null, (block_build) => mod.block(label_body, [block_build])),
					mod.br(while_false ? label_exit : label_repeat),
				]))]);
			}
			test.test('produces `(nop)` if entire statement is foldable.', () => {
				const {stmts, mod} = setupScript(`{
					val cond: bool = true;
					while cond do {
						42;
					};
				}`);
				return assertEqualBins(stmts[1].build(), mod.nop());
			});
			test.test('if not foldable, retuns `(block (loop (block)))`.', () => {
				const {stmts, mod} = setupScript(`{
					val mut cond: bool = false;
					while cond do {
						42;
						4.2;
					};
				}`);
				const stmt = stmts[1] as AST.ASTNodeStatementLoop;
				return assertEqualBins(stmt.build(), makeLoop(mod, 'exit0', 'repeat0', 'body0', (build_body) => [
					mod.br_if('exit0', new BinVect(mod, stmt.condition.build()).isSpecial(false)),
					build_body(stmt.block.build()),
				]));
			});
			test.test('skips condition check if condition is definitely truthy/falsy.', () => {
				const {stmts, mod} = setupScript(`{
					val mut TRUE:  true  = true;
					val mut FALSE: false = false;
					while TRUE do {
						42;
					};
					do {
						42;
					} while TRUE;
					while FALSE do {
						42;
					};
					do {
						42;
					} while FALSE;
				}`);
				return assertEqualBins(stmts.slice(2).map((stmt) => stmt.build()), [
					makeLoop(mod, 'exit0', 'repeat0', 'body0', (build_body) => [
						mod.drop((stmts[2] as AST.ASTNodeStatementLoop).condition.build()),
						build_body((stmts[2] as AST.ASTNodeStatementLoop).block.build()),
					]),
					makeLoop(mod, 'exit1', 'repeat1', 'body1', (build_body) => [
						build_body((stmts[3] as AST.ASTNodeStatementLoop).block.build()),
						mod.drop((stmts[3] as AST.ASTNodeStatementLoop).condition.build()),
					]),
					makeLoop(mod, 'exit2', 'repeat2', 'body2', (build_body) => [
						mod.drop((stmts[4] as AST.ASTNodeStatementLoop).condition.build()),
						build_body((stmts[4] as AST.ASTNodeStatementLoop).block.build()),
					], true),
					makeLoop(mod, 'exit3', 'repeat3', 'body3', (build_body) => [
						build_body((stmts[5] as AST.ASTNodeStatementLoop).block.build()),
						mod.drop((stmts[5] as AST.ASTNodeStatementLoop).condition.build()),
					], true),
				]);
			});
			test.test('negates the condition for `until` statements.', () => {
				const {stmts, mod} = setupScript(`{
					val mut cond: bool = false;
					until cond do {
						42;
					};
				}`);
				const stmt = stmts[1] as AST.ASTNodeStatementLoop;
				return assertEqualBins(stmt.build(), makeLoop(mod, 'exit0', 'repeat0', 'body0', (build_body) => [
					mod.br_if('exit0', new BinVect(mod, mod.call('vnot', [stmt.condition.build()], binaryen.v128)).isSpecial(false)),
					build_body(stmt.block.build()),
				]));
			});
		});

		test.suite('ASTNodeStatementIteration', () => {
			test.test('produces `(nop)` if entire statement is foldable.', () => {
				const {stmts, mod} = setupScript(`{
					for it: int in [10, 20, 30, 40] do {
						42;
					};
				}`);
				return assertEqualBins(stmts[0].build(), mod.nop());
			});
			test.test('if not foldable, is not yet supported.', () => {
				const {stmts} = setupScript(`{
					val mut i: int = 42;
					for it: int in [10, 20, 30, 40] do {
						set i = it;
					};
				}`, {build: false});
				stmts[0].build(); // assert does not throw
				return assert.throws(() => stmts[1].build(), /not yet supported/);
			});
		});

		test.suite('ASTNodeStatementBreak', () => {
			test.test('produces (br).', () => {
				const {stmts, mod} = setupScript(`{
					while true do {
						break;
						skip;
					};
				}`);
				const while_block: AST.ASTNodeBlock = (stmts[0] as AST.ASTNodeStatementLoop).block;
				return assertEqualBins([
					while_block.children[0].build(),
					while_block.children[1].build(),
				], [
					mod.br('exit0'),
					mod.br('body0'),
				]);
			});
			test.test('nested loops.', () => {
				const {stmts, mod} = setupScript(`{
					while true do {
						break;
						if true then {
							while true do {
								skip;
							};
						};
					};
				}`);
				const outer_block: AST.ASTNodeBlock = (stmts[0] as AST.ASTNodeStatementLoop).block;
				const inner_block: AST.ASTNodeBlock = ((outer_block.children[1] as AST.ASTNodeStatementConditional).consequent.children[0] as AST.ASTNodeStatementLoop).block;
				return assertEqualBins([
					outer_block.children[0].build(),
					inner_block.children[0].build(),
				], [
					mod.br('exit0'),
					mod.br('body1'),
				]);
			});
			test.test('throws if the parent block has not been built yet.', () => {
				const while_block: AST.ASTNodeBlock = (setupScript(`{
					while true do {
						break;
						skip;
					};
				}`, {build: false}).stmts[0] as AST.ASTNodeStatementLoop).block;
				assert.throws(() => while_block.children[0].build(), /Expected builder to store/);
				assert.throws(() => while_block.children[1].build(), /Expected builder to store/);
			});
		});
	});
});
