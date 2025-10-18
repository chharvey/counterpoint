import * as assert from 'assert';
import binaryen from 'binaryen';
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
				assert.ok(!goal.validator.hasSymbol(0x100n));
				goal.varCheck();
				assert.ok(goal.validator.hasSymbol(0x100n));
				const info: SymbolSchema | null = goal.validator.getSymbolInfo(0x100n);
				assert_instanceof(info, SymbolSchemaType);
				assert.strictEqual(info.typevalue, TYPE.ANYTHING);
			});
			it('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
					type _ = str;
				}`);
				assert.ok(!goal.validator.hasSymbol(256n));
				goal.varCheck();
				return assert.ok(!goal.validator.hasSymbol(256n));
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
			it('allows duplicate declaration of blank identifier.', () => {
				AST.ASTNodeGoal.fromSource(`{
					type _ = int | float;
					type _ = [str, bool];
				}`).varCheck(); // assert does not throw
			});
		});


		describe('#typeCheck', () => {
			it('sets `SymbolSchemaType#typevalue`.', () => {
				assert.strictEqual(
					(setupScript(`{
						type T = int;
					}`, null, {build: false}).goal.validator.getSymbolInfo(0x100n) as SymbolSchemaType).typevalue,
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
				assert.ok(!goal.validator.hasSymbol(0x100n));
				assert.ok(!goal.validator.hasSymbol(0x101n));
				assert.ok(!goal.validator.hasSymbol(0x102n));
				goal.varCheck();
				assert.ok(goal.validator.hasSymbol(0x100n));
				assert.ok(goal.validator.hasSymbol(0x101n));
				assert.ok(goal.validator.hasSymbol(0x102n));
				const info_a: SymbolSchema | null = goal.validator.getSymbolInfo(0x100n);
				const info_b: SymbolSchema | null = goal.validator.getSymbolInfo(0x101n);
				const info_c: SymbolSchema | null = goal.validator.getSymbolInfo(0x102n);
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
				assert.ok(!goal.validator.hasSymbol(256n));
				goal.varCheck();
				return assert.ok(!goal.validator.hasSymbol(256n));
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
				}`, null, {build: false}).goal.validator.getSymbolInfo(0x100n), {
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
					let immut:  int[3]         = [42, 420, 4200];
					let 'mut':  mut int[]      = List.<int>([42, 420, 4200]);
					let mutmut: (mut int[])[3] = [List.<int>([42]), List.<int>([420]), List.<int>([4200])];
				}`, null, {build: false});
				const [immut, mut, mutmut] = [
					goal.validator.getSymbolInfo(0x100n) as SymbolSchemaVar,
					goal.validator.getSymbolInfo(0x101n) as SymbolSchemaVar,
					goal.validator.getSymbolInfo(0x102n) as SymbolSchemaVar,
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
					let l: List.<int | str> = List.<int>([42, 43]);
					let d: Dict.<int | str> = Dict.<int>([a= 42, b= 43]);
					let s: Set.<int | str>  = Set.<int>([42, 43]);

					let mk: Map.<int | str, bool>       = Map.<int, bool>([[42, false], [43, true]]);
					let mv: Map.<int,       bool | str> = Map.<int, bool>([[42, false], [43, true]]);
					let m:  Map.<int | str, bool | str> = Map.<int, bool>([[42, false], [43, true]]);
				`);
			});
			it('mutable lists/dicts/sets/maps should not be covariant.', () => {
				typeCheckGoal(extract_lines`
					let l: mut List.<int | str> = List.<int>([42, 43]);
					let d: mut Dict.<int | str> = Dict.<int>([a= 42, b= 43]);
					let s: mut Set.<int | str>  = Set.<int>([42, 43]);

					let mk: mut Map.<int | str, bool>       = Map.<int, bool>([[42, false], [43, true]]);
					let mv: mut Map.<int,       bool | str> = Map.<int, bool>([[42, false], [43, true]]);
					let m:  mut Map.<int | str, bool | str> = Map.<int, bool>([[42, false], [43, true]]);
				`, TypeErrorNotAssignable);
			});
			it('assigning collection literals.', () => {
				typeCheckGoal(`{
					let c: int[3] = [42, 420, 4200];
					let d: [n42: int, n420: int] = [
						n42=  42,
						n420= 420,
					];
					let v: [   int,    str] = [   42,    "hello"];
					let s: [a: int, b: str] = [a= 42, b= "hello"];
				}`);
			});
			it('allows assigning a collection literal to super reference type (autoboxing at runtime).', () => {
				typeCheckGoal(`{
					let v: anything = [   42,    "hello"];
					let s: anything = [a= 42, b= "hello"];
				}`);
				typeCheckGoal(`{
					let v: mut anything = [   42,    "hello"];
					let s: mut anything = [a= 42, b= "hello"];
				}`); // mut anything == anything
			});
			context('assigning a collection literal to a wider mutable type.', () => {
				it('disallows assigning Tuples/Records to Lists/Dicts', () => {
					typeCheckGoal(`
						let t1_1: List.<42 | 4.3> = [42];
						let t2_1: List.<int>      = [42];

						let t1_2: mut List.<42 | 4.3> = [43];
						let t2_2: mut List.<int>      = [43];

						let r1_1: Dict.<42 | 4.3> = [a= 42];
						let r2_1: Dict.<int>      = [a= 42];

						let r1_2: mut Dict.<42 | 4.3> = [a= 43];
						let r2_2: mut Dict.<int>      = [a= 43];

						let t3_1: [           List.<float>] = [       [4.3]];
						let t3_2: [       mut List.<float>] = [       [4.3]];
						let r3_1: [inner:     List.<float>] = [inner= [4.3]];
						let r3_2: [inner: mut List.<float>] = [inner= [4.3]];
					`.split('\n'), TypeErrorNotAssignable);
				});
				it('allows assigning Sets and Maps.', () => {
					typeCheckGoal(`{
						let s: mut (int | str){} = {42,   "43"};
						let m: mut {int -> str}  = {42 -> "43"};
						set s.["44"] = true;
						set m.[44]   = "45";
					}`);
					return typeCheckGoal(`{
						let tuple_of_set:  [   mut int{}]        = [   {42}];
						let tuple_of_map:  [   mut {int -> str}] = [   {42 -> "hello"}];
						let record_of_set: [k: mut int{}]        = [k= {42}];
						let record_of_map: [k: mut {int -> str}] = [k= {42 -> "hello"}];
						set tuple_of_set.0.[43]  = true;
						set tuple_of_map.0.[43]  = "world";
						set record_of_set.k.[43] = true;
						set record_of_map.k.[43] = "world";
					}`);
				});
				it('should throw when assigning combo type to union.', () => {
					typeCheckGoal(`
						let x: [   bool,    int] | [   int,    bool] = [   true,    false];
						let x: [a: bool, b: int] | [a: int, b: bool] = [a= true, b= false];
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
						type Employee = [
							name:         str,
							id:           int,
							job_title:    str,
							hours_worked: float,
						];
						type Volunteer = [
							name:         str,
							agency:       str,
							hours_worked: float,
						];
						let bob: Employee | Volunteer = [
							name=         "Bob", %: str
							hours_worked= 80.0,  %: float
						];
					}`, (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorNotAssignable, message: 'Expression of type `[256: "Bob", 259: 80.0]` is not assignable to type `[256: str, 257: int, 258: str, 259: float]`.'},
								{cons: TypeErrorNotAssignable, message: 'Expression of type `[256: "Bob", 259: 80.0]` is not assignable to type `[256: str, 261: str, 259: float]`.'},
							],
						});
						return true;
					});
				});
				it('throws when not assigned to correct type.', () => {
					typeCheckGoal(`
						let s: mut {int -> str}  = {42,   "43"};
						let s: mut (int | str){} = {42 -> "43"};
					`.split('\n'), TypeErrorNotAssignable);
					typeCheckGoal(`{
						let t1: mut anything              = [42, "43"];
						let t4: mut ([int, str] | Object) = [42, "43"];

						let r1: mut anything                    = [a= 42, b= "43"];
						let r4: mut ([a: int, b: str] | Object) = [a= 42, b= "43"];

						let s1: mut (42 | 4.3){}            = {42};
						let s2: mut (int | float){}         = {42};
						let s3: mut Object                  = {42};
						let s4: mut (int{} | {str -> bool}) = {42};
						let s5: mut (int{} | Object)        = {42};

						let m1: mut {int -> float}            = {42 -> 4.3};
						let m2: mut {int? -> float?}          = {42 -> 4.3};
						let m3: mut Object                    = {42 -> 4.3};
						let m4: mut ({int -> float} | str{})  = {42 -> 4.3};
						let m5: mut ({int -> float} | Object) = {42 -> 4.3};
					}`);
				});
				it('throws when entries mismatch.', () => {
					typeCheckGoal(`
						let s1: mut int{} = {"42"};
						let s2: mut int{} = {42, "43"};

						let m1: mut {int -> str} = {4.2 -> "43"};
						let m2: mut {int -> str} = {42  -> 4.3};
					`.split('\n'), TypeErrorNotAssignable);
					typeCheckGoal(`{
						let s3: mut (bool | str){} = {46, 47};

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
			it('with constant folding on.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let a: int  = 42;     % fixed, foldable: \`(nop)\`
					let b: int  = 42 * a; % fixed, foldable: \`(nop)\`
					let _: bool = true;   % blank, foldable: \`(nop)\`

					let var c: int = 42;     % unfixed, foldable: \`(local.set)\`
					let d:     int = c + 10; % fixed, unfoldable: \`(local.set)\`
					let _:     int = c + 10; % blank, unfoldable: \`(drop)\`

					let var e?: bool; % assignee, uninitialized: \`(local.set)\`
					let var _?: bool; % blank, uninitialized:    \`(nop)\`
				}`);
				assert.deepStrictEqual(goal.builder.getLocals().map(({id, type}) => ({id, type})), [
					{id: 0x102n, type: binaryen.v128},
					{id: 0x103n, type: binaryen.v128},
					{id: 0x104n, type: binaryen.v128},
				]);
				return assertEqualBins(
					stmts.map((stmt) => stmt.build()),
					[
						mod.nop(),
						mod.nop(),
						mod.nop(),

						mod.local.set(0, (stmts[3] as AST.ASTNodeDeclarationVariable).assigned!.build()),
						mod.local.set(1, (stmts[4] as AST.ASTNodeDeclarationVariable).assigned!.build()),
						mod.drop(        (stmts[5] as AST.ASTNodeDeclarationVariable).assigned!.build()),

						mod.local.set(2, VALUE.NULL.build(goal.builder)),
						mod.nop(),
					],
				);
			});
			it('with constant folding off, never returns `(nop)`.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let a:     int   = 42;   % fixed, foldable:   \`(local.set)\` instead of \`(nop)\`
					let _:     bool  = true; % blank, foldable:   \`(drop)\`      instead of \`(nop)\`
					let var b: float = 4.2;  % unfixed, foldable: \`(local.set)\` (same behavior)
					let _:     bool  = !b;   % blank, unfoldable: \`(drop)\`      (same behavior)

					let var c?: bool; % assignee, uninitialized: \`(local.set)\` (same behavior)
					let var _?: bool; % blank, uninitialized:    \`(nop)\`       (same behavior)
				}`, CONFIG_FOLDING_OFF);
				assert.deepStrictEqual(goal.builder.getLocals().map(({id, type}) => ({id, type})), [
					{id: 0x100n, type: binaryen.v128},
					{id: 0x101n, type: binaryen.v128},
					{id: 0x102n, type: binaryen.v128},
				]);
				return assertEqualBins(
					stmts.map((stmt) => stmt.build()),
					[
						mod.local.set(0, (stmts[0] as AST.ASTNodeDeclarationVariable).assigned!.build()),
						mod.drop(        (stmts[1] as AST.ASTNodeDeclarationVariable).assigned!.build()),
						mod.local.set(1, (stmts[2] as AST.ASTNodeDeclarationVariable).assigned!.build()),
						mod.drop(        (stmts[3] as AST.ASTNodeDeclarationVariable).assigned!.build()),

						mod.local.set(2, VALUE.NULL.build(goal.builder)),
						mod.nop(),
					],
				);
			});
			it('tuples and records.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let tup: [   int,    float,    [   null,    [   null,    bool]]] = [   42,    4.2,    [   null,    [   null,    true]]];
					let rec: [a: int, b: float, c: [d: null, e: [f: null, g: bool]]] = [a= 42, b= 4.2, c= [d= null, e= [f= null, g= true]]];
				}`, CONFIG_FOLDING_OFF);
				const [tup, rec] = stmts.map((stmt) => (stmt as AST.ASTNodeDeclarationVariable).assigned) as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				const [tup_2, rec_c]         = [tup.children[2],   rec.children[2].val]   as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				const [tup_2_1, rec_c_e]     = [tup_2.children[1], rec_c.children[1].val] as [AST.ASTNodeTuple, AST.ASTNodeRecord];
				assert.deepStrictEqual(goal.builder.getLocals().map(({id, value}) => ({id, value})), [
					{id: -0x40n,  value: tup_2_1.build()},
					{id: -0x3fn,  value: tup_2.build()},
					{id:  0x100n, value: tup.build()},
					{id: -0x3en,  value: rec_c_e.build()},
					{id: -0x3dn,  value: rec_c.build()},
					{id:  0x108n, value: rec.build()},
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
					'let tup: [   int,    float,    [   null,    bool],    [g: bool, h: int],    [[j: float]]] = [   42,    4.2,    [   null,    true],    [g= false, h= 42],    [[j= 4.2]]];',
					'let rec: [a: int, b: float, c: [d: null, e: bool], f: [   bool,    int], i: [k: [float]]] = [a= 42, b= 4.2, c= [d= null, e= true], f= [   false,    42], i= [k= [4.2]]];',
				].forEach((src) => {
					const {goal} = setupScript(`{ ${ src } }`, CONFIG_FOLDING_OFF, {build: false});
					return assert.throws(() => goal.build(), /not yet supported/);
				});
			});
		});
	});


	describe('ASTNodeDeclarationClaim', () => {
		describe('#typeCheck', () => {
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
			it('allows claim after reassignment.', () => {
				setupScript(`{
					let var x: bool | null = false;
					set x = true;
					claim x: null;
				}`, null, {build: false}); // assert does not throw
			});
			it('disallows reassigning incorrect type after claim.', () => {
				const {stmts} = setupScript(`{
					let var x: bool | null = false;
					claim x: null;
					set x = true;
				}`, null, {typeCheck: false});
				stmts[0].typeCheck(); // assert does not throw
				stmts[1].typeCheck(); // assert does not throw
				return assert.throws(() => stmts[2].typeCheck(), TypeErrorNotAssignable);
			});
			it.skip('allows narrowing tuple/record properties.', () => {
				setupScript(`{
					let var tuple: [int | null, [value: int | null]] = [null, [value= 42]];
					claim tuple.0:       int;
					claim tuple.1.value: null;
				}`, null, {build: false}); // assert does not throw
			});
			it.skip('disallows mutating incorrect type after claim.', () => {
				const {stmts} = setupScript(`{
					let var record: [value: int | null, tuple: [int | null]] = [value= null, tuple= [42]];
					claim record.value:   int;
					claim record.tuple.0: null;
					set record = [value= null, tuple= [42]];
				}`, null, {typeCheck: false});
				xjs.Array.forEachAggregated(stmts.slice(0, -1), (stmt) => stmt.typeCheck()); // assert does not throw
				return assert.throws(() => stmts.at(-1)!.typeCheck(), TypeErrorNotAssignable);
			});
			it.skip('allows mutating correct type after claim.', () => {
				setupScript(`{
					let var record: [value: int | null, tuple: [int | null]] = [value= null, tuple= [42]];
					claim record.value:   int;
					claim record.tuple.0: null;
					set record = [value= 43, tuple= [null]];
				}`, null, {build: false}); // assert does not throw
			});
			it.skip('accessing property after claim is narrowed.', () => {
				const {stmts} = setupScript(`{
					let var record: [value: int | null, tuple: [int | null]] = [value= null, tuple= [42]];
					record.value;               % type \`int | null\`
					record.tuple.0;             % type \`[int | null]\`
					claim record.value:   null;
					claim record.tuple.0: int;
					record.value;               % type \`null\`
					record.tuple.0;             % type \`int\`
				}`, null, {build: false});
				const INT_NULL: TYPE.Type = TYPE.INT.union(TYPE.NULL);
				assert.deepStrictEqual(
					stmts.slice(1, 3).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
					[INT_NULL, TYPE.Tuple.fromTypes([INT_NULL])],
				);
				return assert.deepStrictEqual(
					stmts.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
					[TYPE.NULL, TYPE.INT],
				);
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
					}`, null, {build: false}).goal.validator.getSymbolInfo(0x100n), {
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
					assert.partialDeepStrictEqual(goal.validator.getSymbolInfo(0x100n), {
						isUnfixed:       true,
						isUninitialized: true,
					});
					return assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
			});

			context('for property reassignment.', () => {
				it('allows assignment directly on objects.', () => {
					setupScript(`{
						set List.<int>([42]).[0]                 = 42;
						set Dict.<int>([i= 42]).[@i]             = 42;
						set Set.<int>([42]).[43]                 = false;
						set Map.<bool, int>([[true, 42]]).[true] = 42;
					}`, null, {build: false}); // assert does not throw
				});
				it('throws when property assignee type is not supertype.', () => {
					[
						`{
							let l: mut int[] = List.<int>([42]);
							set l.[0] = 4.2;
						}`,
						`{
							let d: mut [:int] = Dict.<int>([i= 42]);
							set d.[@i] = 4.2;
						}`,
						`{
							let s: mut int{} = Set.<int>([42]);
							set s.[42] = 4.2;
						}`,
						`{
							let m: mut {bool -> int} = Map.<bool, int>([[true, 42]]);
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
						let s: mut int{} = Set.<int>([42]);
						set s.[4.3] = true;
					}`, `{
						let m: mut {bool -> int} = Map.<bool, int>([[true, 42]]);
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
							let t: [int] = [42];
							set t.0 = 43;
						}`,
						`{
							let r: [i: int] = [i= 42];
							set r.i = 43;
						}`,
						`{
							let l: int[] = List.<int>([42]);
							set l.[0] = 43;
						}`,
						`{
							let d: [:int] = Dict.<int>([i= 42]);
							set d.[@i] = 43;
						}`,
						`{
							let s: int{} = Set.<int>([42]);
							set s.[43] = true;
						}`,
						`{
							let m: {bool -> int} = Map.<bool, int>([[true, 42]]);
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
