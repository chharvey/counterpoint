import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	AST,
	type SymbolStructure,
	SymbolStructureVar,
	OBJ,
	TYPE,
	AssignmentError01,
	TypeError03,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {
	assertAssignable,
	assertEqualBins,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	CONFIG_COERCION_OFF,
} from '../../helpers.js';



describe('ASTNodeDeclarationVariable', () => {
	describe('#varCheck', () => {
		it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let x: int = 42;
			`);
			assert.ok(!goal.validator.hasSymbol(256n));
			goal.varCheck();
			assert.ok(goal.validator.hasSymbol(256n));
			const info: SymbolStructure | null = goal.validator.getSymbolInfo(256n);
			assert_instanceof(info, SymbolStructureVar);
			assert.strictEqual(info.type, TYPE.UNKNOWN);
			assert.strictEqual(info.value, null);
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
			`).varCheck(), AssignmentError01);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				type FOO = float;
				let FOO: int = 42;
			`).varCheck(), AssignmentError01);
		});

		it('allows duplicate declaration of blank identifier.', () => {
			AST.ASTNodeGoal.fromSource(`
				let _: int = 42;
				let _: str = "the answer";
			`).varCheck(); // assert does not throw
		});
	});


	describe('#typeCheck', () => {
		it('checks the assigned expression’s type against the variable assignee’s type.', () => {
			const var_: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  int | float =  21  *  2;
			`);
			var_.varCheck();
			return var_.typeCheck();
		});

		it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  null =  21  *  2;
			`).typeCheck(), TypeError03);
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
			`, CONFIG_COERCION_OFF).typeCheck(), TypeError03);
		});
		it('does not set `SymbolStructureVar#value` when assignee type has mutable.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let immut:  int[3]         = [42, 420, 4200];
				let mut:    mut int[3]     = [42, 420, 4200];
				let mutmut: (mut [int])[3] = [[42], [420], [4200]];
			`);
			goal.varCheck();
			goal.typeCheck();
			const [immut, mut, mutmut] = [
				goal.validator.getSymbolInfo(0x100n) as SymbolStructureVar,
				goal.validator.getSymbolInfo(0x101n) as SymbolStructureVar,
				goal.validator.getSymbolInfo(0x102n) as SymbolStructureVar,
			];
			assert.deepStrictEqual(
				[immut.source, immut.value],
				['immut',      new OBJ.Tuple<OBJ.Integer>([
					new OBJ.Integer(  42n),
					new OBJ.Integer( 420n),
					new OBJ.Integer(4200n),
				])],
			);
			assert.deepStrictEqual(
				[mut.source, mut.value],
				['mut',      null],
			);
			return assert.deepStrictEqual(
				[mutmut.source, mutmut.value],
				['mutmut',      null],
			);
		});
		it('immutable sets/maps should not be covariant due to bracket access.', () => {
			[
				'let s: Set.<int | str>       = Set.<int>([42, 43]);',
				'let m: Map.<int | str, bool> = Map.<int, bool>([[42, false], [43, true]]);',
				// otherwise one would access `s.["hello"]` or `m.["hello"]`
			].forEach((src) => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				goal.varCheck();
				assert.throws(() => goal.typeCheck(), TypeError03);
			});
		});
		context('allows assigning a collection literal to a wider mutable type.', () => {
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
			it('tuples: only allows greater or equal items.', () => {
				typeCheckGoal(`
					type T = [int];
					let var i: int = 42;
					let v: T = [42];

					let t1_1: mut [42 | 4.3] = [42];
					let t2_1: mut [int]      = [42];
					let t3_1: mut [int]      = [i];
					let t4_1: mut [T?]       = [v];

					let t1_2: mut [?: 42 | 4.3] = [42];
					let t2_2: mut [?: int]      = [i];
					let t3_2: mut [   42 | 4.3] = [42, "43"];
					let t4_2: mut [int, ?: str] = [42, "43"];

					type U = mut [int];
					let inner1: [mut [42 | 4.3]] = [[4.3]];
					let inner2: [inner2: mut T]  = [inner2= [43]];
					let inner3: [inner3: U]          = [inner3= [43]];
				`);
				typeCheckGoal(`
					let t: mut [int, str] = [42];
				`, TypeError03);
			});
			it('records: only allows matching or more properties.', () => {
				typeCheckGoal(`
					type T = [int];
					let var i: int = 42;
					let v: T = [42];

					let r1_1: mut [a: 42 | 4.3] = [a= 42];
					let r2_1: mut [a: int]      = [a= 42];
					let r3_1: mut [a: int]      = [a= i];
					let r4_1: mut [a: T?]       = [a= v];

					let r1_2: mut [a?: 42 | 4.3]    = [a= 42];
					let r2_2: mut [a?: int]         = [a= i];
					let r3_2: mut [a:  42 | 4.3]    = [b= "43", a= 42];
					let r4_2: mut [a: int, b?: str] = [b= "43", a= 42];
				`);
				typeCheckGoal(`
					let r1: mut [a: int, b: str] = [a= 42];
					let r2: mut [a: int, b: str] = [c= 42, b= "43"];
					let r3: mut [a: int, b: str] = [c= 42, d= "43"];
				`.split('\n'), TypeError03);
			});
			it('should throw when assigning combo type to union.', () => {
				typeCheckGoal([
					'let x: [bool, int]       | [int, bool]       = [true, true];',
					'let x: [a: bool, b: int] | [a: int, b: bool] = [a= true, b= true];',
				], TypeError03);
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
				`, TypeError03);
			});
			it('throws when not assigned to correct type.', () => {
				typeCheckGoal(`
					let t: mut [a: int, b: str] = [   42,    "43"];
					let r: mut [   int,    str] = [a= 42, b= "43"];
					let s: mut {int -> str}     = {   42,    "43"};
					let s: mut (int | str){}    = {   42 ->  "43"};
				`.split('\n'), TypeError03);
				typeCheckGoal(`
					let t1: mut obj                                = [42, "43"];
					let t2: mut ([int, str] | [   bool,    float]) = [42, "43"];
					let t3: mut ([int, str] | [a: bool, b: float]) = [42, "43"];
					let t4: mut ([int, str] | obj)                 = [42, "43"];

					let r1: mut obj                                      = [a= 42, b= "43"];
					let r2: mut ([a: int, b: str] | [c: bool, d: float]) = [a= 42, b= "43"];
					let r3: mut ([a: int, b: str] | [   bool,    float]) = [a= 42, b= "43"];
					let r4: mut ([a: int, b: str] | obj)                 = [a= 42, b= "43"];

					let s1: mut (42 | 4.3){}            = {42};
					let s2: mut (int | float){}         = {42};
					let s3: mut obj                     = {42};
					let s4: mut (int{} | {str -> bool}) = {42};
					let s5: mut (int{} | obj)           = {42};

					let m1: mut {int -> float}           = {42 -> 4.3};
					let m2: mut {int? -> float?}         = {42 -> 4.3};
					let m3: mut obj                      = {42 -> 4.3};
					let m4: mut ({int -> float} | str{}) = {42 -> 4.3};
					let m5: mut ({int -> float} | obj)   = {42 -> 4.3};
				`);
			});
			it('throws when entries mismatch.', () => {
				typeCheckGoal(`
					let t1: mut [int, str]    = [42, 43];
					let t2: mut [int, ?: str] = [42, 43];

					let r1: mut [a: int, b: str]  = [a= 42, b= 43];
					let r2: mut [a: int, b?: str] = [a= 42, b= 43];

					let s1: mut int{} = {"42"};
					let s2: mut int{} = {42, "43"};

					let m1: mut {int -> str} = {4.2 -> "43"};
					let m2: mut {int -> str} = {42  -> 4.3};
				`.split('\n'), TypeError03);
				typeCheckGoal(`
					let t3: mut [   bool,    str] = [   42,    43];
					let r3: mut [a: bool, b: str] = [a= 44, b= 45];
					let s3: mut (bool | str){}    = {   46,    47};

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
									{cons: TypeError03, message: 'Expression of type 42 is not assignable to type bool.'},
									{cons: TypeError03, message: 'Expression of type 43 is not assignable to type str.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 44 is not assignable to type bool.'},
									{cons: TypeError03, message: 'Expression of type 45 is not assignable to type str.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 46 is not assignable to type bool | str.'},
									{cons: TypeError03, message: 'Expression of type 47 is not assignable to type bool | str.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 1 is not assignable to type str.'},
									{cons: TypeError03, message: 'Expression of type 2.0 is not assignable to type str.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 3 is not assignable to type bool.'},
									{cons: TypeError03, message: 'Expression of type 4.0 is not assignable to type bool.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 5 is not assignable to type str.'},
									{cons: TypeError03, message: 'Expression of type 6.0 is not assignable to type bool.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 7 is not assignable to type str.'},
									{cons: TypeError03, message: 'Expression of type 8.0 is not assignable to type bool.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{
										cons:   AggregateError,
										errors: [
											{cons: TypeError03, message: 'Expression of type 9 is not assignable to type str.'},
											{cons: TypeError03, message: 'Expression of type "a" is not assignable to type bool.'},
										],
									},
									{
										cons:   AggregateError,
										errors: [
											{cons: TypeError03, message: 'Expression of type 10.0 is not assignable to type str.'},
											{cons: TypeError03, message: 'Expression of type "b" is not assignable to type bool.'},
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
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.build();
			assert.deepStrictEqual(goal.builder.getLocals(), [
				{id: 0x102n, type: binaryen.v128},
				{id: 0x103n, type: binaryen.v128},
			]);
			return assertEqualBins(
				goal.children.map((stmt) => stmt.build()),
				[
					goal.builder.module.nop(),
					goal.builder.module.nop(),
					goal.builder.module.nop(),

					goal.builder.module.local.set(0, (goal.children[3] as AST.ASTNodeDeclarationVariable).assigned.build()),
					goal.builder.module.local.set(1, (goal.children[4] as AST.ASTNodeDeclarationVariable).assigned.build()),
					goal.builder.module.drop(        (goal.children[5] as AST.ASTNodeDeclarationVariable).assigned.build()),
				],
			);
		});

		it('with constant folding off, never returns `(nop)`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let a:     int   = 42;   % fixed, foldable:   \`(local.set)\` instead of \`(nop)\`
				let _:     bool  = true; % blank, foldable:   \`(drop)\`      instead of \`(nop)\`
				let var b: float = 4.2;  % unfixed, foldable: \`(local.set)\` (same behavior)
				let _:     bool  = !b;   % blank, unfoldable: \`(drop)\`      (same behavior)
			`, CONFIG_FOLDING_OFF);
			goal.varCheck();
			goal.typeCheck();
			goal.build();
			assert.deepStrictEqual(goal.builder.getLocals(), [
				{id: 0x100n, type: binaryen.v128},
				{id: 0x101n, type: binaryen.v128},
			]);
			return assertEqualBins(
				goal.children.map((stmt) => stmt.build()),
				[
					goal.builder.module.local.set(0, (goal.children[0] as AST.ASTNodeDeclarationVariable).assigned.build()),
					goal.builder.module.drop(        (goal.children[1] as AST.ASTNodeDeclarationVariable).assigned.build()),
					goal.builder.module.local.set(1, (goal.children[2] as AST.ASTNodeDeclarationVariable).assigned.build()),
					goal.builder.module.drop(        (goal.children[3] as AST.ASTNodeDeclarationVariable).assigned.build()),
				],
			);
		});
	});
});
