import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	assert_instanceof,
	AST,
	type SymbolSchema,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	AssignmentErrorDuplicateDeclaration,
	TypeErrorNotAssignable,
} from '../../../src/index.ts';
import {
	assertAssignable,
	assertEqualBins,
} from '../../assert-helpers.ts';
import {
	CONFIG_FOLDING_OFF,
	CONFIG_COERCION_OFF,
} from '../../helpers.ts';
import {extract_lines} from '../../utils.ts';



describe('ASTNodeDeclarationVariable', () => {
	describe('#varCheck', () => {
		it('adds a SymbolSchema to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let     a:  int = 42;
				let var b:  int = 42;
				let var c?: int;
			`);
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
				unfixed:       false,
				uninitialized: false,
				type:          TYPE.UNKNOWN,
				value:         null,
			});
			assert.partialDeepStrictEqual(info_b, {
				unfixed:       true,
				uninitialized: false,
				type:          TYPE.UNKNOWN,
				value:         null,
			});
			assert.partialDeepStrictEqual(info_c, {
				unfixed:       true,
				uninitialized: true,
				type:          TYPE.UNKNOWN,
				value:         null,
			});
		});

		it('for blank identifiers, does not add to symbol table.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let _: float = 4.2;
			`);
			assert.ok(!goal.validator.hasSymbol(256n));
			goal.varCheck();
			return assert.ok(!goal.validator.hasSymbol(256n));
		});

		it('throws if the validator already contains a record for the variable.', () => {
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				let i: int = 42;
				let i: int = 43;
			`).varCheck(), AssignmentErrorDuplicateDeclaration);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				type FOO = float;
				let FOO: int = 42;
			`).varCheck(), AssignmentErrorDuplicateDeclaration);
		});

		it('allows duplicate declaration of blank identifier.', () => {
			AST.ASTNodeGoal.fromSource(`
				let _: int = 42;
				let _: str = "the answer";
			`).varCheck(); // assert does not throw
		});
	});


	describe('#typeCheck', () => {
		function typeCheckGoal(src: string | string[], expect_thrown?: Parameters<typeof assert.throws>[1]): void {
			if (src instanceof Array) {
				return src
					.map((s) => s.trim())
					.filter((s) => !!s)
					.forEach((s) => typeCheckGoal(s, expect_thrown));
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

		it('passes typechecking when uninitialized.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let var the_answer?: int | float;
			`);
			goal.varCheck();
			goal.typeCheck();
			return assert.partialDeepStrictEqual(goal.validator.getSymbolInfo(0x100n), {
				unfixed:       true,
				uninitialized: true,
				type:          TYPE.INT.union(TYPE.FLOAT),
				value:         null,
			});
		});

		it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  null =  21  *  2;
			`).typeCheck(), TypeErrorNotAssignable);
		});

		it('with int coersion on, allows assigning ints to floats.', () => {
			const var_: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(`
				let x: float = 42;
			`);
			var_.varCheck();
			return var_.typeCheck();
		});

		it('with int coersion off, throws when assigning int to float.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let x: float = 42;
			`, CONFIG_COERCION_OFF).typeCheck(), TypeErrorNotAssignable);
		});
		it('does not set `SymbolSchemaVar#value` when assignee type has mutable.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let immut:  int[3]         = [42, 420, 4200];
				let 'mut':  mut int[]      = List.<int>([42, 420, 4200]);
				let mutmut: (mut int[])[3] = [List.<int>([42]), List.<int>([420]), List.<int>([4200])];
			`);
			goal.varCheck();
			goal.typeCheck();
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
			typeCheckGoal(`
				let c: int[3] = [42, 420, 4200];
				let d: [n42: int, n420: int] = [
					n42=  42,
					n420= 420,
				];
				let v: [   int,    str] = [   42,    "hello"];
				let s: [a: int, b: str] = [a= 42, b= "hello"];
			`);
		});
		it('allows assigning a collection literal to super reference type (autoboxing at runtime).', () => {
			typeCheckGoal(`
				let v: unknown = [   42,    "hello"];
				let s: unknown = [a= 42, b= "hello"];
			`);
			typeCheckGoal(`
				let v: mut unknown = [   42,    "hello"];
				let s: mut unknown = [a= 42, b= "hello"];
			`); // mut unknown == unknown
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
				typeCheckGoal(`
					let s: mut (int | str){} = {42,   "43"};
					let m: mut {int -> str}  = {42 -> "43"};
					s.["44"] = true;
					m.[44]   = "45";
				`);
				return typeCheckGoal(`
					let tuple_of_set:  [   mut int{}]        = [   {42}];
					let tuple_of_map:  [   mut {int -> str}] = [   {42 -> "hello"}];
					let record_of_set: [k: mut int{}]        = [k= {42}];
					let record_of_map: [k: mut {int -> str}] = [k= {42 -> "hello"}];
					tuple_of_set.0.[43]  = true;
					tuple_of_map.0.[43]  = "world";
					record_of_set.k.[43] = true;
					record_of_map.k.[43] = "world";
				`);
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
				return typeCheckGoal(`
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
				`, (err) => {
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
				typeCheckGoal(`
					let t1: mut unknown               = [42, "43"];
					let t4: mut ([int, str] | Object) = [42, "43"];

					let r1: mut unknown                     = [a= 42, b= "43"];
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
				`);
			});
			it('throws when entries mismatch.', () => {
				typeCheckGoal(`
					let s1: mut int{} = {"42"};
					let s2: mut int{} = {42, "43"};

					let m1: mut {int -> str} = {4.2 -> "43"};
					let m2: mut {int -> str} = {42  -> 4.3};
				`.split('\n'), TypeErrorNotAssignable);
				typeCheckGoal(`
					let s3: mut (bool | str){} = {46, 47};

					let m3_1: mut {str -> bool} = {1 -> false, 2.0 -> true};
					let m3_2: mut {str -> bool} = {"a" -> 3,   "b" -> 4.0};
					let m3_3: mut {str -> bool} = {5 -> false, "b" -> 6.0};
					let m3_4: mut {str -> bool} = {7 -> 8.0};
					let m3_5: mut {str -> bool} = {9 -> "a", 10.0 -> "b"};
				`, (err) => {
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
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let a: int   = 42;      % fixed, foldable: \`(nop)\`
				let b: float = 4.2 * a; % fixed, foldable: \`(nop)\`
				let _: bool  = true;    % blank, foldable: \`(nop)\`

				let var c: int = 42;     % unfixed, foldable: \`(local.set)\`
				let d:     int = c + 10; % fixed, unfoldable: \`(local.set)\`
				let _:     int = c + 10; % blank, unfoldable: \`(drop)\`

				let var e?: bool; % assignee, uninitialized: \`(local.set)\`
				let var _?: bool; % blank, uninitialized:    \`(nop)\`
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.build();
			assert.deepStrictEqual(goal.builder.getLocals().map(({id, type}) => ({id, type})), [
				{id: 0x102n, type: binaryen.v128},
				{id: 0x103n, type: binaryen.v128},
				{id: 0x104n, type: binaryen.v128},
			]);
			return assertEqualBins(
				goal.children.map((stmt) => stmt.build()),
				[
					goal.builder.module.nop(),
					goal.builder.module.nop(),
					goal.builder.module.nop(),

					goal.builder.module.local.set(0, (goal.children[3] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					goal.builder.module.local.set(1, (goal.children[4] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					goal.builder.module.drop(        (goal.children[5] as AST.ASTNodeDeclarationVariable).assigned!.build()),

					goal.builder.module.local.set(2, VALUE.NULL.build(goal.builder)),
					goal.builder.module.nop(),
				],
			);
		});

		it('with constant folding off, never returns `(nop)`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let a:     int   = 42;   % fixed, foldable:   \`(local.set)\` instead of \`(nop)\`
				let _:     bool  = true; % blank, foldable:   \`(drop)\`      instead of \`(nop)\`
				let var b: float = 4.2;  % unfixed, foldable: \`(local.set)\` (same behavior)
				let _:     bool  = !b;   % blank, unfoldable: \`(drop)\`      (same behavior)

				let var c?: bool; % assignee, uninitialized: \`(local.set)\` (same behavior)
				let var _?: bool; % blank, uninitialized:    \`(nop)\`       (same behavior)
			`, CONFIG_FOLDING_OFF);
			goal.varCheck();
			goal.typeCheck();
			goal.build();
			assert.deepStrictEqual(goal.builder.getLocals().map(({id, type}) => ({id, type})), [
				{id: 0x100n, type: binaryen.v128},
				{id: 0x101n, type: binaryen.v128},
				{id: 0x102n, type: binaryen.v128},
			]);
			return assertEqualBins(
				goal.children.map((stmt) => stmt.build()),
				[
					goal.builder.module.local.set(0, (goal.children[0] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					goal.builder.module.drop(        (goal.children[1] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					goal.builder.module.local.set(1, (goal.children[2] as AST.ASTNodeDeclarationVariable).assigned!.build()),
					goal.builder.module.drop(        (goal.children[3] as AST.ASTNodeDeclarationVariable).assigned!.build()),

					goal.builder.module.local.set(2, VALUE.NULL.build(goal.builder)),
					goal.builder.module.nop(),
				],
			);
		});

		it('tuples and records.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let tup: [   int,    float,    [   null,    [   null,    bool]]] = [   42,    4.2,    [   null,    [   null,    true]]];
				let rec: [a: int, b: float, c: [d: null, e: [f: null, g: bool]]] = [a= 42, b= 4.2, c= [d= null, e= [f= null, g= true]]];
			`, CONFIG_FOLDING_OFF);
			goal.varCheck();
			goal.typeCheck();
			goal.build();
			const [tup, rec] = goal.children.map((stmt) => (stmt as AST.ASTNodeDeclarationVariable).assigned) as [AST.ASTNodeTuple, AST.ASTNodeRecord];
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
				goal.children.map((stmt) => stmt.build()),
				[
					goal.builder.module.local.set(2, tup.build()),
					goal.builder.module.local.set(5, rec.build()),
				],
			);
		});

		it('throws when tuples and records contain each other.', () => {
			[
				'let tup: [   int,    float,    [   null,    bool],    [g: bool, h: int],    [[j: float]]] = [   42,    4.2,    [   null,    true],    [g= false, h= 42],    [[j= 4.2]]];',
				'let rec: [a: int, b: float, c: [d: null, e: bool], f: [   bool,    int], i: [k: [float]]] = [a= 42, b= 4.2, c= [d= null, e= true], f= [   false,    42], i= [k= [4.2]]];',
			].forEach((src) => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, CONFIG_FOLDING_OFF);
				goal.varCheck();
				goal.typeCheck();
				return assert.throws(() => goal.build(), /not yet supported/);
			});
		});
	});
});
