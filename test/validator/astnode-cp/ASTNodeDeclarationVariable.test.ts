import * as assert from 'node:assert';
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
import {assertAssignable} from '../../assert-helpers.ts';
import {CONFIG_COERCION_OFF} from '../../helpers.ts';
import {extract_lines} from '../../utils.ts';



describe('ASTNodeDeclarationVariable', () => {
	describe('#varCheck', () => {
		it('adds a SymbolSchema to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val     a:  int = 42;
				val mut b:  int = 42;
				val mut c?: int;
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
				val _: float = 4.2;
			`);
			assert.ok(!goal.validator.hasSymbol(256n));
			goal.varCheck();
			return assert.ok(!goal.validator.hasSymbol(256n));
		});

		it('throws if the validator already contains a record for the variable.', () => {
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				val i: int = 42;
				val i: int = 43;
			`).varCheck(), AssignmentErrorDuplicateDeclaration);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				type FOO = float;
				val FOO: int = 42;
			`).varCheck(), AssignmentErrorDuplicateDeclaration);
		});

		it('allows duplicate declaration of blank identifier.', () => {
			AST.ASTNodeGoal.fromSource(`
				val _: int = 42;
				val _: str = "the answer";
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
				val  the_answer:  int | float =  21  *  2;
			`);
			var_.varCheck();
			return var_.typeCheck();
		});

		it('passes typechecking when uninitialized.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut the_answer?: int | float;
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
				val  the_answer:  null =  21  *  2;
			`).typeCheck(), TypeErrorNotAssignable);
		});

		it('with int coersion on, allows assigning ints to floats.', () => {
			const var_: AST.ASTNodeDeclarationVariable = AST.ASTNodeDeclarationVariable.fromSource(`
				val x: float = 42;
			`);
			var_.varCheck();
			return var_.typeCheck();
		});

		it('with int coersion off, throws when assigning int to float.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				val x: float = 42;
			`, CONFIG_COERCION_OFF).typeCheck(), TypeErrorNotAssignable);
		});
		it('does not set `SymbolSchemaVar#value` when assignee type has mutable.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val immut:  (int, int, int)                   = (42, 420, 4200);
				val 'mut':  mut [int]                         = [42, 420, 4200];
				val mutmut: (mut [int], mut [int], mut [int]) = ([42], [420], [4200]);
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
				val l: List.<int | str> = List.<int>((42, 43));
				val d: Dict.<int | str> = Dict.<int>((a= 42, b= 43));
				val s: Set.<int | str>  = Set.<int>((42, 43));

				val mk: Map.<int | str, bool>       = Map.<int, bool>(((42, false), (43, true)));
				val mv: Map.<int,       bool | str> = Map.<int, bool>(((42, false), (43, true)));
				val m:  Map.<int | str, bool | str> = Map.<int, bool>(((42, false), (43, true)));
			`);
		});
		it('mutable lists/dicts/sets/maps should not be covariant.', () => {
			typeCheckGoal(extract_lines`
				val l: mut List.<int | str> = List.<int>((42, 43));
				val d: mut Dict.<int | str> = Dict.<int>((a= 42, b= 43));
				val s: mut Set.<int | str>  = Set.<int>((42, 43));

				val mk: mut Map.<int | str, bool>       = Map.<int, bool>(((42, false), (43, true)));
				val mv: mut Map.<int,       bool | str> = Map.<int, bool>(((42, false), (43, true)));
				val m:  mut Map.<int | str, bool | str> = Map.<int, bool>(((42, false), (43, true)));
			`, TypeErrorNotAssignable);
		});
		it('assigning collection literals.', () => {
			typeCheckGoal(`
				val c: (int, int, int) = (42, 420, 4200);
				val d: (n42: int, n420: int) = (
					n42=  42,
					n420= 420,
				);
				val v: (   int,    str) = (   42,    "hello");
				val s: (a: int, b: str) = (a= 42, b= "hello");
			`);
		});
		it('allows assigning a collection literal to super reference type (autoboxing at runtime).', () => {
			typeCheckGoal(`
				val v: unknown = (   42,    "hello");
				val s: unknown = (a= 42, b= "hello");
			`);
			typeCheckGoal(`
				val v: mut unknown = (   42,    "hello");
				val s: mut unknown = (a= 42, b= "hello");
			`); // mut unknown == unknown
		});
		context('assigning a collection literal to a wider mutable type.', () => {
			it('disallows assigning Tuples/Records to Lists/Dicts', () => {
				typeCheckGoal(`
					val t1_1: List.<42 | 4.3> = (42);
					val t2_1: List.<int>      = (42);

					val t1_2: mut List.<42 | 4.3> = (43);
					val t2_2: mut List.<int>      = (43);

					val r1_1: Dict.<42 | 4.3> = (a= 42);
					val r2_1: Dict.<int>      = (a= 42);

					val r1_2: mut Dict.<42 | 4.3> = (a= 43);
					val r2_2: mut Dict.<int>      = (a= 43);

					val t3_1: (           List.<float>,) = (       (4.3,),);
					val t3_2: (       mut List.<float>,) = (       (4.3,),);
					val r3_1: (inner:     List.<float>)  = (inner= (4.3,));
					val r3_2: (inner: mut List.<float>)  = (inner= (4.3,));
				`.split('\n'), TypeErrorNotAssignable);
			});
			it('allows assigning Lists, Dicts, Sets, and Maps.', () => {
				typeCheckGoal(`
					val l: mut [int | str]   = [   42,      "43"];
					val d: mut [: int | str] = [a= 42,   b= "43"];
					val s: mut {int | str}   = {   42,      "43"};
					val m: mut {int -> str}  = {   42 ->    "43"};
					l.[1]    = "44";
					d.[@a]   = "44";
					s.["44"] = true;
					m.[44]   = "45";
				`);
				return typeCheckGoal(`
					val tuple_of_list:  (   mut [int],)        = (   [42],);
					val tuple_of_dict:  (   mut [:int],)       = (   [a= 42],);
					val tuple_of_set:   (   mut {int},)        = (   {42},);
					val tuple_of_map:   (   mut {int -> str},) = (   {42 -> "hello"},);
					val record_of_list: (k: mut [int])         = (k= [42]);
					val record_of_dict: (k: mut [:int])        = (k= [b= 42]);
					val record_of_set:  (k: mut {int})         = (k= {42});
					val record_of_map:  (k: mut {int -> str})  = (k= {42 -> "hello"});
					tuple_of_list.0.[0]  = 43;
					tuple_of_dict.0.[@a]  = 43;
					tuple_of_set.0.[43]   = true;
					tuple_of_map.0.[43]   = "world";
					record_of_list.k.[0]  = 43;
					record_of_dict.k.[@b] = 43;
					record_of_set.k.[43]  = true;
					record_of_map.k.[43]  = "world";
				`);
			});
			it('should throw when assigning combo type to union.', () => {
				typeCheckGoal(`
					val x: (   bool,    int) | (   int,    bool) = (   true,    false);
					val x: (a: bool, b: int) | (a: int, b: bool) = (a= true, b= false);
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
					val bob: Employee | Volunteer = (
						name=         "Bob", %: str
						hours_worked= 80.0,  %: float
					);
				`, (err) => {
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
					val s: mut {int -> str} = {42,   "43"};
					val s: mut {int | str}  = {42 -> "43"};
				`.split('\n'), TypeErrorNotAssignable);
				typeCheckGoal(`
					val t1: mut unknown               = (42, "43");
					val t4: mut ((int, str) | Object) = (42, "43");

					val r1: mut unknown                     = (a= 42, b= "43");
					val r4: mut ((a: int, b: str) | Object) = (a= 42, b= "43");

					val s1: mut {42 | 4.3}              = {42};
					val s2: mut {int | float}           = {42};
					val s3: mut Object                  = {42};
					val s4: mut ({int} | {str -> bool}) = {42};
					val s5: mut ({int} | Object)        = {42};

					val m1: mut {int -> float}            = {42 -> 4.3};
					val m2: mut {int? -> float?}          = {42 -> 4.3};
					val m3: mut Object                    = {42 -> 4.3};
					val m4: mut ({int -> float} | {str})  = {42 -> 4.3};
					val m5: mut ({int -> float} | Object) = {42 -> 4.3};
				`);
			});
			it('throws when entries mismatch.', () => {
				typeCheckGoal(`
					val s1: mut {int} = {"42"};
					val s2: mut {int} = {42, "43"};

					val m1: mut {int -> str} = {4.2 -> "43"};
					val m2: mut {int -> str} = {42  -> 4.3};
				`.split('\n'), TypeErrorNotAssignable);
				typeCheckGoal(`
					val s3: mut {bool | str} = {46, 47};

					val m3_1: mut {str -> bool} = {1 -> false, 2.0 -> true};
					val m3_2: mut {str -> bool} = {"a" -> 3,   "b" -> 4.0};
					val m3_3: mut {str -> bool} = {5 -> false, "b" -> 6.0};
					val m3_4: mut {str -> bool} = {7 -> 8.0};
					val m3_5: mut {str -> bool} = {9 -> "a", 10.0 -> "b"};
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
});
