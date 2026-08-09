import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	Validator,
	AST,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaVar,
	SymbolSchemaFunc,
	TYPE,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorMissingType,
	TypeErrorNotAssignable,
} from '../../src/index.ts';
import {
	extract_lines,
	repeat,
	assert_shallowStrictEqual,
	assertAssignable,
	assertEqualTypes,
	op_maybe_string,
	typeUnit,
	setupScript,
} from '../utils.ts';



test.suite('Declaration', () => {
	test.suite('#varCheck', () => {
		test.suite('DeclarationType', () => {
			test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
				const goal: AST.Goal = AST.Goal.fromSource(`{
					type T = int;
				}`);
				const id: bigint = Validator.cookTokenIdentifier('T');
				assert.ok(!goal.block!.validator.hasSymbol(id));
				goal.varCheck();
				assert.ok(goal.block!.validator.hasSymbol(id));
				const info: SymbolSchema | undefined = goal.block!.validator.getSymbol(id);
				assert_instanceof(info, SymbolSchemaType);
				assert.strictEqual(info.typevalue, TYPE.ANYTHING);
			});
			test.test('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.Goal = AST.Goal.fromSource(`{
					type _ = str;
				}`);
				assert.ok(!goal.block!.validator.hasSymbol(0x100n));
				goal.varCheck();
				return assert.ok(!goal.block!.validator.hasSymbol(0x100n));
			});
			test.test('throws if the validator already contains a record for the symbol.', () => {
				xjs.Array.forEachAggregated([`{
					type T = int;
					type T = float;
				}`, `{
					val FOO: int = 42;
					type FOO = float;
				}`, `{
					for it: float in [1.1, 2.2, 3.3] do {
						type it = int;
					};
				}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
			});
			test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
				xjs.Array.forEachAggregated([`{
					type T = int;
					if true then {
						type T = float;
					};
				}`, `{
					type T = int;
					while false do {
						type T = float;
					};
				}`, `{
					type T = int;
					for it: float in [1.1, 2.2, 3.3] do {
						type T = float;
					};
				}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
			});
			test.test('allows duplicate declaration of blank identifier.', () => {
				setupScript(`{
					type _ = int | float;
					type _ = (str, bool);
				}`, {typeCheck: false}); // assert does not throw
			});
		});

		test.suite('DeclarationVariable', () => {
			test.test('adds a SymbolSchema to the symbol table with a preset `type` value of `anything`.', () => {
				const goal: AST.Goal = AST.Goal.fromSource(`{
					val     a:  int = 42;
					val mut b:  int = 42;
					val mut c?: int;
				}`);
				const id_a: bigint = Validator.cookTokenIdentifier('a');
				const id_b: bigint = Validator.cookTokenIdentifier('b');
				const id_c: bigint = Validator.cookTokenIdentifier('c');
				assert.ok(!goal.block!.validator.hasSymbol(id_a));
				assert.ok(!goal.block!.validator.hasSymbol(id_b));
				assert.ok(!goal.block!.validator.hasSymbol(id_c));
				goal.varCheck();
				assert.ok(goal.block!.validator.hasSymbol(id_a));
				assert.ok(goal.block!.validator.hasSymbol(id_b));
				assert.ok(goal.block!.validator.hasSymbol(id_c));
				const info_a: SymbolSchema | undefined = goal.block!.validator.getSymbol(id_a);
				const info_b: SymbolSchema | undefined = goal.block!.validator.getSymbol(id_b);
				const info_c: SymbolSchema | undefined = goal.block!.validator.getSymbol(id_c);
				assert_instanceof(info_a, SymbolSchemaVar);
				assert_instanceof(info_b, SymbolSchemaVar);
				assert_instanceof(info_c, SymbolSchemaVar);
				assert.partialDeepStrictEqual(info_a, {
					isWritable:      false,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
				});
				assert.partialDeepStrictEqual(info_b, {
					isWritable:      true,
					isUninitialized: false,
					type:            TYPE.ANYTHING,
				});
				assert.partialDeepStrictEqual(info_c, {
					isWritable:      true,
					isUninitialized: true,
					type:            TYPE.ANYTHING,
				});
			});
			test.test('for blank identifiers, does not add to symbol table.', () => {
				const goal: AST.Goal = AST.Goal.fromSource(`{
					val _: float = 4.2;
				}`);
				assert.ok(!goal.block!.validator.hasSymbol(0x100n));
				goal.varCheck();
				return assert.ok(!goal.block!.validator.hasSymbol(0x100n));
			});
			test.test('throws if the validator already contains a record for the variable.', () => {
				xjs.Array.forEachAggregated([`{
					val i: int = 42;
					val i: int = 43;
				}`, `{
					type FOO = float;
					val FOO: int = 42;
				}`, `{
					for it: float in [1.1, 2.2, 3.3] do {
						val it: int = 42;
					};
				}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
			});
			test.test('throws if the same identifier was declared in an outer scope (shadowing).', () => {
				xjs.Array.forEachAggregated([`{
					val mut x: int = 42;
					if true then {
						val mut x: float = 4.2;
					};
				}`, `{
					val mut x: int = 42;
					while false do {
						val mut x: float = 4.2;
					};
				}`, `{
					val mut x: int = 42;
					for it: float in [1.1, 2.2, 3.3] do {
						val mut x: float = 4.2;
					};
				}`], (src) => assert.throws(() => setupScript(src, {typeCheck: false}), AssignmentErrorDuplicateDeclaration));
			});
			test.test('allows duplicate declaration of blank identifier.', () => {
				setupScript(`{
					val _: int = 42;
					val _: str = "the answer";
				}`, {typeCheck: false}); // assert does not throw
			});
		});

		test.suite('DeclarationFunction', () => {
			test.test('throws when declaring duplicate identifier.', () => {
				setupScript(`{
					val x: int = 42;
					func y(z: str): void { return; };
				}`, {typeCheck: false}); // assert does not throw
				assert.throws(() => setupScript(`{
					val x: int = 42;
					func x(): void { return; };
				}`, {typeCheck: false}), AssignmentErrorDuplicateDeclaration);
				return assert.throws(() => setupScript(`{
					func f(): void { return; };
					func f(a: int): void { return; };
				}`, {typeCheck: false}), AssignmentErrorDuplicateDeclaration);
			});
			test.test('allows duplicate blank identifier.', () => {
				setupScript(`{
					func _(): void { return; };
					func _(a: int): void { return; };
				}`, {typeCheck: false}); // assert does not throw
			});
			test.test('allows overloads.', {expectFailure: true}, () => {
				setupScript(`{
					func f(): void { return; };
					func f(a: int): void { return; };
				}`, {typeCheck: false}); // assert does not throw
			});
			test.test('allows self-reference, but not self-shadowing.', () => {
				setupScript(`{
					func f(): void {
						f;
						return;
					};
				}`, {typeCheck: false}); // assert does not throw
				assert.throws(() => setupScript(`{
					func f(): void { % no error
						val f: int = 42; %> AssignmentErrorDuplicateDeclaration
						return;
					};
				}`, {typeCheck: false}), AssignmentErrorDuplicateDeclaration);
				return assert.throws(() => setupScript(`{
					func f( % no error
						f: int, %> AssignmentErrorDuplicateDeclaration
					): void {
						return;
					};
				}`, {typeCheck: false}), AssignmentErrorDuplicateDeclaration);
			});
			test.test('hoists function name.', () => {
				setupScript(`{
					f;
					func f(): void { return; };
				}`, {typeCheck: false});
				setupScript(`{
					func f(): void { g; return; };
					func g(): void { f; return; };
				}`, {typeCheck: false});
			});
		});
	});


	test.suite('#typeCheck', () => {
		test.suite('DeclarationType', () => {
			test.test('sets `SymbolSchemaType#typevalue`.', () => {
				assert.strictEqual(
					(setupScript(`{
						type T = int;
					}`, {build: false}).goal.block!.validator.getSymbolBySource('T') as SymbolSchemaType).typevalue,
					TYPE.INT,
				);
			});
		});

		test.suite('DeclarationVariable', () => {
			function typeCheckGoal(src: string | string[], expect_thrown?: Parameters<typeof assert.throws>[1]): void {
				if (src instanceof Array) {
					return src
						.map((s) => s.trim())
						.filter((s) => !!s)
						.forEach((s) => typeCheckGoal(`{${ s }}`, expect_thrown));
				}
				const {goal} = setupScript(src, {typeCheck: false});
				return (expect_thrown)
					? assert.throws(() => goal.typeCheck(), expect_thrown)
					: goal.typeCheck();
			}
			test.test('checks the assigned expression’s type against the variable assignee’s type.', () => {
				setupScript(`{
					val the_answer: nat = +42;
				}`, {build: false}); // assert does not throw
				const var_: AST.STMT.DeclarationVariable = AST.STMT.DeclarationVariable.fromSource(`
					val  the_answer:  int | float =  21  *  2;
				`);
				var_.varCheck();
				return var_.typeCheck();
			});
			test.test('passes when assigned is structurally assignable.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					val n: Name = "Alice";
					val n: Name = "Alice" as <str>;
					val n: Name = "Alice" as <"Alice">;
					val n: Name = "Alice" as <Name>;
				`, (stmt) => {
					setupScript(`{
						type Name = str;
						${ stmt }
					}`, {build: false}); // assert does not throw
				});
			});
			test.test('passes typechecking when uninitialized.', () => {
				assert.partialDeepStrictEqual(setupScript(`{
					val mut the_answer?: int | float;
				}`, {build: false}).goal.block!.validator.getSymbolBySource('the_answer'), {
					isWritable:      true,
					isUninitialized: true,
					type:            TYPE.INT.union(TYPE.FLOAT),
				});
			});
			test.suite('type inference.', () => {
				const PRIMS = new Map<string, [TYPE.Unit, TYPE.Type]>([
					['null',    [TYPE.NULL,                TYPE.NULL]],
					['false',   [TYPE.FALSE,               TYPE.BOOL]],
					['true',    [TYPE.TRUE,                TYPE.BOOL]],
					['@hello',  [typeUnit('hello', 'sym'), TYPE.SYM]],
					['-42',     [typeUnit(-42n),           TYPE.INT]],
					['+42',     [typeUnit(42n, 'nat'),     TYPE.NAT]],
					['6.28',    [typeUnit(6.28),           TYPE.FLOAT]],
					['"hello"', [typeUnit('hello'),        TYPE.STR]],
				]);
				test.test('for read-only variables, infers the unit type.', () => {
					xjs.Map.forEachAggregated(PRIMS, ([fixedtype], src) => assertEqualTypes((setupScript(`{
						val fixed = ${ src };
					}`, {build: false}).goal.block!.validator.getSymbolBySource('fixed') as SymbolSchemaVar).type, fixedtype));
				});
				test.test('for unfixed variables, infers the narrowest primitive type.', () => {
					xjs.Map.forEachAggregated(PRIMS, ([_, unfixedtype], src) => assertEqualTypes((setupScript(`{
						val mut unfixed = ${ src };
					}`, {build: false}).goal.block!.validator.getSymbolBySource('unfixed') as SymbolSchemaVar).type, unfixedtype));
				});
				test.test('always infers `str` for string templates.', () => {
					const {goal} = setupScript(`{
						val     str_tpl_fixed   = """hello"""; % type \`str\`
						val mut str_tpl_unfixed = """hello"""; % type \`str\`
					}`, {build: false});
					return assert_shallowStrictEqual([
						(goal.block!.validator.getSymbolBySource('str_tpl_fixed')   as SymbolSchemaVar).type,
						(goal.block!.validator.getSymbolBySource('str_tpl_unfixed') as SymbolSchemaVar).type,
					], repeat(TYPE.STR, 2));
				});
				test.test('infers the constructor type, mutable.', () => {
					const {goal} = setupScript(`{
						val     list_fixed   = List.<int>((42, 69));                 % type \`mut List.<int>\`
						val mut dict_unfixed = Dict.<str>((a= "hello", b= "world")); % type \`mut Dict.<str>\`
					}`, {build: false});
					return assertEqualTypes([
						(goal.block!.validator.getSymbolBySource('list_fixed')   as SymbolSchemaVar).type,
						(goal.block!.validator.getSymbolBySource('dict_unfixed') as SymbolSchemaVar).type,
					], [
						new TYPE.List(TYPE.INT, true),
						new TYPE.Dict(TYPE.STR, true),
					]);
				});
				test.test('applies recursively to tuple/record literals.', () => {
					const {goal} = setupScript(`{
						val     tup_fixed   = (   42,    (x= "hello"),    Dict.<bool>((x= false, y= true))); % type \`(   42,     (x= "hello"),    Dict.<bool>)\`
						val mut rec_unfixed = (a= 42, b= ("hello",),   c= List.<bool>((   false,    true))); % type \`(a= int, b= (str,),       c= List.<bool>)\`
					}`, {build: false});
					return assertEqualTypes([
						(goal.block!.validator.getSymbolBySource('tup_fixed')   as SymbolSchemaVar).type,
						(goal.block!.validator.getSymbolBySource('rec_unfixed') as SymbolSchemaVar).type,
					], [
						TYPE.Tuple.fromTypes([
							typeUnit(42n),
							TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('x'), typeUnit('hello')]])),
							new TYPE.Dict(TYPE.BOOL, true),
						]),
						TYPE.Record.fromTypes(new Map([
							[Validator.cookTokenIdentifier('a'), TYPE.INT],
							[Validator.cookTokenIdentifier('b'), TYPE.Tuple.fromTypes([TYPE.STR])],
							[Validator.cookTokenIdentifier('c'), new TYPE.List(TYPE.BOOL, true)],
						])),
					]);
				});
				test.test('throws when assigned expression is not a primitive literal, string template, constructor call, or inferrable tuple/record literal.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						val operation = 21 * 2;
						val block_expr = { 42; };
						val tup_literal = (42, "hello", operation);
						val rec_literal = (a= 69, b= "world", c= operation);
						val list_literal = [42, 69];
						val dict_literal = [a= "hello", b= "world"];
					`, (src) => assert.throws(() => AST.STMT.DeclarationVariable.fromSource(src).typeCheck(), AssignmentErrorMissingType));
				});
			});
			test.test('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
				assert.throws(() => AST.STMT.DeclarationVariable.fromSource(`
					val  the_answer:  null =  21  *  2;
				`).typeCheck(), TypeErrorNotAssignable);
			});
			test.test('throws when assigning int to float.', () => {
				assert.throws(() => AST.STMT.DeclarationVariable.fromSource(`
					val x: float = 42;
				`).typeCheck(), TypeErrorNotAssignable);
			});
			test.test('immutable lists/dicts/sets/maps should be covariant.', () => {
				typeCheckGoal(extract_lines`
					val l: List.<int | str> = List.<int>((42, 43));
					val d: Dict.<int | str> = Dict.<int>((a= 42, b= 43));
					val s: Set.<int | str>  = Set.<int>((42, 43));

					val mk: Map.<int | str, bool>       = Map.<int, bool>(((42, false), (43, true)));
					val mv: Map.<int,       bool | str> = Map.<int, bool>(((42, false), (43, true)));
					val m:  Map.<int | str, bool | str> = Map.<int, bool>(((42, false), (43, true)));
				`);
			});
			test.test('mutable lists/dicts/sets/maps should not be covariant.', () => {
				typeCheckGoal(extract_lines`
					val l: mut List.<int | str> = List.<int>((42, 43));
					val d: mut Dict.<int | str> = Dict.<int>((a= 42, b= 43));
					val s: mut Set.<int | str>  = Set.<int>((42, 43));

					val mk: mut Map.<int | str, bool>       = Map.<int, bool>(((42, false), (43, true)));
					val mv: mut Map.<int,       bool | str> = Map.<int, bool>(((42, false), (43, true)));
					val m:  mut Map.<int | str, bool | str> = Map.<int, bool>(((42, false), (43, true)));
				`, TypeErrorNotAssignable);
			});
			test.test('assigning collection literals.', () => {
				typeCheckGoal(`{
					val c: (int, int, int) = (42, 420, 4200);
					val d: (n42: int, n420: int) = (
						n42=  42,
						n420= 420,
					);
					val v: (   int,    str) = (   42,    "hello");
					val s: (a: int, b: str) = (a= 42, b= "hello");
				}`);
			});
			test.test('allows assigning a collection literal to super reference type (autoboxing at runtime).', () => {
				typeCheckGoal(`{
					val v: anything = (   42,    "hello");
					val s: anything = (a= 42, b= "hello");
				}`);
				typeCheckGoal(`{
					val v: mut anything = (   42,    "hello");
					val s: mut anything = (a= 42, b= "hello");
				}`); // mut anything == anything
			});
			test.suite('assigning a collection literal to a wider mutable type.', () => {
				test.test('disallows assigning Tuples/Records to Lists/Dicts', () => {
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
				test.test('allows assigning Lists, Dicts, Sets, and Maps.', () => {
					typeCheckGoal(`{
						val l: mut [int | str]   = [   42,      "43"];
						val d: mut [: int | str] = [a= 42,   b= "43"];
						val s: mut {int | str}   = {   42,      "43"};
						val m: mut {int -> str}  = {   42 ->    "43"};
						set l.[1]    = "44";
						set d.[@a]   = "44";
						set s.["44"] = true;
						set m.[44]   = "45";
					}`);
					return typeCheckGoal(`{
						val tuple_of_list:  (   mut [int],)        = (   [42],);
						val tuple_of_dict:  (   mut [:int],)       = (   [a= 42],);
						val tuple_of_set:   (   mut {int},)        = (   {42},);
						val tuple_of_map:   (   mut {int -> str},) = (   {42 -> "hello"},);
						val record_of_list: (k: mut [int])         = (k= [42]);
						val record_of_dict: (k: mut [:int])        = (k= [b= 42]);
						val record_of_set:  (k: mut {int})         = (k= {42});
						val record_of_map:  (k: mut {int -> str})  = (k= {42 -> "hello"});
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
						val x: (   bool,    int) | (   int,    bool) = (   true,    false);
						val x: (a: bool, b: int) | (a: int, b: bool) = (a= true, b= false);
					`.split('\n'), (err) => {
						assertAssignable(err as Error, {
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
						val bob: Employee | Volunteer = ${ BOB };
					}`, (err) => {
						const id_name:         bigint = Validator.cookTokenIdentifier('name');
						const id_id:           bigint = Validator.cookTokenIdentifier('id');
						const id_job_title:    bigint = Validator.cookTokenIdentifier('job_title');
						const id_hours_worked: bigint = Validator.cookTokenIdentifier('hours_worked');
						const id_agency:       bigint = Validator.cookTokenIdentifier('agency');
						assertAssignable(err as Error, {
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorNotAssignable, message: `Expression \`${ BOB }\` is not assignable to type \`(${ id_name }: str, ${ id_id }: int, ${ id_job_title }: str, ${ id_hours_worked }: float)\`.`},
								{cons: TypeErrorNotAssignable, message: `Expression \`${ BOB }\` is not assignable to type \`(${ id_name }: str, ${ id_agency }: str, ${ id_hours_worked }: float)\`.`},
							],
						});
						return true;
					});
				});
				test.test('throws when not assigned to correct type.', () => {
					typeCheckGoal(`
						val s: mut {int -> str} = {42,   "43"};
						val s: mut {int | str}  = {42 -> "43"};
					`.split('\n'), TypeErrorNotAssignable);
					typeCheckGoal(`{
						val t1: mut anything              = (42, "43");
						val t4: mut ((int, str) | Object) = (42, "43");

						val r1: mut anything                    = (a= 42, b= "43");
						val r4: mut ((a: int, b: str) | Object) = (a= 42, b= "43");

						val s1: mut {42 | 4.3}              = {42};
						val s2: mut {int | float}           = {42};
						val s3: mut Object                  = {42};
						val s4: mut ({int} | {str -> bool}) = {42};
						val s5: mut ({int} | Object)        = {42};

						val m1: mut {int -> float}               = {42 -> 4.3};
						val m2: mut {int | null -> float | null} = {42 -> 4.3};
						val m3: mut Object                       = {42 -> 4.3};
						val m4: mut ({int -> float} | {str})     = {42 -> 4.3};
						val m5: mut ({int -> float} | Object)    = {42 -> 4.3};
					}`);
				});
				test.test('throws when entries mismatch.', () => {
					typeCheckGoal(`
						val s1: mut {int} = {"42"};
						val s2: mut {int} = {42, "43"};

						val m1: mut {int -> str} = {4.2 -> "43"};
						val m2: mut {int -> str} = {42  -> 4.3};
					`.split('\n'), TypeErrorNotAssignable);
					typeCheckGoal(`{
						val s3: mut {bool | str} = {46, 47};

						val m3_1: mut {str -> bool} = {1 -> false, 2.0 -> true};
						val m3_2: mut {str -> bool} = {"a" -> 3,   "b" -> 4.0};
						val m3_3: mut {str -> bool} = {5 -> false, "b" -> 6.0};
						val m3_4: mut {str -> bool} = {7 -> 8.0};
						val m3_5: mut {str -> bool} = {9 -> "a", 10.0 -> "b"};
					}`, (err) => {
						assertAssignable(err as Error, {
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

		test.suite('DeclarationFunction', () => {
			test.test('sets the SymbolSchemaFunc `type`.', () => {
				const {stmts} = setupScript(`{
					func f(a: float, mut b: str): void { return; };
				}`, {typeCheck: false});
				const id_f: bigint = Validator.cookTokenIdentifier('f');
				const id_a: bigint = Validator.cookTokenIdentifier('a');
				const id_b: bigint = Validator.cookTokenIdentifier('b');
				const fn = stmts[0] as AST.STMT.DeclarationFunction;
				assert.ok(fn.validator.hasSymbol(id_f));
				assert.ok(fn.block.validator.hasSymbol(id_a));
				assert.ok(fn.block.validator.hasSymbol(id_b));
				const info_f: SymbolSchema | undefined = fn.validator.getSymbol(id_f);
				const info_a: SymbolSchema | undefined = fn.block.validator.getSymbol(id_a);
				const info_b: SymbolSchema | undefined = fn.block.validator.getSymbol(id_b);
				assert_instanceof(info_f, SymbolSchemaFunc);
				assert_instanceof(info_a, SymbolSchemaVar);
				assert_instanceof(info_b, SymbolSchemaVar);
				assert_shallowStrictEqual(
					[info_f.type, info_a.type, info_b.type],
					repeat(TYPE.ANYTHING, 3),
				);
				fn.typeCheck();
				assertEqualTypes(info_f.type, new TYPE.Function(TYPE.Tuple.fromTypes([
					TYPE.FLOAT,
					TYPE.STR,
				])));
				return assert_shallowStrictEqual(
					[info_a.type, info_b.type],
					[TYPE.FLOAT, TYPE.STR],
				);
			});
		});
	});


	test.suite('#build', () => {
		test.test('DeclarationType has no effect.', () => {
			assert.strictEqual(setupScript(`{
				type N = int | nat | float;
			}`, {codegen: false}).builder.print(), '"block-0":\n\t(ENDPROGRAM)');
		});
		test.test('DeclarationVariable pushes (DECL+SET)/DROP instruction depending on presence of child nodes.', () => {
			const {stmts, builder} = setupScript(`{
				% Foldable cases:
				val _:          int = 42; % \`(DROP (INT.CONST 42))\`
				val assignee_a: int = 42; % \`(DECL <int> assignee_a (INT.CONST 42))\`

				% Non-Foldable cases:
				val mut assignee_b?: int;
				val mut assignee_c:  int = 42;
				val     _:           int = assignee_c;
				val     assignee_d:  int = assignee_c;
				val mut assignee_e:  int = assignee_c;

				%% Syntactically impossible cases (for completion):
				val _?:          int;
				val assignee_f?: int;
				val mut _?:      int;
				val mut _:       int = 42;
				val mut _:       int = assignee_c;
				%%
			}`, {codegen: false});
			stmts.forEach((stmt) => (stmt as AST.STMT.DeclarationVariable).build(builder));
			return assert.strictEqual(builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (INT.CONST 42))
					(DECL <int> assignee_a (INT.CONST 42))
					(DECL <Maybe> assignee_b ${ op_maybe_string() })
					(DECL <int> assignee_c (INT.CONST 42))
					(DROP (GET assignee_c))
					(DECL <int> assignee_d (GET assignee_c))
					(DECL <int> assignee_e (GET assignee_c))
					(ENDPROGRAM)
			`.trim());
		});
		test.suite('DeclarationFunction', () => {
			test.test('function declared with blank identifier builds nothing.', () => {
				assert.strictEqual(setupScript(`{
					42;
					func _(foo: int): void {
						foo;
						return;
					}
					43;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DROP (INT.CONST 42))
						(DROP (INT.CONST 43))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('single parameter and return statement.', () => {
				assert.strictEqual(setupScript(`{
					func f(foo: int): void {
						foo;
						return;
						42;
					}
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(GOTO "block-2")
					"block-1":
						(DECL <int> foo)
						(DROP (GET foo))
						(GOTO "caller")
					"unreachable-3":
						(DROP (INT.CONST 42))
						(DROP (TRAP))
						(ENDPROGRAM)
					"block-2":
						(ENDPROGRAM)
				`.trim());
			});
			test.test('conditional return statements.', () => {
				assert.strictEqual(setupScript(`{
					func f(): void {
						if 42 < 43 then {
							44;
							return;
						} else {
							45;
							return;
						};
						46;
					}
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(GOTO "block-2")
					"block-1":
						(GOTO.IF (LT (INT.CONST 42) (INT.CONST 43)) "block-3" "block-4")
					"block-3":
						(DROP (INT.CONST 44))
						(GOTO "caller")
					"unreachable-6":
						(GOTO "block-5")
					"block-4":
						(DROP (INT.CONST 45))
						(GOTO "caller")
					"unreachable-7":
						(GOTO "block-5")
					"block-5":
						(DROP (INT.CONST 46))
						(DROP (TRAP))
						(ENDPROGRAM)
					"block-2":
						(ENDPROGRAM)
				`.trim());
			});
			test.test('no return statement (should be invalid).', () => {
				assert.strictEqual(setupScript(`{
					func f(): void {
						42;
					}
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(GOTO "block-2")
					"block-1":
						(DROP (INT.CONST 42))
						(DROP (TRAP))
						(ENDPROGRAM)
					"block-2":
						(ENDPROGRAM)
				`.trim());
			});
		});
	});
});
