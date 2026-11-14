import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	VALUE,
	TYPE,
	CORE_LIB_NAMES,
	type ConstructorType,
	Validator,
	AST,
	SymbolSchemaType,
	SymbolSchemaVar,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	TypeErrorNoEntry,
	TypeErrorNotCallable,
	TypeErrorArgCount,
	TypeErrorAmbiguousOverload,
} from '../../../src/index.ts';
import {
	extract_tokens,
	extract_lines,
	repeat,
	assert_shallowStrictEqual,
	assertAssignable,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../../utils.ts';



test.suite('ExprVisitorType#visit', () => {
	const VISITOR = new AST.ExprVisitorType();


	test.suite('Constant', () => {
		test.test('returns the result of `this#interpreterValue`, wrapped in a `new Unit`.', () => {
			const constants: AST.EXPR.Constant[] = extract_tokens(`
				null  false  true
				@then  @str  @false  @foobar
				55  -55  +033  -033  0  -0
				2.007  -2.007
				91.27e4  -91.27e4  91.27e-4  -91.27e-4
				-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				"42😀"  "42\\u{1f600}"
			`).map((src) => AST.EXPR.Constant.fromSource(src));
			return assertEqualTypes(
				constants.map((c) => VISITOR.visit(c)),
				constants.map((c) => new TYPE.Unit(c.interpreterValue)),
			);
		});
	});


	test.suite('Template', () => {
		test.test('returns type `nothing` when an operand is `nothing`.', () => {
			const {stmts} = setupScript(`{
				val x: int = 42;
				"""the answer is {{x as <nothing>}} but what is the question?""";
			}`, {build: false});
			assertEqualTypes(
				VISITOR.visit((stmts[1] as AST.STMT.StatementExpression).expr!),
				TYPE.NOTHING,
			);
		});
		test.test('returns type `str` for all other operands.', () => {
			const templates: readonly AST.EXPR.Template[] = [
				AST.EXPR.Template.fromSource('"""42😀"""'),
				AST.EXPR.Template.fromSource('"""the answer is {{7 * 3 * 2}} but what is the question?"""'),
				(setupScript(`{
					val mut x: int = 21;
					"""the answer is {{x * 2}} but what is the question?""";
				}`, {build: false}).stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Template,
			];
			assertEqualTypes(
				templates.map((t) => VISITOR.visit(t)),
				repeat(TYPE.STR, templates.length),
			);
		});
	});


	test.suite('Variable', () => {
		test.test('all core lib class references are of type `Class`.', () => {
			const {stmts} = setupScript(`{
				${CORE_LIB_NAMES.join(';')};
			}`, {build: false}); // assert does not throw
			assertEqualTypes(
				stmts.map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
				repeat(TYPE.CLASS, CORE_LIB_NAMES.length),
			);
		});
		test.test('wraps in `Maybe` when accessed variable is uninitialized.', () => {
			const {stmts} = setupScript(`{
				val mut w:  int = 42;
				val mut x?: int;
				w;
				x;
			}`, {build: false});
			assert.ok( (stmts[0] as AST.STMT.DeclarationVariable).assigned);
			assert.ok(!(stmts[1] as AST.STMT.DeclarationVariable).assigned);
			return assertEqualTypes(
				stmts.slice(2).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
				[
					TYPE.INT,
					new TYPE.Maybe(TYPE.INT),
				],
			);
		});
	});


	test.suite('CollectionLiteral', () => {
		test.test('returns a collection type.', () => {
			const expected: readonly TYPE.Unit[] = [typeUnit(1n), typeUnit(2.0), typeUnit('three')];
			const collections: readonly [
				AST.EXPR.Tuple,
				AST.EXPR.Record,
				AST.EXPR.Set,
				AST.EXPR.Map,
			] = [
				AST.EXPR.Tuple  .fromSource('(   1,    2.0,    "three")'),
				AST.EXPR.Record .fromSource('(a= 1, b= 2.0, _= "three")'),
				AST.EXPR.Set    .fromSource('{   1,    2.0,    "three"}'),
				AST.EXPR.Map    .fromSource(`
					{
						"a" || "" -> 1,
						21 + 21   -> 2.0,
						3.0 * 1.0 -> "three",
					}
				`),
			];
			return assertEqualTypes(
				collections.map((node) => VISITOR.visit(node)),
				[
					TYPE.Tuple.fromTypes(expected),
					TYPE.Record.fromTypes(new Map(collections[1].children.map((c, i) => [
						c.key.id,
						expected[i],
					]))),
					new TYPE.Set(TYPE.Union.all(...expected), true),
					new TYPE.Map(
						TYPE.Union.all(typeUnit('a'), TYPE.INT, TYPE.FLOAT),
						TYPE.Union.all(...expected),
						true,
					),
				],
			);
		});
		test.test('does not throw if value type contains reference type.', () => {
			setupScript(`{
				(   1,    [2.2],    "three");
				(a= 1, b= [2.2], c= "three");
			}`, {build: false}); // assert does not throw
		});
	});


	test.suite('ExpressionBlock', () => {
		test.test('block has no type when the last statement is not an expression-statement.', () => {
			const {stmts, visitors} = setupScript(`{
				val mut x: int = 42;
				val mut y: int | null = {
					x;
					val mut z: int = 69;
					% \`void\` block
				};
				x;
				y;
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]);
			assertEqualTypes(VISITOR.visit((stmts[1] as AST.STMT.DeclarationVariable).assigned!), null);
			return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorNotAssignable);
		});
		test.test('block has no type when the determinant is empty.', () => {
			const {stmts, visitors} = setupScript(`{
				val mut x: int = 42;
				val mut y: int | null = {
					x;
					val mut z: int = 69;
					; %> Error!
				};
				x;
				y;
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]);
			assertEqualTypes(VISITOR.visit((stmts[1] as AST.STMT.DeclarationVariable).assigned!), null);
			return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorNotAssignable);
		});
		test.test('returns the type of the determinant.', () => {
			const {stmts, visitors} = setupScript(`{
				val mut x: int = 42;
				val mut y: int | null = {
					x;
					val mut z: int = 69;
					z; % type \`int\`
				};
				x;
				y;
			}`, {build: false});
			assertEqualTypes(VISITOR.visit((stmts[1] as AST.STMT.DeclarationVariable).assigned!), TYPE.INT);
			return visitors.typeCheck.visit(stmts[1]); // assert does not throw
		});
	});


	test.suite('Access', () => {
		/**
		 * Takes a program source text and compares it to the array of expected types.
		 * The format of the program source text must be
		 * 0 or more variable declarations and 0 or more nonempty expression-statements, possibly intermixed.
		 * (The source text must be valid!)
		 * The expression-statements’ expression types are compared to the expected types via `deepStrictEqual`.
		 * If any of the expecteds are Error (or subclasses) constructors, then the expression type is expected to throw, and is tested against that.
		 * @param source    the program source text to parse and analyze
		 * @param expecteds the expected types of the expressions
		 */
		function testExprTypes(source: string, expecteds: readonly (TYPE.Type | ConstructorType<Error>)[]): void {
			const {goal, visitors} = setupScript(source, {typeCheck: false});
			try {
				visitors.typeCheck.visit(goal);
			} catch {
				// if type-checking fails, proceed to `assert.throws` below
			}
			const statements: readonly AST.STMT.StatementExpression[] = goal.block!.children.filter((stmt) => stmt instanceof AST.STMT.StatementExpression);
			return expecteds.some((it) => it instanceof Function)
				? (assert.strictEqual(statements.length, expecteds.length, 'Arrays are not the same length.'), xjs.Array.forEachAggregated(statements, (stmt, i) => {
					const expected: TYPE.Type | ConstructorType<Error> = expecteds[i];
					return expected instanceof Function
						? assert.throws(() => VISITOR.visit(stmt.expr!), expected)
						: assertEqualTypes(VISITOR.visit(stmt.expr!), expected);
				}))
				: assertEqualTypes(
					statements.map((stmt) => VISITOR.visit(stmt.expr!)),
					expecteds as TYPE.Type[],
				);
		}

		test.suite('when base is null.', () => {
			test.test('normal/maybe/result access throws.', () => {
				testExprTypes(`{
					null.3;
					null.four;
					null.[((((),),),)];
					null?.3;
					null?.four;
					null?.[((((),),),)];
					null!.3;
					null!.four;
					null!.[((((),),),)];
				}`, [
					...repeat(TypeErrorNoEntry, 2),
					...repeat(TypeErrorInvalidOperation, 7),
				]);
			});
			test.test('chained maybe access does not unwrap recursively.', () => {
				const propid: bigint = Validator.keyId('prop');
				const prop1: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL]);       // (bool,)
				const prop2 = new TYPE.Tuple([{type: TYPE.BOOL, optional: true}]); // (?: bool)
				return testExprTypes(`{
					val mut bound1: (prop?: (bool,)) = (prop= (true,));
					val mut bound2: (prop?: (?: bool))? = Some.<(prop?: (?: bool))>((prop= ()));
					bound1;
					bound1.prop;
					bound1.prop?.0;
					bound2;
					bound2?.prop;
					bound2?.prop?.0; %> TypeErrorNoEntry
				}`, [
					new TYPE.Record(new Map([[propid, {type: prop1, optional: true}]])), // (prop?: (bool,))
					new TYPE.Maybe(prop1),                                               // Maybe[(bool,)]
					new TYPE.Maybe(TYPE.BOOL),                                           // Maybe[bool]
					new TYPE.Maybe(new TYPE.Record(new Map([[propid, {type: prop2, optional: true}]]))), // Maybe[(prop?: (?: bool))]
					new TYPE.Maybe(new TYPE.Maybe(prop2)),                                               // Maybe[Maybe[(?: bool)]]
					TypeErrorNoEntry,
				]);
			});
			test.test('chained result access does not unwrap recursively.', () => {
				const propid: bigint = Validator.keyId('prop');
				return testExprTypes(`{
					val bound1: (prop: (float,)!)! = Ok.<(prop: Result.<(float,)>)>((prop= Ok.<(float,)>((4.2,))));
					val bound2: (str,)!! = Ok.<Result.<(str,)>>(Ok.<(str,)>(("hello",)));
					bound1;
					bound1!.prop;
					bound1!.prop!.0; %> TypeErrorNoEntry
					bound2;
					bound2!.0; %> TypeErrorNoEntry
				}`, [
					new TYPE.Result(TYPE.Record.fromTypes(new Map([[propid, new TYPE.Result(TYPE.Tuple.fromTypes([TYPE.FLOAT]))]]))), // Result[(prop: Result[(float,)])]
					new TYPE.Result(new TYPE.Result(TYPE.Tuple.fromTypes([TYPE.FLOAT]))),                                             // Result[Result[(float,)]]
					TypeErrorNoEntry,
					new TYPE.Result(new TYPE.Result(TYPE.Tuple.fromTypes([TYPE.STR]))), // Result[Result[(str,)]]
					TypeErrorNoEntry,
				]);
			});
		});

		test.suite('access manner: by index / by key', () => {
			test.suite('simple base types.', () => {
				test.test('entry is not optional and base is not nullish.', () => {
					testExprTypes(`{
						val     tup_fixed:   (int, float, str) = (1, 2.0, "three");
						val mut tup_unfixed: (int, float, str) = (1, 2.0, "three");

						val     rec_fixed:   (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");
						val mut rec_unfixed: (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");

						tup_fixed.0;    % type \`int\`
						tup_fixed.1;    % type \`float\`
						tup_fixed.2;    % type \`str\`
						tup_unfixed.0;  % type \`int\`
						tup_unfixed.1;  % type \`float\`
						tup_unfixed.2;  % type \`str\`

						rec_fixed.a;   % type \`int\`
						rec_fixed.b;   % type \`float\`
						rec_fixed._;   % type \`str\`
						rec_unfixed.a; % type \`int\`
						rec_unfixed.b; % type \`float\`
						rec_unfixed._; % type \`str\`


						val tup_a: (int, int, ?: int) = (10, 20);
						val tup_b: (int, int, ?: int) = (10, 20, 30);

						val rec_a: (x: int, y?: int, z: int) = (x= 10, z= 20);
						val rec_b: (x: int, y?: int, z: int) = (x= 10, z= 20, y= 30);

						tup_a?.1;
						tup_b?.1;

						rec_a?.z;
						rec_b?.z;
					}`, [
						...repeat([
							TYPE.INT,
							TYPE.FLOAT,
							TYPE.STR,
						], 4).flat(),
						...repeat(TypeErrorInvalidOperation, 4),
					]);
				});
				test.test('entry is optional.', () => {
					testExprTypes(`{
						val tup_a: (int, int, ?: int) = (10, 20);
						val tup_b: (int, int, ?: int) = (10, 20, 30);

						val rec_a: (x: int, y?: int, z: int) = (x= 10, z= 20);
						val rec_b: (x: int, y?: int, z: int) = (x= 10, z= 20, y= 30);

						tup_a.2; % type \`Maybe[int]\`
						tup_b.2; % type \`Maybe[int]\`

						rec_a?.y; %> TypeErrorInvalidOperation
						rec_b?.y; %> TypeErrorInvalidOperation

						val     tupo1_f: (int, float, ?: str) = (1, 2.0, "three");
						val mut tupo1_u: (int, float, ?: str) = (1, 2.0, "three");
						val mut tupo2_u: (int, float, ?: str) = (1, 2.0);

						val     reco1_f: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
						val mut reco1_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
						val mut reco2_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0);

						tupo1_f.2; % type \`Maybe[str]\`
						tupo1_u.2; % type \`Maybe[str]\`
						tupo2_u.2; % type \`Maybe[str]\`

						reco1_f?.b; %> TypeErrorInvalidOperation
						reco1_u?.b; %> TypeErrorInvalidOperation
						reco2_u?.b; %> TypeErrorInvalidOperation
					}`, [
						...repeat(new TYPE.Maybe(TYPE.INT), 2),
						...repeat(TypeErrorInvalidOperation, 2),
						...repeat(new TYPE.Maybe(TYPE.STR), 3),
						...repeat(TypeErrorInvalidOperation, 3),
					]);
				});
				test.test('base is an optional variable.', () => {
					testExprTypes(`{
						val mut tup_a?: (int, int, ?: int);
						val mut tup_b?: (int, int, ?: int);
						set tup_a = (10, 20);

						val mut rec_a?: (x: int, y?: int, z: int);
						val mut rec_b?: (x: int, y?: int, z: int);
						set rec_a = (x= 10, z= 20);

						tup_a.1;
						tup_a.2;
						tup_b.1;
						tup_b.2;

						rec_a.x;
						rec_a.y;
						rec_b.x;
						rec_b.y;

						tup_a?.1; % type \`Maybe[int]\`
						tup_a?.2; % type \`Maybe[Maybe[int]]\`
						tup_b?.1; % type \`Maybe[int]\`
						tup_b?.2; % type \`Maybe[Maybe[int]]\`

						rec_a?.z; % type \`Maybe[int]\`
						rec_a?.y; % type \`Maybe[Maybe[int]]\`
						rec_b?.z; % type \`Maybe[int]\`
						rec_b?.y; % type \`Maybe[Maybe[int]]\`
					}`, [
						...repeat(TypeErrorNoEntry, 8),
						...repeat([
							new TYPE.Maybe(TYPE.INT),
							new TYPE.Maybe(new TYPE.Maybe(TYPE.INT)),
						], 4).flat(),
					]);
				});
				test.test('base is an explicit Maybe.', () => {
					testExprTypes(`{
						val mut tup_a: Maybe.<(int, int, ?: int)> = None.<(int, int, ?: int)>();
						val mut tup_b: Maybe.<(int, int, ?: int)> = None.<(int, int, ?: int)>();
						set tup_a = Some.<(int, int, ?: int)>((10, 20));

						val mut rec_a?: Maybe.<(x: int, y?: int, z: int)>;
						val mut rec_b?: Maybe.<(x: int, y?: int, z: int)>;
						set rec_a = Some.<(x: int, y?: int, z: int)>((x= 10, z= 20));

						tup_a.1;
						tup_a.2;
						tup_b.1;
						tup_b.2;

						rec_a.x;
						rec_a.y;
						rec_b.x;
						rec_b.y;

						tup_a?.1; % type \`Maybe[int]\`
						tup_a?.2; % type \`Maybe[Maybe[int]]\`
						tup_b?.1; % type \`Maybe[int]\`
						tup_b?.2; % type \`Maybe[Maybe[int]]\`

						rec_a?.z; %> TypeErrorNoEntry
						rec_a?.y; %> TypeErrorNoEntry
						rec_b?.z; %> TypeErrorNoEntry
						rec_b?.y; %> TypeErrorNoEntry
					}`, [
						...repeat(TypeErrorNoEntry, 8),
						...repeat([
							new TYPE.Maybe(TYPE.INT),
							new TYPE.Maybe(new TYPE.Maybe(TYPE.INT)),
						], 2).flat(),
						...repeat(TypeErrorNoEntry, 4),
					]);
				});
				test.test('base is an explicit Result.', () => {
					testExprTypes(`{
						val mut tup_a: Result.<(int, int, ?: int)> = Fail.<(int, int, ?: int)>(Exception.("tup_a"));
						val mut tup_b: Result.<(int, int, ?: int)> = Fail.<(int, int, ?: int)>(Exception.("tup_b"));
						set tup_a = Ok.<(int, int, ?: int)>((10, 20));

						tup_a.1;
						tup_a.2;
						tup_b.1;
						tup_b.2;

						tup_a!.1; % type \`Result[int]\`
						tup_a!.2; % type \`Result[Maybe[int]]\`
						tup_b!.1; % type \`Result[int]\`
						tup_b!.2; % type \`Result[Maybe[int]]\`
					}`, [
						...repeat(TypeErrorNoEntry, 4),
						...repeat([
							new TYPE.Result(TYPE.INT),
							new TYPE.Result(new TYPE.Maybe(TYPE.INT)),
						], 2).flat(),
					]);
				});
				test.test('throws when base object is of incorrect type.', () => {
					testExprTypes(`{
						val mut a:                    anything = (   10,    20);
						val mut b: (int, int)       | anything = (   10,    20);
						val mut c:                    anything = (x= 10, y= 20);
						val mut d: (x: int, y: int) | anything = (x= 10, y= 20);

						a.0;
						b.1;
						c.x;
						d.y;

						(4).2;
						[10, 20, 30].1;

						(4).c;
						[a= 10, b= 20, c= 30].b;

						a?.0;
						b?.1;
						c?.x;
						d?.y;

						(4)?.2;
						[10, 20, 30]?.1;

						(4)?.c;
						[a= 10, b= 20, c= 30]?.b;
					}`, [
						...repeat(TypeErrorNoEntry, 8),
						...repeat(TypeErrorInvalidOperation, 8),
					]);
				});
				test.test('throws when index is out of bounds / when key is out of range.', () => {
					testExprTypes(`{
						(1, 2.0, "three").3;
						(a= 1, b= 2.0, c= "three").d;
					}`, repeat(TypeErrorNoEntry, 2));
				});
			});

			test.suite('intersection base types.', () => {
				const DECLS = `
					type A = (a: str);
					type B = (b: str);
					type C = (c: str);
					type D = (d: str);
					val mut tup: (   A,     B,       int) & (   C,  ?: D)        = ((a= "tup.0.a", c= "tup.0.c"), (b= "tup.1.b", d= "tup.1.d"), 42);
					val mut rec: (x: A, y?: int, z?: B)   & (x: C,        z?: D) = (x= (a= "rec.x.a", c= "rec.x.c"), y= 42, z= (b= "rec.z.b", d= "rec.z.d"));
				`;
				const A: TYPE.Record = TYPE.Record.fromTypes(new Map([[Validator.keyId('a'), TYPE.STR]]));
				const B: TYPE.Record = TYPE.Record.fromTypes(new Map([[Validator.keyId('b'), TYPE.STR]]));
				const C: TYPE.Record = TYPE.Record.fromTypes(new Map([[Validator.keyId('c'), TYPE.STR]]));
				const D: TYPE.Record = TYPE.Record.fromTypes(new Map([[Validator.keyId('d'), TYPE.STR]]));
				test.test('every constituent has the entry and it’s required in some constituent.', () => {
					testExprTypes(`{
						${DECLS}
						tup.0;  % required & required % type \`A & C\`
						rec.x;  % required & required % type \`A & C\`
						tup.1;  % required & optional % type \`B & D\`
						tup?.0; % required & required
						rec?.x; % required & required
						tup?.1; % required & optional
					}`, [
						...repeat(A.intersect(C), 2),
						B.intersect(D),
						...repeat(TypeErrorInvalidOperation, 3),
					]);
				});
				test.test('every constituent has the entry and it’s optional in every constituent.', () => {
					testExprTypes(`{
						${DECLS}
						rec.z;  % optional & optional % type \`Maybe[B & D]\`
						rec?.z; % optional & optional
					}`, [
						new TYPE.Maybe(B.intersect(D)),
						TypeErrorInvalidOperation,
					]);
				});
				test.test('some constituent does not have the entry.', () => {
					testExprTypes(`{
						${DECLS}
						tup.2;  % required & missing % type \`int\`
						tup.3;  % missing  & missing
						rec.y;  % optional & missing % type \`Maybe[int]\`
						tup?.2; % required & missing
						tup?.3; % missing  & missing
						rec?.y; % optional & missing
					}`, [
						TYPE.INT,
						AggregateError,
						new TYPE.Maybe(TYPE.INT),
						...repeat(TypeErrorInvalidOperation, 3),
					]);
				});
				test.test('an intersection with union constituents.', () => {
					testExprTypes(`{
						val mut collectionA: ((alpha: bool, bravo: 1) | (bravo: 2 | 3 | 4)) & (bravo: 3 | 4 | 5) = (bravo= 3);
						val mut collectionB: ((alpha: bool, bravo?: 1) | (bravo?: 2 | 3 | 4)) & (bravo?: 3 | 4 | 5) = (alpha= true);
						collectionA.bravo; % type \`3 | 4\`
						collectionB.bravo; % type \`Maybe[3 | 4]\`
					}`, [
						typeUnit(3n).union(typeUnit(4n)),
						new TYPE.Maybe(typeUnit(3n).union(typeUnit(4n))),
					]);
				});
			});

			test.suite('union base types.', () => {
				const DECLS = `
					val mut tup: (   str,     bool,     sym) | (   int, ?: float)          = ("hello", true, @hello);
					val mut rec: (a: str, b?: bool, c?: sym) | (a: int,           c?: str) = (a= 42);
				`;
				test.test('throws when some constituent is of incorrect type.', () => { // test only needed for unions (invalid for intersections)
					testExprTypes(`{
						val mut mixed_tup: (str, bool, sym) | (a: str,  b?: bool, c?: sym) = ("hello", true, @world);
						val mut mixed_rec: (int, ?: float)  | (a: int, c?: str)            = (a= 42);

						mixed_tup.0;
						mixed_tup.a;
						mixed_rec.0;
						mixed_rec.a;
						mixed_tup?.0;
						mixed_tup?.a;
						mixed_rec?.0;
						mixed_rec?.a;
					}`, repeat(TypeErrorInvalidOperation, 8));
				});
				test.test('every constituent has the entry and it’s required in every constituent.', () => {
					testExprTypes(`{
						${DECLS}
						tup.0; % type \`str | int\`
						rec.a; % type \`str | int\`
						tup?.0;
						rec?.a;
					}`, [
						...repeat(TYPE.STR.union(TYPE.INT), 2),
						...repeat(TypeErrorInvalidOperation, 2),
					]);
				});
				test.test('every constituent has the entry and it’s optional in some constituent.', () => {
					testExprTypes(`{
						${DECLS}
						tup.1;  % required | optional % type \`Maybe[bool | float]\`
						rec.c;  % optional | optional % type \`Maybe[sym  | str]\`
						tup?.1; % required | optional
						rec?.c; % optional | optional
					}`, [
						new TYPE.Maybe(TYPE.Union.all(TYPE.BOOL, TYPE.FLOAT)),
						new TYPE.Maybe(TYPE.Union.all(TYPE.SYM,  TYPE.STR)),
						...repeat(TypeErrorInvalidOperation, 2),
					]);
				});
				test.test('some constituent does not have the entry.', () => {
					testExprTypes(`{
						${DECLS}
						tup.2;  % required | missing
						rec.b;  % optional | missing
						tup?.2; % required | missing
						rec?.b; % optional | missing
					}`, [
						...repeat(TypeErrorNoEntry, 2),
						...repeat(TypeErrorInvalidOperation, 2),
					]);
				});
				test.test('a union with intersection constituents.', () => {
					testExprTypes(`{
						val mut collectionA: (alpha: bool, bravo: 2 | 3 | 4) & (bravo: 3 | 4 | 5, charlie: str) | (bravo: 6) = (bravo= 6);
						val mut collectionB: (alpha: bool, bravo?: 2 | 3 | 4) & (bravo?: 3 | 4 | 5, charlie: str) | (bravo?: 6) = (bravo= 6);
						collectionA.bravo; % type \`3 | 4 | 6\`
						collectionB.bravo; % type \`Maybe[3 | 4 | 6]\`
					}`, [
						typeUnit(3n).union(typeUnit(4n)).union(typeUnit(6n)),
						new TYPE.Maybe(typeUnit(3n).union(typeUnit(4n)).union(typeUnit(6n))),
					]);
				});
			});
		});

		test.suite('access manner: access by expression.', () => {
			let TYPE_INT_FLOAT_STR:       TYPE.Type;
			let TYPE_MAYBE_INT_FLOAT_STR: TYPE.Type;
			const DECLS = `
				val     list_fixed:   List.<     int | float | str> = [   1,    2.0,    "three"];
				val     dict_fixed:   Dict.<     int | float | str> = [a= 1, b= 2.0, c= "three"];
				val     set_fixed:    Set .<     int | float | str> = {1, 2.0, "three"};
				val     map_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				val mut list_unfixed: List.<     int | float | str> = list_fixed;
				val mut dict_unfixed: Dict.<     int | float | str> = dict_fixed;
				val mut set_unfixed:  Set .<     int | float | str> = set_fixed;
				val mut map_unfixed:  Map .<str, int | float | str> = map_fixed;
			`;
			test.before(() => {
				TYPE_INT_FLOAT_STR       = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR);
				TYPE_MAYBE_INT_FLOAT_STR = new TYPE.Maybe(TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR));
			});
			test.test('returns union types.', () => {
				testExprTypes(`{
					${DECLS}

					list_fixed.[0];      % type \`int | float | str\`
					list_fixed.[1];      % type \`int | float | str\`
					list_fixed.[2];      % type \`int | float | str\`
					dict_fixed.[@a];     % type \`int | float | str\`
					dict_fixed.[@b];     % type \`int | float | str\`
					dict_fixed.[@c];     % type \`int | float | str\`
					set_fixed.[1];       % type \`bool\`
					set_fixed.[2.0];     % type \`bool\`
					set_fixed.["three"]; % type \`bool\`
					map_fixed.["a"];     % type \`int | float | str\`
					map_fixed.["b"];     % type \`int | float | str\`
					map_fixed.["c"];     % type \`int | float | str\`

					list_unfixed.[0];      % type \`int | float | str\`
					list_unfixed.[1];      % type \`int | float | str\`
					list_unfixed.[2];      % type \`int | float | str\`
					dict_unfixed.[@a];     % type \`int | float | str\`
					dict_unfixed.[@b];     % type \`int | float | str\`
					dict_unfixed.[@c];     % type \`int | float | str\`
					set_unfixed.[1];       % type \`bool\`
					set_unfixed.[2.0];     % type \`bool\`
					set_unfixed.["three"]; % type \`bool\`
					map_unfixed.["a"];     % type \`int | float | str\`
					map_unfixed.["b"];     % type \`int | float | str\`
					map_unfixed.["c"];     % type \`int | float | str\`

					list_fixed?.[0];  % type \`Maybe[int | float | str]\`
					list_fixed?.[1];  % type \`Maybe[int | float | str]\`
					list_fixed?.[2];  % type \`Maybe[int | float | str]\`
					dict_fixed?.[@a]; % type \`Maybe[int | float | str]\`
					dict_fixed?.[@b]; % type \`Maybe[int | float | str]\`
					dict_fixed?.[@c]; % type \`Maybe[int | float | str]\`
					map_fixed?.["a"]; % type \`Maybe[int | float | str]\`
					map_fixed?.["b"]; % type \`Maybe[int | float | str]\`
					map_fixed?.["c"]; % type \`Maybe[int | float | str]\`

					list_unfixed?.[0];  % type \`Maybe[int | float | str]\`
					list_unfixed?.[1];  % type \`Maybe[int | float | str]\`
					list_unfixed?.[2];  % type \`Maybe[int | float | str]\`
					dict_unfixed?.[@a]; % type \`Maybe[int | float | str]\`
					dict_unfixed?.[@b]; % type \`Maybe[int | float | str]\`
					dict_unfixed?.[@c]; % type \`Maybe[int | float | str]\`
					map_unfixed?.["a"]; % type \`Maybe[int | float | str]\`
					map_unfixed?.["b"]; % type \`Maybe[int | float | str]\`
					map_unfixed?.["c"]; % type \`Maybe[int | float | str]\`
				}`, [
					...repeat([
						...repeat(TYPE_INT_FLOAT_STR, 6),
						...repeat(TYPE.BOOL, 3),
						...repeat(TYPE_INT_FLOAT_STR, 3),
					], 2).flat(),
					...repeat(TYPE_MAYBE_INT_FLOAT_STR, 18),
				]);
			});
			test.test('unsupported: throws for string access of dict.', () => {
				assert.throws(() => VISITOR.visit(AST.EXPR.Access.fromSource('[a= 10, b= 20, c= 30].["a"]')), /String keys for dict access are not yet supported\./);
			});
			test.test('throws when base object is of incorrect type.', () => {
				testExprTypes(`{
					(4).[2];
					(10, 20, 30).[1];
					(a= 10, b= 20, c= 30).[@b];

					(4)?.[2];
					(10, 20, 30)?.[1];
					(a= 10, b= 20, c= 30)?.[@b];
				}`, repeat(TypeErrorInvalidOperation, 6));
			});
			test.test('allows normal and optional expression access on sets.', () => {
				testExprTypes(`{
					Set.<int>((10, 20, 30))?.[20];
					{10, 20, 30}?.[20];
				}`, repeat(TYPE.BOOL, 2));
				return testExprTypes(`{
					val     set_fixed:   Set.<int | float | str> = {1, 2.0, "three"};
					val mut set_unfixed: Set.<int | float | str> = set_fixed;

					set_fixed.[1];
					set_fixed.[2.0];
					set_fixed?.["three"];
					set_fixed?.[42.0];

					set_unfixed.[1];
					set_unfixed.[2.0];
					set_unfixed?.["three"];
					set_unfixed?.[42.0];
				}`, repeat(TYPE.BOOL, 8));
			});
			test.test('throws when constituents are of different types.', () => {
				testExprTypes(`{
					val mut mixed_list: List.<str | bool | sym> | Dict.<str | bool | sym> = ["hello", true, @world];
					val mut mixed_dict: List.<int | float>      | Dict.<int | str>        = [a= 42];

					val mut mixed_set:   {int} | {int -> int} = {42, 43};
					val mut mixed_map:   {int} | {int -> int} = {42 -> 43};

					mixed_list.[@a];
					mixed_dict.[0];
					mixed_set.[21];
					mixed_map.[21];

					mixed_list?.[@a];
					mixed_dict?.[0];
					mixed_set?.[21];
					mixed_map?.[21];
				}`, repeat(TypeErrorInvalidOperation, 8));
			});
			test.test('for Lists/Dicts/Maps: when accessor expression is correct type but out of bounds/range, returns union type.', () => {
				testExprTypes(`{
					${DECLS}

					list_fixed.[3];    % type \`int | float | str\`
					list_fixed.[-4];   % type \`int | float | str\`
					dict_fixed.[@d];   % type \`int | float | str\`

					list_unfixed.[3];  % type \`int | float | str\`
					list_unfixed.[-4]; % type \`int | float | str\`
					dict_unfixed.[@d]; % type \`int | float | str\`

					list_fixed?.[3];  % type \`Maybe[int | float | str]\`
					list_fixed?.[-4]; % type \`Maybe[int | float | str]\`
					dict_fixed?.[@d]; % type \`Maybe[int | float | str]\`

					list_unfixed?.[3];  % type \`Maybe[int | float | str]\`
					list_unfixed?.[-4]; % type \`Maybe[int | float | str]\`
					dict_unfixed?.[@d]; % type \`Maybe[int | float | str]\`
				}`, [
					...repeat(TYPE_INT_FLOAT_STR, 6),
					...repeat(TYPE_MAYBE_INT_FLOAT_STR, 6),
				]);
			});
			test.test('for Lists/Dicts: throws when accessor expression is of incorrect type.', () => {
				testExprTypes(`{
					[1, 2.0, "three"].["3"];
					[a= 1, b= 2.0, c= "three"].[3];
					[1, 2.0, "three"]?.["3"];
					[a= 1, b= 2.0, c= "three"]?.[3];
				}`, repeat(TypeErrorNotNarrow, 4));
			});
			test.test('for Sets/Maps: when expression is correct type but out of range or incorrect type, returns entry type.', () => {
				testExprTypes(`{
					${DECLS}
					val     set_mut_fixed:   Set .<     int | float | str> = {1, 2.0, "three"};
					val     map_mut_fixed:   Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
					val mut set_mut_unfixed: Set .<     int | float | str> = set_fixed;
					val mut map_mut_unfixed: Map .<str, int | float | str> = map_fixed;

					% correct type, but out of range
					set_fixed      .[42.0]; % type \`bool\`
					map_fixed      .["d"];  % type \`int | float | str\`
					set_unfixed    .[42.0]; % type \`bool\`
					map_unfixed    .["d"];  % type \`int | float | str\`
					set_mut_fixed  .[42.0]; % type \`bool\`
					map_mut_fixed  .["d"];  % type \`int | float | str\`
					set_mut_unfixed.[42.0]; % type \`bool\`
					map_mut_unfixed.["d"];  % type \`int | float | str\`

					map_fixed      ?.["d"];  % type \`Maybe[int | float | str]\`
					map_unfixed    ?.["d"];  % type \`Maybe[int | float | str]\`
					map_mut_fixed  ?.["d"];  % type \`Maybe[int | float | str]\`
					map_mut_unfixed?.["d"];  % type \`Maybe[int | float | str]\`

					% incorrect type
					set_fixed      .[true]; % type \`bool\`
					map_fixed      .[true]; % type \`int | float | str\`
					set_unfixed    .[true]; % type \`bool\`
					map_unfixed    .[true]; % type \`int | float | str\`
					set_mut_fixed  .[true]; % type \`bool\`
					map_mut_fixed  .[true]; % type \`int | float | str\`
					set_mut_unfixed.[true]; % type \`bool\`
					map_mut_unfixed.[true]; % type \`int | float | str\`

					map_fixed      ?.[true]; % type \`Maybe[int | float | str]\`
					map_unfixed    ?.[true]; % type \`Maybe[int | float | str]\`
					map_mut_fixed  ?.[true]; % type \`Maybe[int | float | str]\`
					map_mut_unfixed?.[true]; % type \`Maybe[int | float | str]\`
				}`, repeat([
					...repeat([
						TYPE.BOOL,
						TYPE_INT_FLOAT_STR,
					], 4).flat(),
					...repeat(TYPE_MAYBE_INT_FLOAT_STR, 4),
				], 2).flat());
			});
		});
	});


	test.suite('Call', () => {
		const EVALUATE = [
			'Boolean.(42)',
			'Integer.(42)',
			'Natural.(42)',
			'Float.(42)',
			'String.(42)',
			'List.<int>((1, 2, 3))',
			'Dict.<int>((a= 1, b= 2, c= 3))',
			'Set.<int>((1, 2, 3))',
			`Map.<int, float>((
				(1, 0.1),
				(2, 0.2),
				(3, 0.4),
			))`,
			'Exception.("message")',
			'None.<int>()',
			'Some.<int>(42)',
			'Fail.<int>(Exception.("message"))',
			'Ok.<int>(42)',
			'Fail.<int, Exception>(Exception.("message"))',
			'Ok.<int, Exception>(42)',
		] as const;
		const BOOL_CONS = [
			'Boolean.(null)',
			'Boolean.(false)',
			'Boolean.(true)',
			'Boolean.(@hello)',
			'Boolean.(-0)',
			'Boolean.(-42)',
			'Boolean.(+0)',
			'Boolean.(+42)',
			'Boolean.(0.0)',
			'Boolean.(4.2)',
			'Boolean.("hello")',
		] as const;
		const INT_CONS = [
			'Integer.(-42)',
			'Integer.(+42)',
			'Integer.(4.2)',
		] as const;
		const NAT_CONS = [
			'Natural.(-42)',
			'Natural.(+42)',
			'Natural.(4.2)',
		] as const;
		const FLOAT_CONS = [
			'Float.(-42)',
			'Float.(+42)',
			'Float.(4.2)',
		] as const;
		const STRING_CONS = [
			'String.(null)',
			'String.(true)',
			'String.(-42)',
			'String.(+42)',
			'String.(4.2)',
			'String.("hello")',
			'String.(())',
			'String.((a= 1))',
			'String.([])',
			'String.([a= 1])',
			'String.({})',
			'String.({"a" -> 1})',
		] as const;
		const LIST_CONS = [
			'List.<int>()',
			'List.<int>(())',
			'List.<int>(List.<int>())',
			'List.<int>([])',
			'List.<int>(Set.<int>())',
			'List.<int>({})',
			'List.<int>((1, 2, 3))',
			'List.<int>(List.<int>((1, 2, 3)))',
			'List.<int>([1, 2, 3])',
			'List.<int>(Set.<int>((1, 2, 3)))',
			'List.<int>({1, 2, 3})',
		] as const;
		const DICT_CONS = [
			'Dict.<int>()',
			'Dict.<int>(())',
			// 'Dict.<int>((=))', // empty record is impossible
			'Dict.<int>(List.<(sym, int)>())',
			'Dict.<int>([])',
			'Dict.<int>(Dict.<int>())',
			// 'Dict.<int>([=])', // empty dict literal is impossible
			'Dict.<int>(Set.<(sym, int)>())',
			'Dict.<int>({})',
			'Dict.<int>(Map.<sym, int>())',
			// 'Dict.<int>({->})', // empty map literal is impossible
			`Dict.<int>((
				(@a, 1),
				(@b, 2),
				(@c, 3),
			))`,
			'Dict.<int>((a= 1, b= 2, c= 3))',
			`Dict.<int>(List.<(sym, int)>((
				(@a, 1),
				(@b, 2),
				(@c, 3),
			)))`,
			`Dict.<int>([
				(@a, 1),
				(@b, 2),
				(@c, 3),
			])`,
			'Dict.<int>(Dict.<int>((a= 1, b= 2, c= 3)))',
			'Dict.<int>([a= 1, b= 2, c= 3])',
			`Dict.<int>(Set.<(sym, int)>((
				(@a, 1),
				(@b, 2),
				(@c, 3),
			)))`,
			`Dict.<int>({
				(@a, 1),
				(@b, 2),
				(@c, 3),
			})`,
			`Dict.<int>(Map.<sym, int>((
				(@a, 1),
				(@b, 2),
				(@c, 3),
			)))`,
			`Dict.<int>({
				@a -> 1,
				@b -> 2,
				@c -> 3,
			})`,
		] as const;
		const SET_CONS = [
			'Set.<int>()',
			'Set.<int>(())',
			'Set.<int>(List.<int>())',
			'Set.<int>([])',
			'Set.<int>(Set.<int>())',
			'Set.<int>({})',
			'Set.<int>((1, 2, 3))',
			'Set.<int>(List.<int>((1, 2, 3)))',
			'Set.<int>([1, 2, 3])',
			'Set.<int>(Set.<int>((1, 2, 3)))',
			'Set.<int>({1, 2, 3})',
		] as const;
		const MAP_CONS = [
			'Map.<int, float>()',
			'Map.<int, float>(())',
			'Map.<int, float>(List.<(int, float)>())',
			'Map.<int, float>([])',
			'Map.<int, float>(Set.<(int, float)>())',
			'Map.<int, float>({})',
			'Map.<int, float>(Map.<int, float>())',
			// 'Map.<int, float>({->})', // empty map literal is impossible
			`Map.<int, float>((
				(1, 0.1),
				(2, 0.2),
				(3, 0.4),
			))`,
			`Map.<int, float>(List.<(int, float)>((
				(1, 0.1),
				(2, 0.2),
				(3, 0.4),
			)))`,
			`Map.<int, float>([
				(1, 0.1),
				(2, 0.2),
				(3, 0.4),
			])`,
			`Map.<int, float>(Set.<(int, float)>((
				(1, 0.1),
				(2, 0.2),
				(3, 0.4),
			)))`,
			`Map.<int, float>({
				(1, 0.1),
				(2, 0.2),
				(3, 0.4),
			})`,
			`Map.<int, float>(Map.<int, float>((
				(1, 0.1),
				(2, 0.2),
				(3, 0.4),
			)))`,
			`Map.<int, float>({
				1 -> 0.1,
				2 -> 0.2,
				3 -> 0.4,
			})`,
		] as const;
		const EXCEPTION_CONS = [
			'Exception.("message")',
			'Exception.("message", Exception.("cause"))',
		] as const;

		test.test('evaluates Callable Class Names.', () => {
			assertEqualTypes(
				EVALUATE.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				[
					TYPE.BOOL,
					TYPE.INT,
					TYPE.NAT,
					TYPE.FLOAT,
					TYPE.STR,
					new TYPE.List(TYPE.INT, true),
					new TYPE.Dict(TYPE.INT, true),
					new TYPE.Set(TYPE.INT, true),
					new TYPE.Map(TYPE.INT, TYPE.FLOAT, true),
					TYPE.EXCP,
					new TYPE.None(TYPE.INT),
					new TYPE.Some(TYPE.INT),
					new TYPE.Fail(TYPE.INT),
					new TYPE.Ok(TYPE.INT),
					new TYPE.Fail(TYPE.INT),
					new TYPE.Ok(TYPE.INT),
				],
			);
		});
		test.test('`Boolean.(‹…›)`', () => {
			assertEqualTypes(
				BOOL_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(TYPE.BOOL, BOOL_CONS.length),
			);
		});
		test.test('`Integer.(‹…›)`', () => {
			assertEqualTypes(
				INT_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(TYPE.INT, INT_CONS.length),
			);
		});
		test.test('`Natural.(‹…›)`', () => {
			assertEqualTypes(
				NAT_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(TYPE.NAT, NAT_CONS.length),
			);
		});
		test.test('`Float.(‹…›)`', () => {
			assertEqualTypes(
				FLOAT_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(TYPE.FLOAT, FLOAT_CONS.length),
			);
		});
		test.test('`String.(‹…›)`', () => {
			assertEqualTypes(
				STRING_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(TYPE.STR, STRING_CONS.length),
			);
		});
		test.test('`List.(‹…›)`', () => {
			assertEqualTypes(
				LIST_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(new TYPE.List(TYPE.INT, true), LIST_CONS.length),
			);
		});
		test.test('`Dict.(‹…›)`', () => {
			assertEqualTypes(
				DICT_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(new TYPE.Dict(TYPE.INT, true), DICT_CONS.length),
			);
		});
		test.test('`Set.(‹…›)`', () => {
			assertEqualTypes(
				SET_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(new TYPE.Set(TYPE.INT, true), SET_CONS.length),
			);
		});
		test.test('`Map.(‹…›)`', () => {
			assertEqualTypes(
				MAP_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(new TYPE.Map(TYPE.INT, TYPE.FLOAT, true), MAP_CONS.length),
			);
		});
		test.test('`Exception.(‹…›)`', () => {
			assertEqualTypes(
				EXCEPTION_CONS.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src))),
				repeat(TYPE.EXCP, EXCEPTION_CONS.length),
			);
		});
		test.test('bypasses invariance for generic arguments.', () => {
			extract_lines`
				List.<mut {int}>((   {42},))
				Dict.<mut {int}>((a= {42}))
				Set .<mut {int}>((   {42},))
				Map.<float, mut {int}>(((4.2, {42}),))
				Map.<mut {int}, float>((({42}, 4.2),))
			`.map((src) => VISITOR.visit(AST.EXPR.Call.fromSource(src)));
		});
		test.test('evaluates custom functions.', () => {
			setupScript(`{
				func inc(x: int): int => x + 1;
				inc.(42);
			}`, {build: false});
		});
		test.test('allows compound base.', () => {
			setupScript(`{
				val inc1: \\(int) => int = \\(x: int): int => x + 1;
				val inc2: \\(int) => int = \\(x: int): int => x + 2;
				(inc1 || inc2).(42);
			}`, {build: false});
		});
		test.test('throws if base is not a function type.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				null.()
				(42 || 43).<bool>()
			`, (src) => assert.throws(() => VISITOR.visit(AST.EXPR.Call.fromSource(src)), TypeErrorNotCallable));
		});
		test.test('throws when providing incorrect number (or names) of arguments.', () => {
			const {stmts, visitors} = setupScript(`{
				func inc1(x: int): int => x + 1;
				func inc2($x: int): int => x + 2;
				inc1.();
				inc1.(2, 3);
				inc1.(x= 4);
				inc2.();
				inc2.(5);
				inc2.(y= 6);
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]);
			visitors.typeCheck.visit(stmts[1]);
			xjs.Array.forEachAggregated(stmts.slice(2), (stmt) => assert.throws(() => visitors.typeCheck.visit((stmt as AST.STMT.StatementExpression).expr!), TypeErrorArgCount));
			xjs.Array.forEachAggregated(extract_lines`
				Integer.()
				Integer.(1, 2)
				Natural.()
				Natural.(1, 2)
				Float.()
				Float.(1, 2)
				String.()
				String.(1, 2)
				List.<int>((), ())
				Dict.<int>((), ())
				Set.<int>((), ())
				Map.<int, int>((), ())
				Map.<int>()
				None.<int>(42)
				Some.<int>()
			`, (src) => assert.throws(() => VISITOR.visit(AST.EXPR.Call.fromSource(src)), TypeErrorArgCount));
		});
		test.test('throws when providing incorrect type of arguments.', () => {
			const {stmts, visitors} = setupScript(`{
				func inc1(x: int): int => x + 1;
				func inc2($x: int): int => x + 2;
				inc1.("3");
				inc2.(x= "4");
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]);
			visitors.typeCheck.visit(stmts[1]);
			xjs.Array.forEachAggregated(stmts.slice(2), (stmt) => assert.throws(() => visitors.typeCheck.visit((stmt as AST.STMT.StatementExpression).expr!), TypeErrorNotAssignable));
			// API overload checks
			xjs.Map.forEachAggregated(new Map<string, readonly [string, readonly string[]]>(['Integer', 'Natural', 'Float'].flatMap((basesrc) => ['()', '[]', '{}'].map((argsrc) => (
				[`${basesrc}.(${argsrc})`, [argsrc, ['int', 'nat', 'float']]] as const
			)))), ([argexpr, allowed_types], src) => assert.throws(() => VISITOR.visit(AST.EXPR.Call.fromSource(src)), (thrown) => {
				assertAssignable(thrown as Error, {
					cons:   AggregateError,
					errors: allowed_types.map((allowed_type) => ({
						cons:    TypeErrorNotAssignable,
						message: `Expression \`${argexpr}\` is not assignable to type \`${allowed_type}\`.`,
					})),
				});
				return true;
			}));
			xjs.Map.forEachAggregated(new Map<string, readonly [string, readonly string[]]>([
				['List.<int>(42)',     ['42', ['List.<int>', 'Set.<int>']]],
				['Dict.<int>(42)',     ['42', ['List.<(sym, int)>', 'Dict.<int>', 'Set.<(sym, int)>', 'Map.<sym, int>']]],
				['Set.<int>(42)',      ['42', ['List.<int>', 'Set.<int>']]],
				['Map.<int, int>(42)', ['42', ['List.<(int, int)>', 'Set.<(int, int)>', 'Map.<int, int>']]],
			]), ([argexpr, allowed_types], src) => assert.throws(
				() => VISITOR.visit(AST.EXPR.Call.fromSource(src)),
				(err) => {
					assertAssignable(err as Error, {
						cons:   AggregateError,
						errors: [
							{cons: TypeErrorArgCount, message: 'Got 1 arguments, but expected 0.'},
							...allowed_types.map((allowed_type) => ({
								cons:    TypeErrorNotAssignable,
								message: `Expression \`${argexpr}\` is not assignable to type \`${allowed_type}\`.`,
							})),
						],
					});
					return true;
				},
			));
			// if API overload checks fail, check allowed types not in API
			return xjs.Array.forEachAggregated(extract_lines`
				List.<int>((4.2,))
				Dict.<int>((a= 4.2))
				Set.<int>((42, "42"))
				Map.<int, int>(((42, "42"),))
				Some.<int>(4.2)
			`, (src) => assert.throws(() => VISITOR.visit(AST.EXPR.Call.fromSource(src)), TypeErrorNotAssignable));
		});
		test.test('return type.', () => {
			assertEqualTypes(VISITOR.visit((setupScript(`{
				func inc(x: int): int => x + 1;
				inc.(42);
			}`, {build: false}).stmts[1] as AST.STMT.StatementExpression).expr!), TYPE.INT);
		});
		test.test('void functions have no return type.', () => {
			assert.strictEqual(VISITOR.visit((setupScript(`{
				func inc(x: int): void { return; }
				inc.(42);
			}`, {build: false}).stmts[1] as AST.STMT.StatementExpression).expr!), null);
		});
		test.suite('function overloads.', () => {
			test.test('when multiple overloads match and one is most specific, returns type of that overload.', () => {
				assertEqualTypes(VISITOR.visit((setupScript(`{
					func overload_test(a: (int), b: (int,)): float => 4.2;
					func overload_test(a: (int, int), b: (int, int)): str => "hello";
					overload_test.((1, 2), (3, 4)); % matches both overloads, but 2nd is chosen; returns type \`str\`
				}`, {build: false}).stmts[2] as AST.STMT.StatementExpression).expr!), TYPE.STR);
			});
			test.test('throws when multiple overloads match and none is most specific.', () => {
				const {stmts, visitors} = setupScript(`{
					func overload_test(a: (int,), b: (int, int)): bool => true;
					func overload_test(a: (int, int), b: (int,)): bool => true;
					overload_test.((1, 2), (3, 4)); % TypeErrorAmbiguousOverload: matches both overloads
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				visitors.typeCheck.visit(stmts[1]);
				return assert.throws(() => VISITOR.visit((stmts[2] as AST.STMT.StatementExpression).expr!), TypeErrorAmbiguousOverload);
			});
			test.test('throws when no overloads match.', () => {
				const {stmts, visitors} = setupScript(`{
					func overload_test(a: (int,), b: (int, int)): bool => true;
					func overload_test(a: (int, int), b: (int,)): bool => true;
					overload_test.((a= 1, b= 2), (c= 3, d= 4)); % TypeErrorAmbiguousOverload: matches neither overload
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				visitors.typeCheck.visit(stmts[1]);
				return assert.throws(() => VISITOR.visit((stmts[2] as AST.STMT.StatementExpression).expr!), TypeErrorAmbiguousOverload);
			});
		});
	});


	test.suite('Claim', () => {
		test.test('returns the type value of the claimed type.', () => {
			assert.ok(VISITOR.visit(AST.EXPR.Claim.fromSource('3 as <int | null>'))!.equals(TYPE.INT.union(TYPE.NULL)));
		});
		test.test('allows claiming to a type alias.', () => {
			const claim: AST.EXPR.Claim = AST.EXPR.Claim.fromSource('"Alice" as <Name>');
			const id: bigint = Validator.keyId('Name');
			claim.validator.addSymbol(new SymbolSchemaType(id, claim.claimed_type));
			(claim.validator.getSymbol(id) as SymbolSchemaType).typevalue = TYPE.STR;
			return assert.strictEqual(VISITOR.visit(claim), TYPE.STR);
		});
		test.test('allows claiming to `nothing` even though types are disjoint.', () => {
			assert.ok(VISITOR.visit(AST.EXPR.Claim.fromSource('42 as <nothing>'))!.isBottomType);
		});
		test.test('allows claiming a `nothing` expression even though types are disjoint.', () => {
			const claim: AST.EXPR.Claim = AST.EXPR.Claim.fromSource('n as <int>');
			const id: bigint = Validator.keyId('n');
			claim.validator.addSymbol(new SymbolSchemaVar(id, claim.operand, false, false));
			(claim.validator.getSymbol(id) as SymbolSchemaVar).type = TYPE.NOTHING;
			return assert.strictEqual(VISITOR.visit(claim), TYPE.INT);
		});
		test.test('throws when the operand type and claimed type are disjoint (and neither is `nothing`).', () => {
			xjs.Array.forEachAggregated(extract_lines`
				3       as <str>
				"three" as <int>
				3       as <float>
				3.0     as <int>
			`, (src) => assert.throws(() => VISITOR.visit(AST.EXPR.Claim.fromSource(src)), TypeErrorNotAssignable));
		});
		test.test('allows disjoint types when claiming to top type first.', () => {
			setupScript(`{
				3       as <anything> as <str>;
				"three" as <anything> as <int>;
				3       as <anything> as <float>;
				3.0     as <anything> as <int>;
			}`, {build: false}); // assert does not throw
		});
		test.test('allows disjoint types when forcing.', () => {
			setupScript(`{
				3       as! <str>;
				"three" as! <int>;
				3       as! <float>;
				3.0     as! <int>;
			}`, {build: false}); // assert does not throw
		});
	});


	test.suite('Operation', () => {
		function typeOperations(tests: ReadonlyMap<string, TYPE.Type>): void {
			return assertEqualTypes(
				[...tests.keys()].map((src) => VISITOR.visit(AST.EXPR.Operation.fromSource(src))),
				[...tests.values()],
			);
		}
		function typeOfStmtExpr(stmt: AST.STMT.Statement): TYPE.Type | null {
			assert_instanceof(stmt, AST.STMT.StatementExpression);
			return VISITOR.visit(stmt.expr!);
		}

		test.suite('OperationUnary', () => {
			test.test('returns a constant Boolean type for boolean unary operation of anything.', () => {
				typeOperations(new Map<string, TYPE.Type>([
					['!null',   TYPE.TRUE],
					['!false',  TYPE.TRUE],
					['!true',   TYPE.FALSE],
					['!@hello', TYPE.FALSE],
					['!42',     TYPE.FALSE],
					['!4.2e+1', TYPE.FALSE],
					['?null',   TYPE.TRUE],
					['?false',  TYPE.TRUE],
					['?true',   TYPE.BOOL],
					['?@hello', TYPE.BOOL],
					['?42',     TYPE.BOOL],
					['?4.2e+1', TYPE.BOOL],

					['!()',         TYPE.FALSE],
					['!(42,)',      TYPE.FALSE],
					['!(a= 42)',    TYPE.FALSE],
					['!{}',         TYPE.FALSE],
					['!{42}',       TYPE.FALSE],
					['!{41 -> 42}', TYPE.FALSE],
					['?()',         TYPE.BOOL],
					['?(42,)',      TYPE.BOOL],
					['?(a= 42)',    TYPE.BOOL],
					['?{}',         TYPE.BOOL],
					['?{42}',       TYPE.BOOL],
					['?{41 -> 42}', TYPE.BOOL],
				]));
			});
			test.suite('[operator=NOT]', () => {
				test.test('returns type `true` for a subtype of `null | false`.', () => {
					xjs.Array.forEachAggregated(setupScript(`{
						val mut a: null = null;
						val mut b: null | false = null;
						!a;
						!b;
					}`, {build: false}).stmts.slice(2), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.TRUE));
				});
				test.test('returns type `bool` for a supertype of `T narrows null | false`.', () => {
					xjs.Array.forEachAggregated(setupScript(`{
						val mut a: null | int = null;
						val mut b: null | int = 42;
						val mut c: bool = false;
						val mut d: bool | float = 4.2;
						!a;
						!b;
						!c;
						!d;
					}`, {build: false}).stmts.slice(4), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.BOOL));
				});
				test.test('returns type `false` for any literal type not a supertype of `null` or `false`.', () => {
					xjs.Array.forEachAggregated(setupScript(`{
						val mut a: int = 42;
						val mut b: float = 4.2;
						val mut c: sym = @hello;
						!a;
						!b;
						!c;
					}`, {build: false}).stmts.slice(3), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.FALSE));
				});
				test.test('returns type `false` for any literal collection type not a supertype of `null` or `false`.', () => {
					xjs.Array.forEachAggregated(setupScript(`{
						!();
						!(42,);
						!(a= 42);
						!{41 -> 42};
					}`, {build: false}).stmts, (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.FALSE));
				});
			});
			test.suite('[operator=EMP]', () => {
				test.test('returns type `true` for a subtype of `null | false`.', () => {
					xjs.Array.forEachAggregated(setupScript(`{
						val mut a: null = null;
						val mut b: null | false = null;
						?a;
						?b;
					}`, {build: false}).stmts.slice(2), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.TRUE));
				});
			});
			test.test('[operator=NEG] throws for `nat` type.', () => {
				const {stmts, visitors} = setupScript(`{
					val mut n: nat = +42;
					-n;
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]); // assert does not throw
				assert.throws(() => VISITOR.visit((stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.OperationUnary), TypeErrorInvalidOperation);
			});
			test.test('[operator=UN_MAYBE]', () => {
				assertEqualTypes(setupScript(`{
					val mut x?: int;
					val mut y?: nat;
					val mut z?: float;
					set y = +42;
					set z = 4.2;
					delete y;
					x;
					y;
					z;
					x~?;
					y~?;
					z~?;
				}`, {build: false}).stmts.slice(6).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)), [
					new TYPE.Maybe(TYPE.INT),
					new TYPE.Maybe(TYPE.NAT),
					new TYPE.Maybe(TYPE.FLOAT),
					TYPE.INT,
					TYPE.NAT,
					TYPE.FLOAT,
				]);
			});
			test.test('[operator=UN_RESULT]', () => {
				assertEqualTypes(setupScript(`{
					val x: int! = Fail.<int>(Exception.("42"));
					val y: Result.<nat> = Ok.<nat>(+42);
					val z: Result.<float, Exception> = Ok.<float>(4.2);
					x;
					y;
					z;
					x~!;
					y~!;
					z~!;
				}`, {build: false}).stmts.slice(3).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)), [
					new TYPE.Result(TYPE.INT),
					new TYPE.Result(TYPE.NAT),
					new TYPE.Result(TYPE.FLOAT, TYPE.EXCP),
					TYPE.INT,
					TYPE.NAT,
					TYPE.FLOAT,
				]);
			});
			test.suite('[operator=EMP]', () => {
				test.test('without constant folding: returns type `bool` for anything else.', () => {
					assert_shallowStrictEqual(
						setupScript(`{
							val mut a: null | int   = null;
							val mut b: null | int   = 42;
							val mut c: bool         = false;
							val mut d: bool | float = 4.2;
							val mut f: int          = 42;
							val mut g: float        = 4.2e+1;
							val mut h: sym          = @hello;
							val mut i: anything     = ();
							val mut j: anything     = (42,);
							val mut k: anything     = (a= 42);
							val mut l: anything     = {41 -> 42};
							?a;
							?b;
							?c;
							?d;
							?f;
							?g;
							?h;
							?i;
							?j;
							?k;
							?l;
						}`, {build: false}).stmts.slice(11).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						repeat(TYPE.BOOL, 11),
					);
				});
			});
		});

		test.suite('OperationBinaryCast', () => {
			test.test('returns `nothing` if either operand is `nothing`.', () => {
				assertEqualTypes(
					setupScript(`{
						val x: nothing = 42 as <nothing>;
						val y: nothing = "hello" as <nothing>;
						x as Exception;
						Exception.("") as y;
					}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)),
					repeat(TYPE.NOTHING, 2),
				);
			});
			test.test('throws if right-hand operand is not an instance of `Class`.', () => {
				const {stmts} = setupScript(`{
					Exception.("hello") as (message= "hello");
				}`, {typeCheck: false});
				return assert.throws(() => typeOfStmtExpr(stmts[0]), TypeErrorInvalidOperation);
			});
			test.test('[operator=IS] always returns `bool`.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val n: null = null;
						${CORE_LIB_NAMES.map((t) => `n is ${t};`).join('\n')}
					}`, {build: false}).stmts.slice(1).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					repeat(TYPE.BOOL, 21),
				);
			});
			test.suite('[operator=CAST]', () => {
				test.test('returns the referenced type.', () => {
					assertEqualTypes(
						setupScript(`{
							val n: anything = null;
							${CORE_LIB_NAMES.map((t) => `n as ${t};`).join('\n')}
						}`, {build: false}).stmts.slice(1).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						[
							TYPE.NULL,
							TYPE.BOOL,
							TYPE.SYM,
							TYPE.INT,
							TYPE.NAT,
							TYPE.FLOAT,
							TYPE.STR,
							TYPE.OBJ,
							new TYPE.List(TYPE.ANYTHING),
							new TYPE.Dict(TYPE.ANYTHING),
							new TYPE.Set(TYPE.ANYTHING),
							new TYPE.Map(TYPE.ANYTHING, TYPE.ANYTHING),
							TYPE.EXCP,
							new TYPE.Maybe(TYPE.ANYTHING),
							new TYPE.None(TYPE.ANYTHING),
							new TYPE.Some(TYPE.ANYTHING),
							new TYPE.Result(TYPE.ANYTHING),
							new TYPE.Fail(TYPE.ANYTHING),
							new TYPE.Ok(TYPE.ANYTHING),
							TYPE.FUNCTION,
							TYPE.CLASS,
						],
					);
				});
				test.test('throws when the assigned type is not equal or narrower.', () => {
					const {stmts, visitors} = setupScript(`{
						val n: int = 42;
						n as Float;
					}`, {typeCheck: false});
					visitors.typeCheck.visit(stmts[0]);
					return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorNotNarrow);
				});
				test.test('returns the uncast type if a referenced type cannot be found.', () => {
					assertEqualTypes(
						setupScript(`{
							val a: anything          = null;
							val b: int | nat | float = 42;
							val c: sym               = @hello;
							a as (Symbol || String);
							b as (Integer || Float);
							c as (Function && Class);
						}`, {build: false}).stmts.slice(3).map((stmt) => typeOfStmtExpr(stmt)),
						[
							TYPE.ANYTHING,
							TYPE.NUMBER,
							TYPE.SYM,
						],
					);
				});
			});
			test.suite('[operator=MAYBE]', () => {
				test.test('returns the referenced type, wrapped in a Maybe.', () => {
					assertEqualTypes(
						setupScript(`{
							val n: anything = null;
							${CORE_LIB_NAMES.map((t) => `n as? ${t};`).join('\n')}
						}`, {build: false}).stmts.slice(1).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						[
							new TYPE.Maybe(TYPE.NULL),
							new TYPE.Maybe(TYPE.BOOL),
							new TYPE.Maybe(TYPE.SYM),
							new TYPE.Maybe(TYPE.INT),
							new TYPE.Maybe(TYPE.NAT),
							new TYPE.Maybe(TYPE.FLOAT),
							new TYPE.Maybe(TYPE.STR),
							new TYPE.Maybe(TYPE.OBJ),
							new TYPE.Maybe(new TYPE.List(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Dict(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Set(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Map(TYPE.ANYTHING, TYPE.ANYTHING)),
							new TYPE.Maybe(TYPE.EXCP),
							new TYPE.Maybe(new TYPE.Maybe(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.None(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Some(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Result(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Fail(TYPE.ANYTHING)),
							new TYPE.Maybe(new TYPE.Ok(TYPE.ANYTHING)),
							new TYPE.Maybe(TYPE.FUNCTION),
							new TYPE.Maybe(TYPE.CLASS),
						],
					);
				});
				test.test('throws when the assigned type is not equal or narrower.', () => {
					const {stmts, visitors} = setupScript(`{
						val n: int = 42;
						n as? Float;
					}`, {typeCheck: false});
					visitors.typeCheck.visit(stmts[0]);
					return assert.throws(() => visitors.typeCheck.visit(stmts[1]), TypeErrorNotNarrow);
				});
				test.test('returns the uncast type, wrapped in Maybe, if a referenced type cannot be found.', () => {
					assertEqualTypes(
						setupScript(`{
							val a: anything          = null;
							val b: int | nat | float = 42;
							val c: sym               = @hello;
							a as? (Symbol || String);
							b as? (Integer || Float);
							c as? (Function && Class);
						}`, {build: false}).stmts.slice(3).map((stmt) => typeOfStmtExpr(stmt)),
						[
							new TYPE.Maybe(TYPE.ANYTHING),
							new TYPE.Maybe(TYPE.NUMBER),
							new TYPE.Maybe(TYPE.SYM),
						],
					);
				});
			});
		});

		test.suite('OperationBinaryArithmetic', () => {
			test.test('returns the respective type.', () => {
				typeOperations(new Map<string, TYPE.Type>([
					['7 * 3 * 2',       TYPE.INT],
					['+7 * +3 * +2',    TYPE.NAT],
					['7.1 * 3.1 * 2.1', TYPE.FLOAT],
				]));
			});
			test.test('returns Integer/Natural/Float respectively for valid ops.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val mut i1: int   = 7;
						val mut i2: int   = 3;
						val mut i3: int   = 2;
						val mut n1: nat   = +7;
						val mut n2: nat   = +3;
						val mut n3: nat   = +2;
						val mut f1: float = 7.1;
						val mut f2: float = 3.1;
						val mut f3: float = 2.1;

						(i1 + i2) * i3;
						(n1 + n2) * n3;
						f1 * f2 ^ f3;
					}`, {build: false}).stmts.slice(9).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					[TYPE.INT, TYPE.NAT, TYPE.FLOAT],
				);
			});
			test.test('throws for any operation of mix of numeric types.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					+3 * 2
					+3 * 2.7
					3 * 2.7
					7 * 3.0 * 2
				`, (src) => {
					const op = AST.EXPR.OperationBinaryArithmetic.fromSource(src);
					return assert.throws(() => VISITOR.visit(op), TypeErrorInvalidOperation);
				});
			});
			test.test('throws for arithmetic operation of non-numbers.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					null + 5
					5 * null
					false - 2
					2 / true
					null ^ false
					"hello" + 5
				`, (src) => {
					const op = AST.EXPR.OperationBinaryArithmetic.fromSource(src);
					return assert.throws(() => VISITOR.visit(op), TypeErrorInvalidOperation);
				});
			});
		});

		test.suite('OperationBinaryComparative', () => {
			test.test('returns `bool` for numeric operands.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val mut i1: int   = 7;
						val mut i2: int   = 3;
						val mut n1: nat   = +7;
						val mut n2: nat   = +3;
						val mut f1: float = 7.1;
						val mut f2: float = 3.1;

						${['i1', 'n1', 'f1'].flatMap((left) => ['i2', 'n2', 'f2'].flatMap((right) => ['<', '>', '<=', '>=', '!<', '!>'].map((op) => `${left} ${op} ${right};`))).join('\n')}
					}`).stmts.slice(6).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					repeat(TYPE.BOOL, 3 * 3 * 6),
				);
			});
			test.test('throws for comparative operation of non-numbers.', () => {
				assert.throws(() => VISITOR.visit(AST.EXPR.OperationBinaryComparative.fromSource('7.0 <= null')), TypeErrorInvalidOperation);
			});
		});

		test.suite('OperationBinaryEquality', () => {
			test.test('returns `false` for operands of the same primitive unit type, even numeric, but have different values.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					@symb1  === @symb2
					"hello" === "world"
					@symb1  ==  @symb2
					"hello" ==  "world"
				`, (expr) => assert.strictEqual(VISITOR.visit(AST.EXPR.Operation.fromSource(expr)), TYPE.FALSE));
			});
			test.test('returns `bool` for operands of same numeric type.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						val mut i1: int   = 7;
						val mut i2: int   = 3;
						val mut n1: nat   = +7;
						val mut n2: nat   = +3;
						val mut f1: float = 7.1;
						val mut f2: float = 3.1;

						i1 === i2;
						n1 === n2;
						f1 === f2;
						i1 == i2;
						n1 == n2;
						f1 == f2;
					}`).stmts.slice(6).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					repeat(TYPE.BOOL, 6),
				);
				test.test('for numeric literals, returns `false` for different values.', () => {
					typeOperations(new Map<string, TYPE.Type>([
						['0   === -0',   TYPE.BOOL],
						['0.0 === -0.0', TYPE.FALSE],
						['0   === 0.0',  TYPE.FALSE],
						['0   === -0.0', TYPE.FALSE],
						['-0  === 0.0',  TYPE.FALSE],
						['-0  === -0.0', TYPE.FALSE],
						['3   === 3.0',  TYPE.FALSE],

						['0   == -0',   TYPE.BOOL],
						['0.0 == -0.0', TYPE.BOOL],
						['0   == 0.0',  TYPE.BOOL],
						['0   == -0.0', TYPE.BOOL],
						['-0  == 0.0',  TYPE.BOOL],
						['-0  == -0.0', TYPE.BOOL],
						['3   == 3.0',  TYPE.BOOL],
					]));
				});
				test.test('returns type `bool` for anything/object types.', () => {
					setupScript(`{
						val a: anything = ();
						val b: anything = (42,);
						val c: anything = (x= 42);
						val d: Object   = {41 -> 42};
						a !== ();
						b !== (42,);
						c !== (x= 42);
						d !== {41 -> 42};
						a === a;
						b === b;
						c === c;
						d === d;
						a == ();
						b == (42,);
						c == (x= 42);
						d == {41 -> 42};
						b != (42, 43);
						c != (x= 43);
						c != (y= 42);
						d != {41 -> 43};
						d != {43 -> 42};
					}`, {build: false}).stmts.slice(4).forEach((stmt) => assert.strictEqual(
						VISITOR.visit((stmt as AST.STMT.StatementExpression).expr as AST.EXPR.OperationBinaryEquality),
						TYPE.BOOL,
					));
				});
			});
			test.test('returns `false` if operands are of disjoint types in general.', () => {
				assert.strictEqual(VISITOR.visit(AST.EXPR.Operation.fromSource('7      == null')), TYPE.FALSE);
				assert.strictEqual(VISITOR.visit(AST.EXPR.Operation.fromSource('@symb1 == 256')),  TYPE.FALSE);
			});
			test.suite('[operator=ID]', () => {
				test.test('without constant folding: returns `false` for operands of different numeric types.', () => {
					assert_shallowStrictEqual(
						setupScript(`{
							val mut i1: int   = 7;
							val mut n1: nat   = +7;
							val mut f1: float = 7.1;

							i1 === n1;
							i1 === f1;
							n1 === f1;
						}`).stmts.slice(3).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						repeat(TYPE.FALSE, 3),
					);
				});
			});
			test.suite('[operator=EQ]', () => {
				test.test('without constant folding: coerces numeric types when mixed, returns `bool`.', () => {
					assert_shallowStrictEqual(
						setupScript(`{
							val mut i1: int   = 7;
							val mut n1: nat   = +7;
							val mut f1: float = 7.1;

							i1 == n1;
							i1 == f1;
							n1 == f1;
						}`).stmts.slice(3).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
						repeat(TYPE.BOOL, 3),
					);
				});
			});
		});

		test.suite('OperationBinaryLogical', () => {
			test.test('constant literals.', () => {
				typeOperations(new Map<string, TYPE.Type>([
					['null  && false',    TYPE.NULL],
					['false && null',     TYPE.FALSE],
					['true  && null',     TYPE.NULL],
					['@x    && @y',       typeUnit('y', 'sym')],
					['@x    || @y',       typeUnit('x', 'sym')],
					['@z    && false',    TYPE.FALSE],
					['true  && @z',       typeUnit('z', 'sym')],
					['false && 42',       TYPE.FALSE],
					['4.2   && true',     TYPE.TRUE],
					['null  || false',    TYPE.FALSE],
					['false || null',     TYPE.NULL],
					['true  || null',     TYPE.TRUE],
					['false || 42',       typeUnit(42n)],
					['4.2   || true',     typeUnit(4.2)],
				]));
			});
			test.test('throws when left operand is void.', () => {
				const {stmts, visitors} = setupScript(`{
					func f(): void { return; }
					f.() && true;
					f.() || true;
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				return xjs.Array.forEachAggregated(
					stmts.slice(1).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!),
					(expr) => assert.throws(() => VISITOR.visit(expr), TypeErrorInvalidOperation),
				);
			});
			test.test('returns no type when right operand is void.', () => {
				const {stmts, visitors} = setupScript(`{
					func f(): void { return; }
					true && f.();
					true || f.();
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				return assertEqualTypes(
					stmts.slice(1).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					repeat(null, 2),
				);
			});
			test.suite('[operator=AND]', () => {
				test.test('returns `left` if it’s a subtype of `null | false`.', () => {
					assertEqualTypes(setupScript(`{
						val mut a: null = null;
						val mut b: null | false = null;
						a && 42;
						b && 42;
					}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
						TYPE.NULL,
						TYPE.NULL.union(TYPE.FALSE),
					]);
				});
				test.test('returns `T | right` if left is a supertype of `T narrows null | false`.', () => {
					const hello: TYPE.Unit<VALUE.String> = typeUnit('hello');
					return assertEqualTypes(setupScript(`{
						val mut a: null | int = null;
						val mut b: null | int = 42;
						val mut c: bool = false;
						val mut d: bool | float = 4.2;
						a && "hello";
						b && "hello";
						c && "hello";
						d && "hello";
					}`, {build: false}).stmts.slice(4).map((stmt) => typeOfStmtExpr(stmt)), [
						TYPE.NULL.union(hello),
						TYPE.NULL.union(hello),
						TYPE.FALSE.union(hello),
						TYPE.FALSE.union(hello),
					]);
				});
				test.test('returns `right` if left does not contain `null` nor `false`.', () => {
					assertEqualTypes(setupScript(`{
						val mut a: int = 42;
						val mut b: float = 4.2;
						a && true;
						b && null;
					}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
						TYPE.TRUE,
						TYPE.NULL,
					]);
				});
			});
			test.suite('[operator=OR]', () => {
				test.test('returns `right` if left is a subtype of `null | false`.', () => {
					assertEqualTypes(setupScript(`{
						val mut a: null = null;
						val mut b: null | false = null;
						a || false;
						b || 42;
					}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
						TYPE.FALSE,
						typeUnit(42n),
					]);
				});
				test.test('returns `(left - T) | right` if left is a supertype of `T narrows null | false`.', () => {
					const hello: TYPE.Unit<VALUE.String> = typeUnit('hello');
					assertEqualTypes(setupScript(`{
						val mut a: null | int = null;
						val mut b: null | int = 42;
						val mut c: bool = false;
						val mut d: bool | float = 4.2;
						a || "hello";
						b || "hello";
						c || "hello";
						d || "hello";
					}`, {build: false}).stmts.slice(4).map((stmt) => typeOfStmtExpr(stmt)), [
						TYPE.INT.union(hello),
						TYPE.INT.union(hello),
						TYPE.TRUE.union(hello),
						TYPE.TRUE.union(TYPE.FLOAT).union(hello),
					]);
				});
				test.test('returns `left` if it does not contain `null` nor `false`.', () => {
					assertEqualTypes(setupScript(`{
						val mut a: int = 42;
						val mut b: float = 4.2;
						a || true;
						b || null;
					}`, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
						TYPE.INT,
						TYPE.FLOAT,
					]);
				});
			});
		});

		test.suite('OperationTernary', () => {
			test.test('computes type for for conditionals.', () => {
				typeOperations(new Map<string, TYPE.Type>([
					['if true then false else 2',          TYPE.FALSE],
					['if false then 3.0 else null',        TYPE.NULL],
					['if true then 2 else 3.0',            new TYPE.Unit(new VALUE.Integer(2n))],
					['if false then 2 + 3 else 1.0 * 2.0', TYPE.FLOAT],
				]));
			});
			test.test('returns `nothing` when condition is `nothing`.', () => {
				const ternary: AST.EXPR.OperationTernary = AST.EXPR.OperationTernary.fromSource('if n as <nothing> then true else false');
				ternary.validator.addSymbol(new SymbolSchemaVar(Validator.keyId('n'), (ternary.operand0 as AST.EXPR.Claim).operand, false, false));
				return assert.ok(VISITOR.visit(ternary)!.isBottomType);
			});
			test.test('returns no type when consequent/alternative is void.', () => {
				const {stmts, visitors} = setupScript(`{
					func f(): void { return; }
					func g(): void { return; }
					if true then f.() else 4.3;
					if true then 42 else g.();
					if true then f.() else g.();
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				visitors.typeCheck.visit(stmts[1]);
				return assertEqualTypes(
					stmts.slice(2).map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
					repeat(null, 3),
				);
			});
			test.test('throws when condition is void.', () => {
				const {stmts, visitors} = setupScript(`{
					func f(): void { return; }
					if f.() then 42 else 4.3;
				}`, {typeCheck: false});
				visitors.typeCheck.visit(stmts[0]);
				return assert.throws(() => VISITOR.visit((stmts[1] as AST.STMT.StatementExpression).expr!), TypeErrorInvalidOperation);
			});
			test.test('throws when condition is not a subtype of `boolean`.', () => {
				assert.throws(() => VISITOR.visit(AST.EXPR.OperationTernary.fromSource('if 2 then true else false')), TypeErrorInvalidOperation);
			});
		});
	});


	test.suite('Switch', () => {
		test.test('returns `nothing` if the compared value is type `nothing`.', () => {
			assert_shallowStrictEqual(
				setupScript(`{
					switch 42 default true;
					switch 42 as <nothing> default 43;
				}`, {build: false}).stmts.map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
				[
					TYPE.TRUE,
					TYPE.NOTHING,
				],
			);
		});
		test.test('returns no type if any consequent is void.', () => {
			const {stmts, visitors} = setupScript(`{
				func f(): void { return; }
				switch 42
					case 1.1 -> f.()
					default true;
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]);
			return assertEqualTypes(VISITOR.visit((stmts[1] as AST.STMT.StatementExpression).expr!), null);
		});
		test.test('returns the union of all cases’ consequents and the default.', () => {
			assertEqualTypes(
				setupScript(`{
					switch 42 default 4.3;
					switch 42
						case 1.1 -> 10
						case 2.2 -> 20
						default 43;
				}`, {build: false}).stmts.map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)),
				[
					typeUnit(4.3),
					TYPE.Union.all(typeUnit(10n), typeUnit(20n), typeUnit(43n)),
				],
			);
		});
		test.test('throws if the compared value is void.', () => {
			const {stmts, visitors} = setupScript(`{
				func f(): void { return; }
				switch f.() default true;
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]);
			return assert.throws(() => VISITOR.visit((stmts[1] as AST.STMT.StatementExpression).expr!), TypeErrorInvalidOperation);
		});
		test.test('throws if at least one antecedent is void.', () => {
			const {stmts, visitors} = setupScript(`{
				func f(): void { return; }
				switch 42
					case 1.1  | 2.2 -> 15
					case f.() | 4.4 -> 25
					default 43;
			}`, {typeCheck: false});
			visitors.typeCheck.visit(stmts[0]);
			return assert.throws(() => VISITOR.visit((stmts[1] as AST.STMT.StatementExpression).expr!), /is not a value/);
		});
		test.test('throws when at least one antecedent is an error.', () => {
			const {stmts, visitors} = setupScript(`{
				switch 42
					case 1.1       | 2.2 -> 15
					case 33 / 10.0 | 4.4 -> 25
					default 43;
			}`, {typeCheck: false});
			return assert.throws(() => visitors.typeCheck.visit((stmts[0] as AST.STMT.StatementExpression).expr!), TypeErrorInvalidOperation);
		});
	});


	test.suite('ExpressionFunction', () => {
		test.test('returns a function type.', () => {
			const {stmts} = setupScript(`{
				\\(a: int, mut b: float | null, mut $c: bool, delta= d: nat): void { return; };
				% TODO: test optional parameters (steal from 'test/validator/Type.test.ts')
				\\(): int | float => 4.2;
			}`, {build: false});
			return assertEqualTypes(stmts.map((stmt) => VISITOR.visit((stmt as AST.STMT.StatementExpression).expr!)), [
				new TYPE.Function(TYPE.Tuple.fromTypes([
					TYPE.INT,
					TYPE.FLOAT.union(TYPE.NULL),
				]), TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[Validator.keyId('c'),     TYPE.BOOL],
					[Validator.keyId('delta'), TYPE.NAT],
				]))),
				new TYPE.Function(undefined, undefined, TYPE.INT.union(TYPE.FLOAT)),
			]);
		});
	});
});
