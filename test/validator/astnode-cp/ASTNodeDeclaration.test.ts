import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	AST,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	AssignmentErrorDuplicateDeclaration,
	TypeErrorNotAssignable,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {
	assertEqualBins,
	assertAssignable,
} from '../../assert-helpers.js';
import {setupScript} from '../../helpers.js';
import {extract_lines} from '../../utils.ts';



test.suite('ASTNodeDeclaration', () => {
	test.suite('#varCheck', () => {
		test.suite('ASTNodeDeclarationType', () => {
			test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
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
			test.test('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					type _ = str;
				}`);
				assert.ok(!goal.block!.validator.hasSymbol(0x100n));
				goal.varCheck();
				return assert.ok(!goal.block!.validator.hasSymbol(0x100n));
			});
			test.test('throws if the validator already contains a record for the symbol.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = int;
					type T = float;
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let FOO: int = 42;
					type FOO = float;
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3] do {
						type it = int;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = int;
					if true then {
						type T = float;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = int;
					while false do {
						type T = float;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type T = int;
					for it: float in [1.1, 2.2, 3.3] do {
						type T = float;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			test.test('allows duplicate declaration of blank identifier.', () => {
				AST.ASTNodeGoal.fromSource(`{
					type _ = int | float;
					type _ = (str, bool);
				}`).varCheck(); // assert does not throw
			});
		});

		test.suite('ASTNodeDeclarationVariable', () => {
			test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything` and a preset null `value` value.', () => {
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
			test.test('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					let _: float = 4.2;
				}`);
				assert.ok(!goal.block!.validator.hasSymbol(0x100n));
				goal.varCheck();
				return assert.ok(!goal.block!.validator.hasSymbol(0x100n));
			});
			test.test('throws if the validator already contains a record for the variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let i: int = 42;
					let i: int = 43;
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type FOO = float;
					let FOO: int = 42;
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3] do {
						let it: int = 42;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let var x: int = 42;
					if true then {
						let var x: float = 4.2;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let var x: int = 42;
					while false do {
						let var x: float = 4.2;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					let var x: int = 42;
					for it: float in [1.1, 2.2, 3.3] do {
						let var x: float = 4.2;
					};
				}`).varCheck(), AssignmentErrorDuplicateDeclaration);
			});
			test.test('allows duplicate declaration of blank identifier.', () => {
				AST.ASTNodeGoal.fromSource(`{
					let _: int = 42;
					let _: str = "the answer";
				}`).varCheck(); // assert does not throw
			});
		});
	});


	test.suite('#typeCheck', () => {
		test.suite('ASTNodeDeclarationType', () => {
			test.test('sets `SymbolSchemaType#typevalue`.', () => {
				assert.strictEqual(
					(setupScript(`{
						type T = int;
					}`, {build: false}).goal.block!.validator.getSymbolInfo(0x100n) as SymbolSchemaType).typevalue,
					TYPE.INT,
				);
			});
		});

		test.suite('ASTNodeDeclarationVariable', () => {
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
			test.test('checks the assigned expression’s type against the variable assignee’s type.', () => {
				setupScript(`{
					let the_answer: nat = +42;
				}`, {build: false}); // assert does not throw
				const var_: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(`
					let  the_answer:  int | float =  21  *  2;
				`);
				var_.varCheck();
				return var_.typeCheck();
			});
			test.test('passes when assigned is structurally assignable.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					let n: Name = "Alice";
					let n: Name = "Alice" as <str>;
					let n: Name = "Alice" as <"Alice">;
					let n: Name = "Alice" as <Name>;
				`, (stmt) => {
					setupScript(`{
						type Name = str;
						${ stmt }
					}`, {build: false}); // assert does not throw
				});
			});
			test.test('passes typechecking when uninitialized.', () => {
				assert.partialDeepStrictEqual(setupScript(`{
					let var the_answer?: int | float;
				}`, {build: false}).goal.block!.validator.getSymbolInfo(0x100n), {
					isUnfixed:       true,
					isUninitialized: true,
					type:            TYPE.INT.union(TYPE.FLOAT),
					value:           null,
				});
			});
			test.test('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
				assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
					let  the_answer:  null =  21  *  2;
				`).typeCheck(), TypeErrorNotAssignable);
			});
			test.test('throws when assigning int to float.', () => {
				assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
					let x: float = 42;
				`).typeCheck(), TypeErrorNotAssignable);
			});
			test.test('does not set `SymbolSchemaVar#value` when assignee type has mutable.', () => {
				const {goal} = setupScript(`{
					let immut:  (int, int, int)                   = (42, 420, 4200);
					let 'mut':  mut [int]                         = [42, 420, 4200];
					let mutmut: (mut [int], mut [int], mut [int]) = ([42], [420], [4200]);
				}`, {build: false});
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
			test.test('immutable lists/dicts/sets/maps should be covariant.', () => {
				typeCheckGoal(extract_lines`
					let l: List.<int | str> = List.<int>((42, 43));
					let d: Dict.<int | str> = Dict.<int>((a= 42, b= 43));
					let s: Set.<int | str>  = Set.<int>((42, 43));

					let mk: Map.<int | str, bool>       = Map.<int, bool>(((42, false), (43, true)));
					let mv: Map.<int,       bool | str> = Map.<int, bool>(((42, false), (43, true)));
					let m:  Map.<int | str, bool | str> = Map.<int, bool>(((42, false), (43, true)));
				`);
			});
			test.test('mutable lists/dicts/sets/maps should not be covariant.', () => {
				typeCheckGoal(extract_lines`
					let l: mut List.<int | str> = List.<int>((42, 43));
					let d: mut Dict.<int | str> = Dict.<int>((a= 42, b= 43));
					let s: mut Set.<int | str>  = Set.<int>((42, 43));

					let mk: mut Map.<int | str, bool>       = Map.<int, bool>(((42, false), (43, true)));
					let mv: mut Map.<int,       bool | str> = Map.<int, bool>(((42, false), (43, true)));
					let m:  mut Map.<int | str, bool | str> = Map.<int, bool>(((42, false), (43, true)));
				`, TypeErrorNotAssignable);
			});
			test.test('assigning collection literals.', () => {
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
			test.test('allows assigning a collection literal to super reference type (autoboxing at runtime).', () => {
				typeCheckGoal(`{
					let v: anything = (   42,    "hello");
					let s: anything = (a= 42, b= "hello");
				}`);
				typeCheckGoal(`{
					let v: mut anything = (   42,    "hello");
					let s: mut anything = (a= 42, b= "hello");
				}`); // mut anything == anything
			});
			test.suite('assigning a collection literal to a wider mutable type.', () => {
				test.test('disallows assigning Tuples/Records to Lists/Dicts', () => {
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
				test.test('allows assigning Lists, Dicts, Sets, and Maps.', () => {
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
				test.test('should throw when assigning combo type to union.', () => {
					typeCheckGoal(`
						let x: (   bool,    int) | (   int,    bool) = (   true,    false);
						let x: (a: bool, b: int) | (a: int, b: bool) = (a= true, b= false);
					`.split('\n'), (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorNotAssignable, message: 'Expression `false` is not assignable to type `int`.'},
								{cons: TypeErrorNotAssignable, message: 'Expression `true` is not assignable to type `int`.'},
							],
						});
						return true;
					});
					const BOB: string = `
						(
							name=         "Bob", %: str
							hours_worked= 80.0,  %: float
						)
					`.trim();
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
						let bob: Employee | Volunteer = ${ BOB };
					}`, (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorNotAssignable, message: `Expression \`${ BOB }\` is not assignable to type \`(256: str, 257: int, 258: str, 259: float)\`.`},
								{cons: TypeErrorNotAssignable, message: `Expression \`${ BOB }\` is not assignable to type \`(256: str, 261: str, 259: float)\`.`},
							],
						});
						return true;
					});
				});
				test.test('throws when not assigned to correct type.', () => {
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
				test.test('throws when entries mismatch.', () => {
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
										{cons: TypeErrorNotAssignable, message: 'Expression `46` is not assignable to type `bool | str`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression `47` is not assignable to type `bool | str`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression `1` is not assignable to type `str`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression `2.0` is not assignable to type `str`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression `3` is not assignable to type `bool`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression `4.0` is not assignable to type `bool`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression `5` is not assignable to type `str`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression `6.0` is not assignable to type `bool`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{cons: TypeErrorNotAssignable, message: 'Expression `7` is not assignable to type `str`.'},
										{cons: TypeErrorNotAssignable, message: 'Expression `8.0` is not assignable to type `bool`.'},
									],
								},
								{
									cons:   AggregateError,
									errors: [
										{
											cons:   AggregateError,
											errors: [
												{cons: TypeErrorNotAssignable, message: 'Expression `9` is not assignable to type `str`.'},
												{cons: TypeErrorNotAssignable, message: 'Expression `"a"` is not assignable to type `bool`.'},
											],
										},
										{
											cons:   AggregateError,
											errors: [
												{cons: TypeErrorNotAssignable, message: 'Expression `10.0` is not assignable to type `str`.'},
												{cons: TypeErrorNotAssignable, message: 'Expression `"b"` is not assignable to type `bool`.'},
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
	});


	test.suite('#build', () => {
		test.suite('ASTNodeDeclarationType', () => {
			test.test('always returns `(nop)`.', () => {
				const {stmts, mod} = setupScript(`{
					type T = int;
					type U = T | float;
				}`);
				return xjs.Array.forEachAggregated(stmts, (stmt) => assertEqualBins(stmt.build(), mod.nop()));
			});
		});

		test.suite('ASTNodeDeclarationVariable', () => {
			test.test('with constant folding on.', () => {
				const {goal, stmts, mod} = setupScript(`{
					% Foldable cases:
					let var _?:         int;               % \`(nop)\`
					let     _:          int = 42;          % \`(nop)\`
					let var _:          int = 42;          % \`(nop)\`
					let     assignee_a: int = 42;          % \`(nop)\`

					% Non-Foldable cases:
					let var assignee_b?: int;              % \`(local.set)\`
					let var assignee_c:  int = 42;         % \`(local.set)\`
					let     _:           int = assignee_c; % \`(drop)\`
					let var _:           int = assignee_c; % \`(drop)\`
					let     assignee_d:  int = assignee_c; % \`(local.set)\`
					let var assignee_e:  int = assignee_c; % \`(local.set)\`

					%% Syntactically impossible cases (for completion):
					let _?:         int;
					let assignee6?: int;
					%%
				}`);
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
			test.test('tuples and records.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let var tr: bool = true;
					let tup: (   int,    float,    (   null,    (   null,    bool))) = (   42,    4.2,    (   null,    (   null,    tr)));
					let rec: (a: int, b: float, c: (d: null, e: (f: null, g: bool))) = (a= 42, b= 4.2, c= (d= null, e= (f= null, g= tr)));
				}`);
				const [tup, rec] = stmts.slice(1).map((stmt) => (stmt as AST.ASTNodeDeclarationVariable).assigned) as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				const [tup_2, rec_c]         = [tup.children[2],   rec.children[2].val]   as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				const [tup_2_1, rec_c_e]     = [tup_2.children[1], rec_c.children[1].val] as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				assert.deepStrictEqual(goal.builder.getLocals().slice(1).map((local) => local.value), [
					tup_2_1.build(),
					tup_2.build(),
					tup.build(),
					rec_c_e.build(),
					rec_c.build(),
					rec.build(),
				]);
				return assertEqualBins(
					stmts.slice(1).map((stmt) => stmt.build()),
					[
						mod.local.set(3, tup.build()),
						mod.local.set(6, rec.build()),
					],
				);
			});
			test.test('throws when tuples and records contain each other.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					let var tup: (   int,    float,    (   null,    bool),    (g: bool, h: int),    ((j: float),)) = (   42,    4.2,    (   null,    true),    (g= false, h= 42),    ((j= 4.2),));
					let var rec: (a: int, b: float, c: (d: null, e: bool), f: (   bool,    int), i: (k: (float,))) = (a= 42, b= 4.2, c= (d= null, e= true), f= (   false,    42), i= (k= (4.2,)));
				`, (src) => {
					const {goal} = setupScript(`{ ${ src } }`, {build: false});
					return assert.throws(() => goal.build(), /not yet supported/);
				});
			});
		});
	});
});
