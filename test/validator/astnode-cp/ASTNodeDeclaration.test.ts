import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	AST,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	MutabilityError01,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {
	assertEqualBins,
	assertAssignable,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	setupScript,
} from '../../helpers.js';
import {extract_lines} from '../../utils.ts';



describe('ASTNodeDeclaration', () => {
	describe('ASTNodeDeclarationType', () => {
		describe('#varCheck', () => {
			it('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					type T = int;
				}`);
				assert.ok(!goal.block!.validator.hasSymbol(0x100n));
				goal.varCheck();
				assert.ok(goal.block!.validator.hasSymbol(0x100n));
				const info: SymbolSchema | null = goal.block!.validator.getSymbolInfo(0x100n);
				assert_instanceof(info, SymbolSchemaType);
				assert.strictEqual(info.typevalue, TYPE.ANYTHING);
			});
			it('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					type _ = str;
				}`);
				assert.ok(!goal.block!.validator.hasSymbol(256n));
				goal.varCheck();
				return assert.ok(!goal.block!.validator.hasSymbol(256n));
			});
			it('throws if the validator already contains a record for the symbol.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = int;
					type T = float;
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let FOO: int = 42;
					type FOO = float;
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			it('throws if the same identifier was declared in an outer scope (shadowing).', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = int;
					if true then {
						type T = float;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			it('allows duplicate declaration of blank identifier.', () => {
				AST.ASTNodeGoal.fromSource(`{
					type _ = int | float;
					type _ = (str, bool);
				}`).varCheck(); // assert does not throw
			});
		});


		describe('#typeCheck', () => {
			it('sets `SymbolSchemaType#typevalue`.', () => {
				assert.strictEqual(
					(setupScript(`{
						type T = int;
					}`, null, {build: false}).goal.block!.validator.getSymbolInfo(0x100n) as SymbolSchemaType).typevalue,
					TYPE.INT,
				);
			});
		});


		describe('#build', () => {
			it('always returns `(nop)`.', () => {
				const {stmts, mod} = setupScript(`{
					type T = int;
					type U = T | float;
				}`);
				return xjs.Array.forEachAggregated(stmts, (stmt) => assertEqualBins(stmt.build(), mod.nop()));
			});
		});
	});



	describe('ASTNodeDeclarationVariable', () => {
		describe('#varCheck', () => {
			it('adds a SymbolSchema to the symbol table with a preset `type` value of `anything` and a preset null `value` value.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					let     a:  int = 42;
					let var b:  int = 42;
					let var c?: int;
				}`);
				assert.ok(!goal.block!.validator.hasSymbol(0x100n));
				assert.ok(!goal.block!.validator.hasSymbol(0x101n));
				assert.ok(!goal.block!.validator.hasSymbol(0x102n));
				goal.varCheck();
				assert.ok(goal.block!.validator.hasSymbol(0x100n));
				assert.ok(goal.block!.validator.hasSymbol(0x101n));
				assert.ok(goal.block!.validator.hasSymbol(0x102n));
				const info_a: SymbolSchema | null = goal.block!.validator.getSymbolInfo(0x100n);
				const info_b: SymbolSchema | null = goal.block!.validator.getSymbolInfo(0x101n);
				const info_c: SymbolSchema | null = goal.block!.validator.getSymbolInfo(0x102n);
				assert_instanceof(info_a, SymbolSchemaVar);
				assert_instanceof(info_b, SymbolSchemaVar);
				assert_instanceof(info_c, SymbolSchemaVar);
				assert.partialDeepStrictEqual(info_a, {
					isUnfixed:       false,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
					value:           null,
				});
				assert.partialDeepStrictEqual(info_b, {
					isUnfixed:       true,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
					value:           null,
				});
				assert.partialDeepStrictEqual(info_c, {
					isUnfixed:       true,
					isUninitialized: true,
					type:            TYPE.ANYTHING,
					value:           null,
				});
			});
			it('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					let _: float = 4.2;
				}`);
				assert.ok(!goal.block!.validator.hasSymbol(256n));
				goal.varCheck();
				return assert.ok(!goal.block!.validator.hasSymbol(256n));
			});
			it('throws if the validator already contains a record for the variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let i: int = 42;
					let i: int = 43;
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type FOO = float;
					let FOO: int = 42;
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			it('throws if the same identifier was declared in an outer scope (shadowing).', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let var x: int = 42;
					if true then {
						let var x: float = 4.2;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			it('allows duplicate declaration of blank identifier.', () => {
				AST.ASTNodeGoal.fromSource(`{
					let _: int = 42;
					let _: str = "the answer";
				}`).varCheck(); // assert does not throw
			});
		});


		describe('#typeCheck', () => {
			function typeCheckGoal(src: string | string[], expect_thrown?: Parameters<typeof assert.throws>[1]): void {
				if (src instanceof Array) {
					return src
						.map((s) => s.trim())
						.filter((s) => !!s)
						.forEach((s) => typeCheckGoal(`{${ s }}`, expect_thrown));
				}
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				goal.varCheck();
				return (expect_thrown)
					? assert.throws(() => goal.typeCheck(), expect_thrown)
					: goal.typeCheck();
			}
			it('checks the assigned expression’s type against the variable assignee’s type.', () => {
				const var_: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(`
					let  the_answer:  int | float =  21  *  2;
				`);
				var_.varCheck();
				return var_.typeCheck();
			});
			it('passes when assigned is structurally assignable.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					let n: Name = "Alice";
					let n: Name = "Alice" as <str>;
					let n: Name = "Alice" as <"Alice">;
					let n: Name = "Alice" as <Name>;
				`, (stmt) => {
					setupScript(`{
						type Name = str;
						${ stmt }
					}`, null, {build: false}); // assert does not throw
				});
			});
			it('passes typechecking when uninitialized.', () => {
				assert.partialDeepStrictEqual(setupScript(`{
					let var the_answer?: int | float;
				}`, null, {build: false}).goal.block!.validator.getSymbolInfo(0x100n), {
					isUnfixed:       true,
					isUninitialized: true,
					type:            TYPE.INT.union(TYPE.FLOAT),
					value:           null,
				});
			});
			it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
				assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
					let  the_answer:  null =  21  *  2;
				`).typeCheck(), TypeErrorNotAssignable);
			});
			it('throws when assigning int to float.', () => {
				assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
					let x: float = 42;
				`).typeCheck(), TypeErrorNotAssignable);
			});
			it('does not set `SymbolSchemaVar#value` when assignee type has mutable.', () => {
				const {goal} = setupScript(`{
					let immut:  (int, int, int)                   = (42, 420, 4200);
					let 'mut':  mut [int]                         = [42, 420, 4200];
					let mutmut: (mut [int], mut [int], mut [int]) = ([42], [420], [4200]);
				}`, null, {build: false});
				const [immut, mut, mutmut] = [
					goal.block!.validator.getSymbolInfo(0x100n) as SymbolSchemaVar,
					goal.block!.validator.getSymbolInfo(0x101n) as SymbolSchemaVar,
					goal.block!.validator.getSymbolInfo(0x102n) as SymbolSchemaVar,
				];
				assert.deepStrictEqual(
					[immut.source, immut.value],
					['immut',      new VALUE.Tuple<VALUE.Integer>([
						new VALUE.Integer(  42n),
						new VALUE.Integer( 420n),
						new VALUE.Integer(4200n),
					])],
				);
				assert.deepStrictEqual(
					[mut.source, mut.value],
					['\'mut\'',  null],
				);
				return assert.deepStrictEqual(
					[mutmut.source, mutmut.value],
					['mutmut',      null],
				);
			});
			it('immutable lists/dicts/sets/maps should be covariant.', () => {
				typeCheckGoal(extract_lines`
					let l: List.<int | str> = List.<int>((42, 43));
					let d: Dict.<int | str> = Dict.<int>((a= 42, b= 43));
					let s: Set.<int | str>  = Set.<int>((42, 43));

					let mk: Map.<int | str, bool>       = Map.<int, bool>(((42, false), (43, true)));
					let mv: Map.<int,       bool | str> = Map.<int, bool>(((42, false), (43, true)));
					let m:  Map.<int | str, bool | str> = Map.<int, bool>(((42, false), (43, true)));
				`);
			});
			it('mutable lists/dicts/sets/maps should not be covariant.', () => {
				typeCheckGoal(extract_lines`
					let l: mut List.<int | str> = List.<int>((42, 43));
					let d: mut Dict.<int | str> = Dict.<int>((a= 42, b= 43));
					let s: mut Set.<int | str>  = Set.<int>((42, 43));

					let mk: mut Map.<int | str, bool>       = Map.<int, bool>(((42, false), (43, true)));
					let mv: mut Map.<int,       bool | str> = Map.<int, bool>(((42, false), (43, true)));
					let m:  mut Map.<int | str, bool | str> = Map.<int, bool>(((42, false), (43, true)));
				`, TypeErrorNotAssignable);
			});
			it('assigning collection literals.', () => {
				typeCheckGoal(`{
					let c: (int, int, int) = (42, 420, 4200);
					let d: (n42: int, n420: int) = (
						n42=  42,
						n420= 420,
					);
					let v: (   int,    str) = (   42,    "hello");
					let s: (a: int, b: str) = (a= 42, b= "hello");
				}`);
			});
			it('allows assigning a collection literal to super reference type (autoboxing at runtime).', () => {
				typeCheckGoal(`{
					let v: anything = (   42,    "hello");
					let s: anything = (a= 42, b= "hello");
				}`);
				typeCheckGoal(`{
					let v: mut anything = (   42,    "hello");
					let s: mut anything = (a= 42, b= "hello");
				}`); // mut anything == anything
			});
			context('assigning a collection literal to a wider mutable type.', () => {
				it('disallows assigning Tuples/Records to Lists/Dicts', () => {
					typeCheckGoal(`
						let t1_1: List.<42 | 4.3> = (42);
						let t2_1: List.<int>      = (42);

						let t1_2: mut List.<42 | 4.3> = (43);
						let t2_2: mut List.<int>      = (43);

						let r1_1: Dict.<42 | 4.3> = (a= 42);
						let r2_1: Dict.<int>      = (a= 42);

						let r1_2: mut Dict.<42 | 4.3> = (a= 43);
						let r2_2: mut Dict.<int>      = (a= 43);

						let t3_1: (           List.<float>,) = (       (4.3,),);
						let t3_2: (       mut List.<float>,) = (       (4.3,),);
						let r3_1: (inner:     List.<float>)  = (inner= (4.3,));
						let r3_2: (inner: mut List.<float>)  = (inner= (4.3,));
					`.split('\n'), TypeErrorNotAssignable);
				});
				it('allows assigning Lists, Dicts, Sets, and Maps.', () => {
					typeCheckGoal(`{
						let l: mut [int | str]   = [   42,      "43"];
						let d: mut [: int | str] = [a= 42,   b= "43"];
						let s: mut {int | str}   = {   42,      "43"};
						let m: mut {int -> str}  = {   42 ->    "43"};
						set l.[1]    = "44";
						set d.[@a]   = "44";
						set s.["44"] = true;
						set m.[44]   = "45";
					}`);
					return typeCheckGoal(`{
						let tuple_of_list:  (   mut [int],)        = (   [42],);
						let tuple_of_dict:  (   mut [:int],)       = (   [a= 42],);
						let tuple_of_set:   (   mut {int},)        = (   {42},);
						let tuple_of_map:   (   mut {int -> str},) = (   {42 -> "hello"},);
						let record_of_list: (k: mut [int])         = (k= [42]);
						let record_of_dict: (k: mut [:int])        = (k= [b= 42]);
						let record_of_set:  (k: mut {int})         = (k= {42});
						let record_of_map:  (k: mut {int -> str})  = (k= {42 -> "hello"});
						set tuple_of_list.0.[0]   = 43;
						set tuple_of_dict.0.[@a]  = 43;
						set tuple_of_set.0.[43]   = true;
						set tuple_of_map.0.[43]   = "world";
						set record_of_list.k.[0]  = 43;
						set record_of_dict.k.[@b] = 43;
						set record_of_set.k.[43]  = true;
						set record_of_map.k.[43]  = "world";
					}`);
				});
				it('should throw when assigning combo type to union.', () => {
					typeCheckGoal(`
						let x: (   bool,    int) | (   int,    bool) = (   true,    false);
						let x: (a: bool, b: int) | (a: int, b: bool) = (a= true, b= false);
					`.split('\n'), (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorNotAssignable, message: 'Expression of type `false` is not assignable to type `int`.'},
								{cons: TypeErrorNotAssignable, message: 'Expression of type `true` is not assignable to type `int`.'},
							],
						});
						return true;
					});
					return typeCheckGoal(`{
						type Employee = (
							name:         str,
							id:           int,
							job_title:    str,
							hours_worked: float,
						);
						type Volunteer = (
							name:         str,
							agency:       str,
							hours_worked: float,
						);
						let bob: Employee | Volunteer = (
							name=         "Bob", %: str
							hours_worked= 80.0,  %: float
						);
					}`, (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorNotAssignable, message: 'Expression of type `(256: "Bob", 259: 80.0)` is not assignable to type `(256: str, 257: int, 258: str, 259: float)`.'},
								{cons: TypeErrorNotAssignable, message: 'Expression of type `(256: "Bob", 259: 80.0)` is not assignable to type `(256: str, 261: str, 259: float)`.'},
							],
						});
						return true;
					});
				});
				it('throws when not assigned to correct type.', () => {
					typeCheckGoal(`
						let s: mut {int -> str} = {42,   "43"};
						let s: mut {int | str}  = {42 -> "43"};
					`.split('\n'), TypeErrorNotAssignable);
					typeCheckGoal(`{
						let t1: mut anything              = (42, "43");
						let t4: mut ((int, str) | Object) = (42, "43");

						let r1: mut anything                    = (a= 42, b= "43");
						let r4: mut ((a: int, b: str) | Object) = (a= 42, b= "43");

						let s1: mut {42 | 4.3}              = {42};
						let s2: mut {int | float}           = {42};
						let s3: mut Object                  = {42};
						let s4: mut ({int} | {str -> bool}) = {42};
						let s5: mut ({int} | Object)        = {42};

						let m1: mut {int -> float}            = {42 -> 4.3};
						let m2: mut {int? -> float?}          = {42 -> 4.3};
						let m3: mut Object                    = {42 -> 4.3};
						let m4: mut ({int -> float} | {str})  = {42 -> 4.3};
						let m5: mut ({int -> float} | Object) = {42 -> 4.3};
					}`);
				});
				it('throws when entries mismatch.', () => {
					typeCheckGoal(`
						let s1: mut {int} = {"42"};
						let s2: mut {int} = {42, "43"};

						let m1: mut {int -> str} = {4.2 -> "43"};
						let m2: mut {int -> str} = {42  -> 4.3};
					`.split('\n'), TypeErrorNotAssignable);
					typeCheckGoal(`{
						let s3: mut {bool | str} = {46, 47};

						let m3_1: mut {str -> bool} = {1 -> false, 2.0 -> true};
						let m3_2: mut {str -> bool} = {"a" -> 3,   "b" -> 4.0};
						let m3_3: mut {str -> bool} = {5 -> false, "b" -> 6.0};
						let m3_4: mut {str -> bool} = {7 -> 8.0};
						let m3_5: mut {str -> bool} = {9 -> "a", 10.0 -> "b"};
					}`, (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
							cons:   AggregateError,
							errors: [
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression of type `46` is not assignable to type `bool | str`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression of type `47` is not assignable to type `bool | str`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression of type `1` is not assignable to type `str`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression of type `2.0` is not assignable to type `str`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression of type `3` is not assignable to type `bool`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression of type `4.0` is not assignable to type `bool`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression of type `5` is not assignable to type `str`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression of type `6.0` is not assignable to type `bool`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression of type `7` is not assignable to type `str`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression of type `8.0` is not assignable to type `bool`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{
											cons:   AggregateError,
											errors: [
												{cons: TypeErrorNotAssignable, message: 'Expression of type `9` is not assignable to type `str`.'},
												{cons: TypeErrorNotAssignable, message: 'Expression of type `"a"` is not assignable to type `bool`.'},
											],
										},
										{
											cons:   AggregateError,
											errors: [
												{cons: TypeErrorNotAssignable, message: 'Expression of type `10.0` is not assignable to type `str`.'},
												{cons: TypeErrorNotAssignable, message: 'Expression of type `"b"` is not assignable to type `bool`.'},
											],
										},
									],
								},
							],
						});
						return true;
					});
				});
			});
		});


		describe('#build', () => {
			const SRC = `{
				%                                      % constant folding on | constant folding off
				%                                      % ------------------- | --------------------

				% Foldable cases:
				let var _?:         int;               % \`(nop)\`           | \`(drop)\`
				let     _:          int = 42;          % \`(nop)\`           | \`(drop)\`
				let var _:          int = 42;          % \`(nop)\`           | \`(drop)\`
				let     assignee_a: int = 42;          % \`(nop)\`           | \`(local.set)\`

				% Non-Foldable cases:
				let var assignee_b?: int;              % \`(local.set)\`     | same as when constant folding on
				let var assignee_c:  int = 42;         % \`(local.set)\`     | same as when constant folding on
				let     _:           int = assignee_c; % \`(drop)\`          | same as when constant folding on
				let var _:           int = assignee_c; % \`(drop)\`          | same as when constant folding on
				let     assignee_d:  int = assignee_c; % \`(local.set)\`     | same as when constant folding on
				let var assignee_e:  int = assignee_c; % \`(local.set)\`     | same as when constant folding on

				%% Syntactically impossible cases (for completion):
				let _?:         int;
				let assignee6?: int;
				%%
			}`;
			it('with constant folding on.', () => {
				const {goal, stmts, mod} = setupScript(SRC);
				return assertEqualBins(stmts.map((stmt) => stmt.build()), [
					mod.nop(),
					mod.nop(),
					mod.nop(),
					mod.nop(),

					mod.local.set(0, VALUE.NULL.build(goal.builder)),
					mod.local.set(1, (stmts[5] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.drop(        (stmts[6] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.drop(        (stmts[7] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.local.set(2, (stmts[8] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.local.set(3, (stmts[9] as AST.ASTNodeDeclarationVariable).assigned!.build()),
				]);
			});
			it('with constant folding off, never returns `(nop)`.', () => {
				const {goal, stmts, mod} = setupScript(SRC, CONFIG_FOLDING_OFF);
				return assertEqualBins(stmts.map((stmt) => stmt.build()), [
					mod.drop(        VALUE.NULL.build(goal.builder)),
					mod.drop(        (stmts[1] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.drop(        (stmts[2] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.local.set(0, (stmts[3] as AST.ASTNodeDeclarationVariable).assigned!.build()),

					mod.local.set(1, VALUE.NULL.build(goal.builder)),
					mod.local.set(2, (stmts[5] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.drop(        (stmts[6] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.drop(        (stmts[7] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.local.set(3, (stmts[8] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					mod.local.set(4, (stmts[9] as AST.ASTNodeDeclarationVariable).assigned!.build()),
				]);
			});
			it('tuples and records.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let tup: (   int,    float,    (   null,    (   null,    bool))) = (   42,    4.2,    (   null,    (   null,    true)));
					let rec: (a: int, b: float, c: (d: null, e: (f: null, g: bool))) = (a= 42, b= 4.2, c= (d= null, e= (f= null, g= true)));
				}`, CONFIG_FOLDING_OFF);
				const [tup, rec] = stmts.map((stmt) => (stmt as AST.ASTNodeDeclarationVariable).assigned) as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				const [tup_2, rec_c]         = [tup.children[2],   rec.children[2].val]   as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				const [tup_2_1, rec_c_e]     = [tup_2.children[1], rec_c.children[1].val] as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				assert.deepStrictEqual(goal.builder.getLocals().map((local) => local.value), [
					tup_2_1.build(),
					tup_2.build(),
					tup.build(),
					rec_c_e.build(),
					rec_c.build(),
					rec.build(),
				]);
				return assertEqualBins(
					stmts.map((stmt) => stmt.build()),
					[
						mod.local.set(2, tup.build()),
						mod.local.set(5, rec.build()),
					],
				);
			});
			it('throws when tuples and records contain each other.', () => {
				[
					'let tup: (   int,    float,    (   null,    bool),    (g: bool, h: int),    ((j: float),)) = (   42,    4.2,    (   null,    true),    (g= false, h= 42),    ((j= 4.2),));',
					'let rec: (a: int, b: float, c: (d: null, e: bool), f: (   bool,    int), i: (k: (float,))) = (a= 42, b= 4.2, c= (d= null, e= true), f= (   false,    42), i= (k= (4.2,)));',
				].forEach((src) => {
					const {goal} = setupScript(`{ ${ src } }`, CONFIG_FOLDING_OFF, {build: false});
					return assert.throws(() => goal.build(), /not yet supported/);
				});
			});
		});
	});


	describe('ASTNodeDeclarationClaim', () => {
		describe('#typeCheck', () => {
			context('for variables.', () => {
				it('allows claimed type to be a subtype of assignee type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						claim x: int;
						claim x: float;
					`, (stmt) => {
						setupScript(`{
							let var x: int | float = 4.2;
							${ stmt }
						}`, null, {build: false}); // assert does not throw
					});
				});
				it('throws when the claimed type is not a subtype of the assignee type (including int and float).', () => {
					xjs.Array.forEachAggregated([`{
						let x: int = 3;
						claim x: str; % disjoint
					}`, `{
						let x: int = 3;
						claim x: float; % disjoint
					}`, `{
						let x: float = 3.0;
						claim x: int; % disjoint
					}`, `{
						let x: 42 | 43 | 44 = 42;
						claim x: 43 | 44 | 45; % overlapping
					}`, `{
						let x: int | float = 42;
						claim x: int | float | str; % supertype
					}`, `{
						let x: int | float = 42;
						claim x: anything; % supertype
					}`], (src) => {
						const {stmts} = setupScript(src, null, {typeCheck: false});
						stmts[0].typeCheck(); // assert does not throw
						return assert.throws(() => stmts[1].typeCheck(), TypeErrorNotNarrow);
					});
				});
				it('accessing variable after claim is narrowed.', () => {
					const {stmts} = setupScript(`{
						let var x: int | float = 4.2;
						x;            % type \`int | float\`
						claim x: int;
						x;            % type \`int\`
					}`, null, {build: false});
					return assert.deepStrictEqual(
						[stmts[1], stmts[3]].map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
						[TYPE.INT.union(TYPE.FLOAT), TYPE.INT],
					);
				});
				it('allows claim after reassignment.', () => {
					setupScript(`{
						let var x: bool | null = false;
						set x = true;
						claim x: null;
					}`, null, {build: false}); // assert does not throw
				});
				it('allows reassigning correct type after claim.', () => {
					setupScript(`{
						let var x: bool | null = false;
						claim x: bool;
						set x = true;
					}`, null, {build: false}); // assert does not throw
				});
				it('disallows reassigning incorrect type after claim.', () => {
					const {stmts} = setupScript(`{
						let var x: bool | null = false;
						claim x: bool;
						set x = null;
					}`, null, {typeCheck: false});
					stmts[0].typeCheck(); // assert does not throw
					stmts[1].typeCheck(); // assert does not throw
					return assert.throws(() => stmts[2].typeCheck(), TypeErrorNotAssignable);
				});
			});
			context('for accesses.', () => {
				it('allows claiming access of compound types.', () => {
					setupScript(`{
						let var tuple: (int | null, (value: int | null)) = (null, (value= 42));
						claim tuple.0:       int;
						claim tuple.1.value: null;

						%% TODO: uncomment these
						let var list: [int | float] = [2.718, 6.283];
						claim list.[0]: float;
						claim list.[1]: float;

						let var dict: [: int | float] = [e= 2.718, tau= 6.283];
						claim dict.[@e]:   float;
						claim dict.[@tau]: float;

						let var 'set': {int | float} = {2.718, 6.283};
						claim 'set'.[2.718]: true;
						claim 'set'.[6.283]: true;

						let var map: {str -> int | float} = {"e" -> 2.718, "tau" -> 6.283};
						claim map.["e"]:   float;
						claim map.["tau"]: float;
						%%
					}`, null, {build: false}); // assert does not throw
				});
				it('accessing property after claim is narrowed.', () => {
					const {stmts} = setupScript(`{
						let var record: (value: int | null, tuple: (int | null,)) = (value= null, tuple= (42,));
						record.value;               % type \`int | null\`
						record.tuple.0;             % type \`int | null\`
						claim record.value:   null;
						claim record.tuple.0: int;
						record.value;               % type \`null\`
						record.tuple.0;             % type \`int\`
					}`, null, {build: false});
					const INT_NULL: TYPE.Type = TYPE.INT.union(TYPE.NULL);
					return assert.deepStrictEqual(
						[...stmts.slice(1, 3), ...stmts.slice(5, 7)].map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
						[INT_NULL, INT_NULL, TYPE.NULL, TYPE.INT],
					);
				});
				it('allows claim after mutation.', () => {
					xjs.Array.forEachAggregated([`{
						let var record: (value: int | null, tuple: (int | null,)) = (value= null, tuple= (42,));
						set record = (value= 43, tuple= (null,));
						claim record.value:   null;
						claim record.tuple.0: int;
					}`, `{
						let var list: mut [int | float] = [2.718, 6.283];
						set list.[0] = 1.618;
						claim list.[0]: int;
					}`], (src, i) => {
						i === 0 && setupScript(src, null, {build: false}); // assert does not throw
						i === 1 && assert.throws(() => setupScript(src, null, {build: false}), /not yet supported/);
					});
				});
				it('allows mutating correct type after claim.', () => {
					xjs.Array.forEachAggregated([`{
						let var record: (value: int | null, tuple: (int | null,)) = (value= null, tuple= (42,));
						claim record.value:   int;
						claim record.tuple.0: null;
						set record = (value= 43, tuple= (null,));
					}`, `{
						let var list: mut [int | float] = [2.718, 6.283];
						claim list.[0]: float;
						set list.[0] = 1.618;
					}`], (src, i) => {
						i === 0 && setupScript(src, null, {build: false}); // assert does not throw
						i === 1 && assert.throws(() => setupScript(src, null, {build: false}), /not yet supported/);
					});
				});
				it('disallows mutating incorrect type after claim.', () => {
					xjs.Array.forEachAggregated([`{
						let var record: (value: int | null, tuple: (int | null,)) = (value= null, tuple= (42,));
						claim record.value:   int;
						claim record.tuple.0: null;
						set record = (value= null, tuple= (42,));
					}`, `{
						let var list: mut [int | float] = [2.718, 6.283];
						claim list.[0]: float;
						set list.[0] = 42;
					}`], (src, i) => {
						const {stmts} = setupScript(src, null, {typeCheck: false});
						if (i === 0) {
							xjs.Array.forEachAggregated(stmts.slice(0, -1), (stmt) => stmt.typeCheck()); // assert does not throw
							return assert.throws(() => stmts.at(-1)!.typeCheck(), (err) => {
								assert_instanceof(err, AggregateError);
								assertAssignable(err, {
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression of type `null` is not assignable to type `int`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression of type `42` is not assignable to type `null`.'},
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


		describe('#build', () => {
			it('always returns `(nop)`.', () => {
				const {stmts, mod} = setupScript(`{
					type T = int;
					let var x: int = 42;
					claim x: T;
				}`);
				return assertEqualBins(stmts[2].build(), mod.nop());
			});
		});
	});



	describe('ASTNodeDeclarationReassignment', () => {
		describe('#varCheck', () => {
			it('throws if the variable is not unfixed.', () => {
				AST.ASTNodeGoal.fromSource(`{
					let var i: int = 42;
					set i = 43;
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let i: int = 42;
					set i = 43;
				}`).varCheck(), AssignmentErrorReassignment);
			});
			it('always throws for type alias reassignment.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = 42;
					set T = 43;
				}`).varCheck(), ReferenceErrorKind);
			});
		});


		describe('#typeCheck', () => {
			context('for variable reassignment.', () => {
				it('throws when variable assignee type is not supertype.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
						let var i: int = 42;
						set i = 4.3;
					}`);
					goal.varCheck();
					assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
				it('allows reassignment when uninitialized.', () => {
					assert.partialDeepStrictEqual(setupScript(`{
						let var x?: int;
						set x = 42;
					}`, null, {build: false}).goal.block!.validator.getSymbolInfo(0x100n), {
						isUnfixed:       true,
						isUninitialized: true,
						type:            TYPE.INT,
						value:           null,
					});
				});
				it('does not allow reassignment of `null` when uninitialized.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
						let var x?: int;
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

			context('for property reassignment.', () => {
				it('allows assignment directly on objects.', () => {
					setupScript(`{
						set List.<int>((42,)).[0]                 = 42;
						set Dict.<int>((i= 42)).[@i]              = 42;
						set Set.<int>((42,)).[43]                 = false;
						set Map.<bool, int>(((true, 42),)).[true] = 42;
					}`, null, {build: false}); // assert does not throw
				});
				it('throws when property assignee type is not supertype.', () => {
					[
						`{
							let l: mut [int] = [42];
							set l.[0] = 4.2;
						}`,
						`{
							let d: mut [:int] = [i= 42];
							set d.[@i] = 4.2;
						}`,
						`{
							let s: mut {int} = {42};
							set s.[42] = 4.2;
						}`,
						`{
							let m: mut {bool -> int} = {true -> 42};
							set m.[true] = 4.2;
						}`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
					});
				});
				it('throws when Set/Map accessor expression is not a valid type.', () => {
					xjs.Array.forEachAggregated([`{
						let s: mut {int} = {42};
						set s.[4.3] = true;
					}`, `{
						let m: mut {bool -> int} = {true -> 42};
						set m.["true"] = 43;
					}`], (src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotNarrow);
					});
				});
				it('throws when assignee’s base type is not mutable.', () => {
					[
						`{
							let t: (int,) = (42,);
							set t.0 = 43;
						}`,
						`{
							let r: (i: int) = (i= 42);
							set r.i = 43;
						}`,
						`{
							let l: [int] = [42];
							set l.[0] = 43;
						}`,
						`{
							let d: [:int] = [i= 42];
							set d.[@i] = 43;
						}`,
						`{
							let s: {int} = {42};
							set s.[43] = true;
						}`,
						`{
							let m: {bool -> int} = {true -> 42};
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


		describe('#build', () => {
			it('always returns `(local.set)`.', () => {
				const {stmts, mod} = setupScript(`{
					let var y: float = 4.2;
					set y = y * 10.0;
				}`);
				return assertEqualBins(
					stmts[1].build(),
					mod.local.set(0, (stmts[1] as AST.ASTNodeDeclarationReassignment).assigned.build()),
				);
			});
			it('allows switching between union members.', () => {
				const {stmts, mod} = setupScript(`{
					let var x: float | int = 4.2;
					let var y: int | float = 4.2;
					set x = 8.4;
					set x = 16;
					set x = x;
					set x = y;
				}`);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					stmts.slice(2).map((stmt) => mod.local.set(0, (stmt as AST.ASTNodeDeclarationReassignment).assigned.build())),
				);
			});
		});
	});
});
