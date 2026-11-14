import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	TYPE,
	Validator,
	AST,
	type SymbolSchema,
	type SymbolSchemaType,
	SymbolSchemaVar,
	SymbolSchemaFunc,
	AssignmentErrorMissingType,
	AssignmentErrorFunctionExit,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	TypeErrorAmbiguousOverload,
	MutabilityError01,
} from '../../../src/index.ts';
import {
	repeat,
	extract_lines,
	assert_shallowStrictEqual,
	assertAssignable,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../../utils.ts';



test.suite('AstNodeVisitorTypeCheck#visit', () => {
	test.suite('ParameterFunction', () => {
		test.test('sets the SymbolSchemaVar `type`.', () => {
			const {stmts, visitors} = setupScript(`{
				\\(a: float, mut b: str): void { return; };
			}`, {typeCheck: false});
			const id_a: bigint = Validator.keyId('a');
			const id_b: bigint = Validator.keyId('b');
			const fn = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
			assert.ok(fn.block.validator.hasSymbol(id_a));
			assert.ok(fn.block.validator.hasSymbol(id_b));
			const info_a: SymbolSchema | undefined = fn.block.validator.getSymbol(id_a);
			const info_b: SymbolSchema | undefined = fn.block.validator.getSymbol(id_b);
			assert_instanceof(info_a, SymbolSchemaVar);
			assert_instanceof(info_b, SymbolSchemaVar);
			assert_shallowStrictEqual(
				[info_a.type, info_b.type],
				repeat(TYPE.ANYTHING, 2),
			);
			fn.parameters.forEach((param) => visitors.typeCheck.visit(param));
			return assert_shallowStrictEqual(
				[info_a.type, info_b.type],
				[TYPE.FLOAT, TYPE.STR],
			);
		});
		test.test('throws when param default value is not assignable to declared type.', () => {
			const param: AST.ParameterFunction = AST.EXPR.Function.fromSource('\\(a?: float = 42): void { return; }').parameters[0];
			const visitor_type_check = new AST.AstNodeVisitorTypeCheck();
			return assert.throws(() => visitor_type_check.visit(param), TypeErrorNotAssignable);
		});
	});


	test.suite('Block', () => {
		test.test('throws for lack of return statement in every code path.', () => {
			const {stmts, visitors} = setupScript(`{
				func foo0(): float { "hello"; }
				func foo2(b: bool): float {
					if b then { return 4.2; } else { "world"; };
				}
			}`, {typeCheck: false});
			const fn1 = stmts[1] as AST.STMT.DeclarationFunction;
			const block0:  AST.Block = (stmts[0] as AST.STMT.DeclarationFunction).block;
			const block1a: AST.Block = (fn1.block.children[0] as AST.STMT.StatementConditional).consequent;
			const block1b: AST.Block = (fn1.block.children[0] as AST.STMT.StatementConditional).alternative as AST.Block;
			assert.throws(() => visitors.typeCheck.visit(block0), AssignmentErrorFunctionExit);
			xjs.Array.forEachAggregated(fn1.parameters, (p) => visitors.typeCheck.visit(p));
			visitors.typeCheck.visit(block1a); // assert does not throw
			visitors.typeCheck.visit(block1b); // assert does not throw
			return assert.throws(() => visitors.typeCheck.visit(fn1.block), AssignmentErrorFunctionExit);
		});
		test.test('throws when not all code paths return.', () => {
			const {stmts, visitors} = setupScript(`{
				\\(): void {
					42;
				};
				\\(b: bool): void {
					if b then {
						return;
					};
				};
				\\(b: bool): void {
					if b then ({
						return;
					}) else 42;
				};
				\\(mut b: bool): void {
					while b do {
						break;
					};
				};
				\\(): int {
					switch 1
						case 2 -> 3
						case 4 | 5 -> { return 6; }
					default { return 7; };
				};
				func f1(): void {
					42;
				}
				func f2(b: bool): void {
					if b then {
						return;
					};
				}
				func f3(b: bool): void {
					if b then ({
						return;
					}) else 42;
				}
				func f4(mut b: bool): void {
					while b do {
						break;
					};
				}
				func f5(): int {
					switch 1
						case 2 -> 3
						case 4 | 5 -> { return 6; }
					default { return 7; };
				}
			}`, {typeCheck: false});
			return xjs.Array.forEachAggregated([
				...stmts.slice(0, 5).map((stmt) => (stmt as AST.STMT.StatementExpression).expr as AST.EXPR.Function),
				...stmts.slice(5).map((stmt) => stmt as AST.STMT.DeclarationFunction),
			], (fn) => assert.throws(() => visitors.typeCheck.visit(fn), AssignmentErrorFunctionExit));
		});
	});


	test.suite('Goal', () => {
		test.test('aggregates multiple errors.', () => {
			const {goal, visitors} = setupScript(`{
				val a: null = null;
				val b: null = null;
				val c: null = null;
				val d: null = null;
				a * b + c * d;
				val e: null = null;
				val f: null = null;
				val g: null = null;
				val h: null = null;
				e * f + g * h;
				if null then 42 else 4.2;
				val x: int = 4.2;
			}`, {typeCheck: false});
			assert.throws(() => visitors.typeCheck.visit(goal), (err) => {
				assertAssignable(err as Error, {
					cons:   AggregateError,
					errors: [
						{
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `a * b` at line 6 col 5.'}, // TODO remove line&col numbers from message
								{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `c * d` at line 6 col 13.'},
							],
						},
						{
							cons:   AggregateError,
							errors: [
								{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `e * f` at line 11 col 5.'},
								{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `g * h` at line 11 col 13.'},
							],
						},
						{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `if null then 42 else 4.2` at line 12 col 5.'},
						{cons: TypeErrorNotAssignable,    message: 'Expression `4.2` is not assignable to type `int`.'},
					],
				});
				return true;
			});
		});
	});


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
					.forEach((s) => typeCheckGoal(`{${s}}`, expect_thrown));
			}
			const {goal, visitors} = setupScript(src, {typeCheck: false});
			return (expect_thrown)
				? assert.throws(() => visitors.typeCheck.visit(goal), expect_thrown)
				: visitors.typeCheck.visit(goal);
		}
		test.test('checks the assigned expression’s type against the variable assignee’s type.', () => {
			const {visitors} = setupScript(`{
				val the_answer: nat = +42;
			}`, {build: false}); // assert does not throw
			const var_: AST.STMT.DeclarationVariable = AST.STMT.DeclarationVariable.fromSource(`
				val  the_answer:  int | float =  21  *  2;
			`);
			visitors.refCheck.visit(var_);
			return visitors.typeCheck.visit(var_);
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
					${stmt}
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
					val fixed = ${src};
				}`, {build: false}).goal.block!.validator.getSymbolBySource('fixed') as SymbolSchemaVar).type, fixedtype));
			});
			test.test('for unfixed variables, infers the narrowest primitive type.', () => {
				xjs.Map.forEachAggregated(PRIMS, ([_, unfixedtype], src) => assertEqualTypes((setupScript(`{
					val mut unfixed = ${src};
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
						TYPE.Record.fromTypes(new Map([[Validator.keyId('x'), typeUnit('hello')]])),
						new TYPE.Dict(TYPE.BOOL, true),
					]),
					TYPE.Record.fromTypes(new Map([
						[Validator.keyId('a'), TYPE.INT],
						[Validator.keyId('b'), TYPE.Tuple.fromTypes([TYPE.STR])],
						[Validator.keyId('c'), new TYPE.List(TYPE.BOOL, true)],
					])),
				]);
			});
			test.test('throws when assigned expression is not a primitive literal, string template, constructor call, or inferrable tuple/record literal.', () => {
				const {stmts, visitors} = setupScript(`{
					val operation = 21 * 2;
					val block_expr = { 42; };
					val tup_literal = (42, "hello", operation);
					val rec_literal = (a= 69, b= "world", c= operation);
					val list_literal = [42, 69];
					val dict_literal = [a= "hello", b= "world"];
				}`, {typeCheck: false});
				xjs.Array.forEachAggregated(stmts, (stmt) => assert.throws(() => visitors.typeCheck.visit(stmt), AssignmentErrorMissingType));
			});
		});
		test.test('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
			assert.throws(() => new AST.AstNodeVisitorTypeCheck().visit(AST.STMT.DeclarationVariable.fromSource(`
				val  the_answer:  null =  21  *  2;
			`)), TypeErrorNotAssignable);
		});
		test.test('throws when assigning int to float.', () => {
			assert.throws(() => new AST.AstNodeVisitorTypeCheck().visit(AST.STMT.DeclarationVariable.fromSource(`
				val x: float = 42;
			`)), TypeErrorNotAssignable);
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
		test.test('allows assigning a collection literal to `anything` (autoboxing at runtime).', () => {
			typeCheckGoal(`{
				val v: anything = (   42,    "hello");
				val s: anything = (a= 42, b= "hello");
			}`);
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
					val bob: Employee | Volunteer = ${BOB};
				}`, (err) => {
					assertAssignable(err as Error, {
						cons:   AggregateError,
						errors: [
							{cons: TypeErrorNotAssignable, message: `Expression \`${BOB}\` is not assignable to type \`(name: str, id: int, job_title: str, hours_worked: float)\`.`},
							{cons: TypeErrorNotAssignable, message: `Expression \`${BOB}\` is not assignable to type \`(name: str, agency: str, hours_worked: float)\`.`},
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
					val t1: anything              = (42, "43");
					val t4: ((int, str) | Object) = (42, "43");

					val r1: anything                    = (a= 42, b= "43");
					val r4: ((a: int, b: str) | Object) = (a= 42, b= "43");

					val s1: mut {42 | 4.3}          = {42};
					val s2: mut {int | float}       = {42};
					val s3: mut Object              = {42};
					val s4: ({int} | {str -> bool}) = {42};
					val s5: ({int} | Object)        = {42};

					val m1: mut {int -> float}               = {42 -> 4.3};
					val m2: mut {int | null -> float | null} = {42 -> 4.3};
					val m3: mut Object                       = {42 -> 4.3};
					val m4: ({int -> float} | {str})         = {42 -> 4.3};
					val m5: ({int -> float} | Object)        = {42 -> 4.3};
				}`); // assert does not throw
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
			const {stmts, visitors} = setupScript(`{
				func f(a: float, mut b: str): void { return; };
			}`, {typeCheck: false});
			const id_f: bigint = Validator.keyId('f');
			const id_a: bigint = Validator.keyId('a');
			const id_b: bigint = Validator.keyId('b');
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
			assert.strictEqual(info_f.types.length, 0);
			assert_shallowStrictEqual(
				[info_a.type, info_b.type],
				repeat(TYPE.ANYTHING, 2),
			);
			visitors.typeCheck.visit(fn);
			assert.strictEqual(info_f.types.length, 1);
			assertEqualTypes(info_f.types[0], new TYPE.Function(TYPE.Tuple.fromTypes([
				TYPE.FLOAT,
				TYPE.STR,
			])));
			return assert_shallowStrictEqual(
				[info_a.type, info_b.type],
				[TYPE.FLOAT, TYPE.STR],
			);
		});
		test.test('pushes to array of overload signatures.', () => {
			const {goal, stmts, visitors} = setupScript(`{
				func f(a: int): void { "1"; return; }
				func f($b: nat): void { "2"; return; }
			}`, {typeCheck: false});
			const {validator} = goal.block!;
			const id_f: bigint = Validator.keyId('f');
			assert.ok(validator.hasSymbol(id_f));
			const info_f: SymbolSchema | undefined = validator.getSymbol(id_f);
			assert_instanceof(info_f, SymbolSchemaFunc);
			assert.strictEqual(info_f.types.length, 0);
			visitors.typeCheck.visit(stmts[0]);
			visitors.typeCheck.visit(stmts[1]);
			return assertEqualTypes(info_f.types, [
				new TYPE.Function(TYPE.Tuple.fromTypes([TYPE.INT])),
				new TYPE.Function(new TYPE.Tuple(), TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[Validator.keyId('b'), TYPE.NAT],
				]))),
			]);
		});
		test.test('throws when overloads have identical signatures.', () => {
			const {stmts, visitors} = setupScript(`{
				func f(a: int): void { "1"; return; }
				func f(b: int): void { "2"; return; }
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]); // assert does not throw
			return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorAmbiguousOverload);
		});
	});


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
					const {stmts, visitors} = setupScript(src, {typeCheck: false});
					visitors.typeCheck.visit(stmts[0]); // assert does not throw
					return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorNotNarrow);
				});
			});
			test.test('accessing variable after claim is narrowed.', () => {
				const {stmts} = setupScript(`{
					val mut x: int | float = 4.2;
					x;            % type \`int | float\`
					claim x: int;
					x;            % type \`int\`
				}`, {build: false});
				const expr_visitor = new AST.ExprVisitorType();
				return assert.deepStrictEqual(
					[stmts[1], stmts[3]].map((stmt) => expr_visitor.visit((stmt as AST.STMT.StatementExpression).expr!)),
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
				const {stmts, visitors} = setupScript(`{
					val mut x: bool | null = false;
					claim x: bool;
					set x = null;
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]); // assert does not throw
				visitors.typeCheck.visit(stmts[1]); // assert does not throw
				return assert.throws(() => visitors.typeCheck.visit(stmts[2]), TypeErrorNotAssignable);
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
				const expr_visitor = new AST.ExprVisitorType();
				return assert.deepStrictEqual(
					[...stmts.slice(1, 3), ...stmts.slice(5, 7)].map((stmt) => expr_visitor.visit((stmt as AST.STMT.StatementExpression).expr!)),
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
					const {stmts, visitors} = setupScript(src, {typeCheck: false});
					if (i === 0) {
						xjs.Array.forEachAggregated(stmts.slice(0, -1), (stmt) => visitors.typeCheck.visit(stmt)); // assert does not throw
						return assert.throws(() => visitors.typeCheck.visit(stmts.at(-1)!), (err) => {
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
						visitors.typeCheck.visit(stmts[0]); // assert does not throw
						assert.throws(() => visitors.typeCheck.visit(stmts[1]), /not yet supported/);
					}
				});
			});
		});
	});


	test.suite('StatementReassignment', () => {
		test.suite('for variable reassignment.', () => {
			test.test('throws when variable assignee type is not supertype.', () => {
				const {goal, visitors} = setupScript(`{
					val mut i: int = 42;
					set i = 4.3;
				}`, {typeCheck: false});
				return assert.throws(() => visitors.typeCheck.visit(goal), TypeErrorNotAssignable);
			});
			test.test('does not allow reassignment of `null` or `Maybe` when uninitialized.', () => {
				const {goal, stmts, visitors} = setupScript(`{
					val mut x?: int;
					val mut y?: int;
					set x = 42;
					set x = null;
					set x = y;
				}`, {typeCheck: false});
				stmts.slice(0, 3).forEach((stmt) => visitors.typeCheck.visit(stmt));
				assert.partialDeepStrictEqual(goal.block!.validator.getSymbolBySource('x'), {
					isWritable:      true,
					isUninitialized: true,
				});
				return xjs.Array.forEachAggregated(stmts.slice(3), (stmt) => assert.throws(() => visitors.typeCheck.visit(stmt), TypeErrorNotAssignable));
			});
			test.test('None/Some assignable to Maybe, but not to each other.', () => {
				setupScript(`{
					val a: Maybe.<int> = None.<int>();
					val b: Maybe.<int> = Some.<int>(42);
				}`, {build: false}); // assert does not throw
				const {stmts, visitors} = setupScript(`{
					val c: Maybe.<float> = None.<int>();
					val d: Maybe.<float> = Some.<int>(42);
					val e: Some.<int> = None.<int>();
					val f: None.<int> = Some.<int>(42);
				}`, {typeCheck: false});
				return xjs.Array.forEachAggregated(stmts, (stmt) => assert.throws(() => visitors.typeCheck.visit(stmt), TypeErrorNotAssignable));
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
					const {goal, visitors} = setupScript(src, {typeCheck: false});
					assert.throws(() => visitors.typeCheck.visit(goal), TypeErrorNotAssignable);
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
					const {goal, visitors} = setupScript(src, {typeCheck: false});
					assert.throws(() => visitors.typeCheck.visit(goal), TypeErrorNotNarrow);
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
					const {goal, visitors} = setupScript(src, {typeCheck: false});
					assert.throws(() => visitors.typeCheck.visit(goal), MutabilityError01);
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
					const {goal, visitors} = setupScript(`{ delete ${src}; }`, {typeCheck: false});
					assert.throws(() => visitors.typeCheck.visit(goal), /only applicable to interface types/);
				});
			});
			test.test('throws when assignee’s base type is not mutable.', {expectFailure: true}, () => {
				const {stmts, visitors} = setupScript(`{
					claim p: interface {
						readonly x: int;
						y: int;
						z?: int;
					};
					delete p.x;
					delete p.y;
					delete p.z;
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				return xjs.Array.forEachAggregated(
					stmts.slice(1),
					(stmt) => assert.throws(() => visitors.typeCheck.visit(stmt), MutabilityError01),
				);
			});
			test.test('throws when assignee’s property is read-only or non-optional.', {expectFailure: true}, () => {
				const {stmts, visitors} = setupScript(`{
					claim p: mut interface {
						readonly x: int;
						y: int | null;
						z?: int;
					};
					delete p.z; % allowed
					delete p.x; % cannot delete a read-only property
					delete p.y; % cannot delete a non-optional property (even if type is nullish)
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				visitors.typeCheck.visit(stmts[1]);
				return xjs.Array.forEachAggregated(
					stmts.slice(2),
					(stmt) => assert.throws(() => visitors.typeCheck.visit(stmt), MutabilityError01),
				);
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
				const {stmts, visitors} = setupScript(`{
					${decl}
					if     cond then { "consequent"; } else { "alternative"; };
					unless cond then { "consequent"; };
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]); // assert does not throw
				return xjs.Array.forEachAggregated(stmts.slice(1), (stmt) => assert.throws(() => visitors.typeCheck.visit(stmt), TypeErrorNotAssignable));
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
				const {stmts, visitors} = setupScript(`{
					${decl}
					while cond do { "consequent"; };
					until cond do { "consequent"; };
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]); // assert does not throw
				return xjs.Array.forEachAggregated(stmts.slice(1), (stmt) => assert.throws(() => visitors.typeCheck.visit(stmt), TypeErrorNotAssignable));
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
				const {stmts, visitors} = setupScript(`{
					for it: str in ${collection} do {
						;
					};
				}`, {typeCheck: false});
				return assert.throws(() => visitors.typeCheck.visit(stmts[0]), TypeErrorNotAssignable);
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
				const {stmts, visitors} = setupScript(`{
					for it: ${vartype} in ["hello", "world"] do {
						;
					};
				}`, {typeCheck: false});
				return assert.throws(() => visitors.typeCheck.visit(stmts[0]), TypeErrorNotNarrow);
			});
		});
		test.test('throws when block type-checking fails.', () => {
			const {stmts, visitors} = setupScript(`{
				for it: str in ["hello", "world"] do {
					42 + it; %> TypeErrorInvalidOperation
				};
			}`, {typeCheck: false});
			assert.throws(() => visitors.typeCheck.visit((stmts[0] as AST.STMT.StatementIteration).block.children[0]), TypeErrorInvalidOperation);
			return assert.throws(() => visitors.typeCheck.visit(stmts[0]), TypeErrorInvalidOperation);
		});
	});


	test.suite('StatementReturn', () => {
		test.test('throws when returned expression is not assignable to declared return type.', () => {
			const {stmts, visitors} = setupScript(`{
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
			assert.throws(() => visitors.typeCheck.visit(ret0), TypeErrorNotAssignable);
			assert.throws(() => visitors.typeCheck.visit(ret1), TypeErrorNotAssignable);
			xjs.Array.forEachAggregated(fn2.parameters, (p) => visitors.typeCheck.visit(p));
			visitors.typeCheck.visit(ret2a); // assert does not throw
			assert.throws(() => visitors.typeCheck.visit(ret2b), TypeErrorNotAssignable);
			xjs.Array.forEachAggregated(fn3.parameters, (p) => visitors.typeCheck.visit(p));
			return assert.throws(() => visitors.typeCheck.visit(ret3), TypeErrorNotAssignable);
		});
		test.test('throws when void function returns non-void expression.', () => {
			const {stmts, visitors} = setupScript(`{
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
			assert.throws(() => visitors.typeCheck.visit(ret0), expected);
			assert.throws(() => visitors.typeCheck.visit(ret1), expected);
			xjs.Array.forEachAggregated(fn2.parameters, (p) => visitors.typeCheck.visit(p));
			visitors.typeCheck.visit(ret2a); // assert does not throw
			assert.throws(() => visitors.typeCheck.visit(ret2b), expected);
			xjs.Array.forEachAggregated(fn3.parameters, (p) => visitors.typeCheck.visit(p));
			return assert.throws(() => visitors.typeCheck.visit(ret3), expected);
		});
		test.test('passes when void function returns void expression.', () => {
			setupScript(`{
				func f(): void { return; }
				func foo1(): void => f.();
				func foo2(b: bool): void {
					if b then { return; } else { return f.(); };
				}
				func foo3(b: bool): void => if b then foo1.() else foo2.(b);
			}`, {build: false}); // assert does not throw
		});
		test.test('throws for empty return statement in non-void function.', () => {
			const {stmts, visitors} = setupScript(`{
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
			assert.throws(() => visitors.typeCheck.visit(ret0), expected);
			xjs.Array.forEachAggregated(fn1.parameters, (p) => visitors.typeCheck.visit(p));
			visitors.typeCheck.visit(ret1a); // assert does not throw
			return assert.throws(() => visitors.typeCheck.visit(ret1b), expected);
		});
		test.test('throws when panicked expression is not an Exception.', () => {
			const {stmts, visitors} = setupScript(`{
				panic Exception.("error1");
				panic "error2";
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]); // assert does not throw
			return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorNotAssignable);
		});
	});
});
