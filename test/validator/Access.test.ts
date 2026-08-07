import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	Validator,
	AST,
	TYPE,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
} from '../../src/index.ts';
import {
	extract_lines,
	repeat,
	assertEqualTypes,
	op_maybe_string,
	typeUnit,
	setupScript,
} from '../utils.ts';



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
		const {goal} = setupScript(source, {typeCheck: false});
		try {
			goal.typeCheck();
		} catch {
			// if type-checking fails, proceed to `assert.throws` below
		}
		const statements: readonly AST.STMT.StatementExpression[] = goal.block!.children.filter((stmt) => stmt instanceof AST.STMT.StatementExpression);
		return expecteds.some((it) => it instanceof Function)
			? (assert.strictEqual(statements.length, expecteds.length, 'Arrays are not the same length.'), xjs.Array.forEachAggregated(statements, (stmt, i) => {
				const expected: TYPE.Type | ConstructorType<Error> = expecteds[i];
				return expected instanceof Function
					? assert.throws(() => stmt.expr!.type(), expected)
					: assertEqualTypes(stmt.expr!.type(), expected);
			}))
			: assertEqualTypes(
				statements.map((stmt) => stmt.expr!.type()),
				expecteds as TYPE.Type[],
			);
	}


	test.test.todo('access kind: result access (`a!.‹b›`) is unsupported.', () => { // TODO: Maybe & Result types (#100)
		assert.throws(() => AST.EXPR.Access.fromSource('(42,)!.0;'), TypeError);
	});



	test.suite('#type', () => {
		test.suite('when base is null.', () => {
			test.test('normal access throws.', () => {
				testExprTypes(`{
					null.3;
					null.four;
					null.[((((),),),)];
					null?.3;
					null?.four;
					null?.[((((),),),)];
				}`, repeat([
					...repeat(TypeErrorNoEntry, 2),
					TypeErrorInvalidOperation,
				], 2).flat());
			});
			test.test('chained maybe access.', () => {
				const prop1: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL]);       // (bool,)
				const prop2 = new TYPE.Tuple([{type: TYPE.BOOL, optional: true}]); // (?: bool)
				return testExprTypes(`{
					val mut bound1: (prop?: (bool,)) = (prop= (true,));
					val mut bound2: (prop?: (?: bool)) = (prop= ());
					bound1;
					bound1?.prop;
					bound1?.prop?.0;
					bound2;
					bound2?.prop;
					bound2?.prop?.0;
				}`, [
					new TYPE.Record(new Map([[0x100n, {type: prop1, optional: true}]])), // (prop?: (bool,))
					new TYPE.Maybe(prop1),                                               // Maybe[(bool,)]
					new TYPE.Maybe(TYPE.BOOL),                                           // Maybe[bool]
					new TYPE.Record(new Map([[0x100n, {type: prop2, optional: true}]])), // (prop?: (?: bool))
					new TYPE.Maybe(prop2),                                               // Maybe[(?: bool)]
					new TYPE.Maybe(new TYPE.Maybe(TYPE.BOOL)),                           // Maybe[Maybe[bool]]
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

						tup_a.2;
						tup_b.2;

						rec_a.y;
						rec_b.y;


						val     tupo1_f: (int, float, ?: str) = (1, 2.0, "three");
						val mut tupo1_u: (int, float, ?: str) = (1, 2.0, "three");
						val mut tupo2_u: (int, float, ?: str) = (1, 2.0);

						val     reco1_f: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
						val mut reco1_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
						val mut reco2_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0);

						tupo1_f?.2; % type \`Maybe[str]\`
						tupo1_u?.2; % type \`Maybe[str]\`
						tupo2_u?.2; % type \`Maybe[str]\`

						reco1_f?.b; % type \`Maybe[str]\`
						reco1_u?.b; % type \`Maybe[str]\`
						reco2_u?.b; % type \`Maybe[str]\`
					}`, [
						...repeat(TypeErrorInvalidOperation, 4),
						...repeat(new TYPE.Maybe(TYPE.STR), 6),
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
				test.test('base is an explicit Maybe.', {expectFailure: true}, () => {
					testExprTypes(`{
						val mut tup_a: Maybe[(int, int, ?: int)] = None[(int, int, ?: int)]();
						val mut tup_b: Maybe[(int, int, ?: int)] = None[(int, int, ?: int)]();
						set tup_a = Some[(int, int, ?: int)]((10, 20));

						val mut rec_a?: Maybe[(x: int, y?: int, z: int)] = None[(x: int, y?: int, z: int)]();
						val mut rec_b?: Maybe[(x: int, y?: int, z: int)] = None[(x: int, y?: int, z: int)]();
						set rec_a = Some[(x: int, y?: int, z: int)]((x= 10, z= 20));

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
					}`, repeat(TypeErrorNoEntry, 16));
				});
				test.test('throws when index is out of bounds / when key is out of range.', () => {
					testExprTypes(`{
						(1, 2.0, "three").3;
						(1, 2.0, "three").-4;
						(a= 1, b= 2.0, c= "three").d;
						(1, 2.0, "three")?.3;
						(1, 2.0, "three")?.-4;
						(a= 1, b= 2.0, c= "three")?.d;
					}`, repeat(TypeErrorNoEntry, 6));
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
				const A: TYPE.Record = TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('a'), TYPE.STR]]));
				const B: TYPE.Record = TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('b'), TYPE.STR]]));
				const C: TYPE.Record = TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('c'), TYPE.STR]]));
				const D: TYPE.Record = TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('d'), TYPE.STR]]));
				test.test('every constituent has the entry and it’s required in some constituent.', () => {
					testExprTypes(`{
						${ DECLS }
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
						${ DECLS }
						rec.z;  % optional & optional
						rec?.z; % optional & optional % type \`Maybe[B & D]\`
					}`, [
						TypeErrorInvalidOperation,
						new TYPE.Maybe(B.intersect(D)),
					]);
				});
				test.test('some constituent does not have the entry.', () => {
					testExprTypes(`{
						${ DECLS }
						tup.2;  % required & missing % type \`int\`
						tup.3;  % missing  & missing
						rec.y;  % optional & missing
						tup?.2; % required & missing
						tup?.3; % missing  & missing
						rec?.y; % optional & missing % type \`Maybe[int]\`
					}`, [
						TYPE.INT,
						AggregateError,
						TypeErrorInvalidOperation,
						TypeErrorInvalidOperation,
						AggregateError,
						new TYPE.Maybe(TYPE.INT),
					]);
				});
				test.test('an intersection with union constituents.', () => {
					testExprTypes(`{
						val mut collectionA: ((alpha: bool, bravo: 1) | (bravo: 2 | 3 | 4)) & (bravo: 3 | 4 | 5) = (bravo= 3);
						val mut collectionB: ((alpha: bool, bravo?: 1) | (bravo?: 2 | 3 | 4)) & (bravo?: 3 | 4 | 5) = (alpha= true);
						collectionA.bravo;  % type \`3 | 4\`
						collectionB?.bravo; % type \`Maybe[3 | 4]\`
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
						${ DECLS }
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
						${ DECLS }
						tup.1;  % required | optional
						rec.c;  % optional | optional
						tup?.1; % required | optional % type \`Maybe[bool | float]\`
						rec?.c; % optional | optional % type \`Maybe[sym  | str]\`
					}`, [
						...repeat(TypeErrorInvalidOperation, 2),
						new TYPE.Maybe(TYPE.Union.all(TYPE.BOOL, TYPE.FLOAT)),
						new TYPE.Maybe(TYPE.Union.all(TYPE.SYM,  TYPE.STR)),
					]);
				});
				test.test('some constituent does not have the entry.', () => {
					testExprTypes(`{
						${ DECLS }
						tup.2;  % required | missing
						rec.b;  % optional | missing
						tup?.2; % required | missing
						rec?.b; % optional | missing
					}`, repeat(TypeErrorNoEntry, 4));
				});
				test.test('a union with intersection constituents.', () => {
					testExprTypes(`{
						val mut collectionA: (alpha: bool, bravo: 2 | 3 | 4) & (bravo: 3 | 4 | 5, charlie: str) | (bravo: 6) = (bravo= 6);
						val mut collectionB: (alpha: bool, bravo?: 2 | 3 | 4) & (bravo?: 3 | 4 | 5, charlie: str) | (bravo?: 6) = (bravo= 6);
						collectionA.bravo;  % type \`3 | 4 | 6\`
						collectionB?.bravo; % type \`Maybe[3 | 4 | 6]\`
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
					${ DECLS }

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
				assert.throws(() => AST.EXPR.Access.fromSource('[a= 10, b= 20, c= 30].["a"]').type(), /String keys for dict access are not yet supported\./);
			});
			test.test('throws when base object is of incorrect type.', () => {
				testExprTypes(`{
					(4).[2];
					(10, 20, 30).[1];
					(a= 10, b= 20, c= 30).[@b];

					(4)?.[2];
					(10, 20, 30)?.[1];
					(a= 10, b= 20, c= 30)?.[@b];
					Set.<int>((10, 20, 30))?.[20];
					{10, 20, 30}?.[20];
				}`, repeat(TypeErrorInvalidOperation, 8));
				return testExprTypes(`{
					val     set_fixed:   Set.<int | float | str> = {1, 2.0, "three"};
					val mut set_unfixed: Set.<int | float | str> = set_fixed;

					set_fixed?.[1];
					set_fixed?.[2.0];
					set_fixed?.["three"];
					set_fixed?.[42.0];

					set_unfixed?.[1];
					set_unfixed?.[2.0];
					set_unfixed?.["three"];
					set_unfixed?.[42.0];
				}`, repeat(TypeErrorInvalidOperation, 8));
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
					${ DECLS }

					list_fixed.[3];    % type \`int | float | str\`
					list_fixed.[-4];   % type \`int | float | str\`
					dict_fixed.[@d];   % type \`int | float | str\`

					list_unfixed.[3];  % type \`int | float | str\`
					list_unfixed.[-4]; % type \`int | float | str\`
					dict_unfixed.[@d]; % type \`int | float | str\`

					list_fixed?.[3];  % type \`int | float | str | null\`
					list_fixed?.[-4]; % type \`int | float | str | null\`
					dict_fixed?.[@d]; % type \`int | float | str | null\`

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
					${ DECLS }
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



	test.suite('#build', () => {
		test.suite('access kind: normal access (`a.‹b›`).', () => {
			test.test('tuple access returns an OP.TupleGet.', () => {
				assert.strictEqual(setupScript(`{
					(41 + 1, 42 / 2, 43 - 3).1;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <tuple> $3 (TUPLE.NEW (GET $0) (GET $1) (GET $2)))
						(DROP (TUPLE.GET 1 (GET $3)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('record access returns an OP.RecordGet.', () => {
				assert.strictEqual(setupScript(`{
					(a= 41 + 1, b= 42 / 2, c= 43 - 3).b;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <record> $3 (RECORD.NEW @a->(GET $0) @b->(GET $1) @c->(GET $2)))
						(DROP (RECORD.GET @b (GET $3)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('List access returns an OP.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					[41 + 1, 42 / 2, 43 - 3].[1];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <List> $3 (LIST.NEW (GET $0) (GET $1) (GET $2)))
						(DROP (LIST.GET (GET $3) (INT.CONST 1)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('Dict access returns an OP.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					[a= 41 + 1, b= 42 / 2, c= 43 - 3].[@b];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <Dict> $3 (DICT.NEW @a->(GET $0) @b->(GET $1) @c->(GET $2)))
						(DROP (DICT.GET (GET $3) (SYM.CONST @b)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('Set access returns an OP.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					{41 + 1, 42 / 2, 43 - 3}.[21];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <Set> $3 (SET.NEW (GET $0) (GET $1) (GET $2)))
						(DROP (SET.GET (GET $3) (INT.CONST 21)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('Map access returns an OP.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					{21 -> 41 + 1, 22 -> 42 / 2, 23 -> 43 - 3}.[22];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
						(DECL <Map> $3 (MAP.NEW (INT.CONST 21)->(GET $0) (INT.CONST 22)->(GET $1) (INT.CONST 23)->(GET $2)))
						(DROP (MAP.GET (GET $3) (INT.CONST 22)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('nested access.', () => {
				assert.strictEqual(setupScript(`{
					[("hello", {41, 42, 43})].[0].1.[42];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <Set> $0 (SET.NEW (INT.CONST 41) (INT.CONST 42) (INT.CONST 43)))
						(DECL <tuple> $1 (TUPLE.NEW (STR.CONST "hello") (GET $0)))
						(DECL <List> $2 (LIST.NEW (GET $1)))
						(DECL <tuple> $3 (LIST.GET (GET $2) (INT.CONST 0)))
						(DECL <Set> $4 (TUPLE.GET 1 (GET $3)))
						(DROP (SET.GET (GET $4) (INT.CONST 42)))
						(ENDPROGRAM)
				`.trim());
			});
			test.test('union access.', () => {
				assert.strictEqual(setupScript(`{
					val mut tup:   (int, ?: float)     | (int, ?: str)     = (42,);
					val mut rec:   (a: int, b?: float) | (a: int, c?: str) = (a= 42);
					val mut list:  [int]               | [float]           = [42];
					val mut dict:  [:int]              | [:float]          = [a= 42];
					val mut 'set': {int}               | {float}           = {42};
					val mut map:   {int -> str}        | {float -> str}    = {42 -> "hello"};
					tup.0;
					rec.a;
					list.[0];
					dict.[@a];
					'set'.[42];
					map.[42];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <tuple> tup (TUPLE.NEW (INT.CONST 42)))
						(DECL <record> rec (RECORD.NEW @a->(INT.CONST 42)))
						(DECL <List> list (LIST.NEW (INT.CONST 42)))
						(DECL <Dict> dict (DICT.NEW @a->(INT.CONST 42)))
						(DECL <Set> 'set' (SET.NEW (INT.CONST 42)))
						(DECL <Map> map (MAP.NEW (INT.CONST 42)->(STR.CONST "hello")))
						(DROP (TUPLE.GET 0 (GET tup)))
						(DROP (RECORD.GET @a (GET rec)))
						(DROP (LIST.GET (GET list) (INT.CONST 0)))
						(DROP (DICT.GET (GET dict) (SYM.CONST @a)))
						(DROP (SET.GET (GET 'set') (INT.CONST 42)))
						(DROP (MAP.GET (GET map) (INT.CONST 42)))
						(ENDPROGRAM)
				`.trim());
			});
		});
		test.suite('access kind: maybe access (`a?.‹b›`).', () => {
			function op_maybe_unwrap_string(mab: string): string {
				return `(RECORD.GET @${ TYPE.Maybe.MAYBE_PROPS.value.name } ${ mab })`;
			}
			function maybe_access_output(
				block_n:      number,
				base_name:    string,
				result_n:     number,
				result_value: string | ((result_setter: (value?: string) => string) => string),
			): string {
				const block_then:  string = `block-${ block_n }`;
				const block_else:  string = `block-${ block_n + 1 }`;
				const block_endif: string = `block-${ block_n + 2 }`;
				const result_name: string = `$${ result_n }`;
				return xjs.String.dedent`
					${ '\t' }(DECL <record> ${ result_name })
					${ '\t' }(GOTO.IF (ISNONE (GET ${ base_name })) "${ block_then }" "${ block_else }")
					"${ block_then }":
						(SET ${ result_name } ${ op_maybe_string() })
						(GOTO "${ block_endif }")
					"${ block_else }":
						${ typeof result_value === 'string'
							? `(SET ${ result_name } ${ op_maybe_string(result_value) })`
							: result_value((res_val) => `(SET ${ result_name } ${ op_maybe_string(res_val) })`) }
						(GOTO "${ block_endif }")
					"${ block_endif }":
						(DROP (GET ${ result_name }))
				`.trimEnd();
			}
			/* eslint-disable @stylistic/indent */
			test.test('tuple access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_tupleA: (int, int, ?:int) = (41 + 1, 42 / 2, 43 ^ 3);
					val mut my_tupleB: (int, int, ?:int) = (41 + 1, 42 / 2);
					my_tupleA?.2;
					my_tupleB?.2;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
						(DECL <tuple> my_tupleA (TUPLE.NEW (GET $0) (GET $1) (GET $2)))
						(DECL <int> $3 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $4 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <tuple> my_tupleB (TUPLE.NEW (GET $3) (GET $4)))
				`.trim().concat(
					maybe_access_output(1, 'my_tupleA', 5, '(TUPLE.GET 2 (GET my_tupleA))'),
					maybe_access_output(4, 'my_tupleB', 6, (result_setter) => extract_lines`
						(DROP (GET my_tupleB))
						${ result_setter() }
					`.join('\n\t')),
					'\n\t(ENDPROGRAM)',
				));
			});
			test.test('record access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_recordX: (a: int, b?: int, c: int) = (a= 41 + 1, c= 42 / 2, b= 43 ^ 3);
					val mut my_recordY: (a: int, b?: int, c: int) = (a= 41 + 1, c= 42 / 2);
					my_recordX?.b;
					my_recordY?.b;
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
						(DECL <record> my_recordX (RECORD.NEW @a->(GET $0) @c->(GET $1) @b->(GET $2)))
						(DECL <int> $3 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
						(DECL <int> $4 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
						(DECL <record> my_recordY (RECORD.NEW @a->(GET $3) @c->(GET $4)))
				`.trim().concat(
					maybe_access_output(1, 'my_recordX', 5, '(RECORD.GET @b (GET my_recordX))'),
					maybe_access_output(4, 'my_recordY', 6, (result_setter) => extract_lines`
						(DROP (GET my_recordY))
						${ result_setter() }
					`.join('\n\t')),
					'\n\t(ENDPROGRAM)',
				));
			});
			test.test('List access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list: [int] = [41, 42];
					my_list?.[2];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <List> my_list (LIST.NEW (INT.CONST 41) (INT.CONST 42)))
				`.trim().concat(maybe_access_output(1, 'my_list', 0, '(LIST.GET (GET my_list) (INT.CONST 2))'), '\n\t(ENDPROGRAM)'));
			});
			test.test('Dict access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_dict: [:int] = [a= 41, c= 42];
					my_dict?.[@b];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <Dict> my_dict (DICT.NEW @a->(INT.CONST 41) @c->(INT.CONST 42)))
				`.trim().concat(maybe_access_output(1, 'my_dict', 0, '(DICT.GET (GET my_dict) (SYM.CONST @b))'), '\n\t(ENDPROGRAM)'));
			});
			test.test('Map access.', () => {
				assert.strictEqual(setupScript(`{
					val mut accessor: int = 22;
					{21 -> 41, 22 -> 42, 23 -> 43}?.[accessor];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <int> accessor (INT.CONST 22))
						(DECL <Map> $0 (MAP.NEW (INT.CONST 21)->(INT.CONST 41) (INT.CONST 22)->(INT.CONST 42) (INT.CONST 23)->(INT.CONST 43)))
				`.trim().concat(maybe_access_output(1, '$0', 1, '(MAP.GET (GET $0) (GET accessor))'), '\n\t(ENDPROGRAM)'));
			});
			test.test('returns None when base is optional and unset; short-circuits evaluation of dynamic accessor.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_tup?:  (int, bool);
					val mut my_rec?:  (a: int);
					val mut my_list?: [int];
					val mut my_dict?: [:int];
					val mut my_map?:  {int -> int};
					my_tup?.1;
					my_rec?.a;
					my_list?.[2 * 2 - 3];
					my_dict?.[@b && @a];
					my_map?.[5 + 3 * 2];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <record> my_tup ${ op_maybe_string() })
						(DECL <record> my_rec ${ op_maybe_string() })
						(DECL <record> my_list ${ op_maybe_string() })
						(DECL <record> my_dict ${ op_maybe_string() })
						(DECL <record> my_map ${ op_maybe_string() })
				`.trim().concat(
					maybe_access_output(1, 'my_tup', 0, (result_setter) => extract_lines`
						(DECL <tuple> $1 ${ op_maybe_unwrap_string('(GET my_tup)') })
						${ result_setter('(TUPLE.GET 1 (GET $1))') }
					`.join('\n\t')),
					maybe_access_output(4, 'my_rec', 2, (result_setter) => extract_lines`
						(DECL <record> $3 ${ op_maybe_unwrap_string('(GET my_rec)') })
						${ result_setter('(RECORD.GET @a (GET $3))') }
					`.join('\n\t')),
					maybe_access_output(7, 'my_list', 4, (result_setter) => extract_lines`
						(DECL <List> $5 ${ op_maybe_unwrap_string('(GET my_list)') })
						(DECL <int> $6 (INT.MUL (INT.CONST 2) (INT.CONST 2)))
						(DECL <int> $7 (INT.SUB (GET $6) (INT.CONST 3)))
						${ result_setter('(LIST.GET (GET $5) (GET $7))') }
					`.join('\n\t')),
					maybe_access_output(10, 'my_dict', 8, (result_setter) => xjs.String.dedent`
						${ '\t' }(DECL <Dict> $9 ${ op_maybe_unwrap_string('(GET my_dict)') })
						${ '\t' }(DECL <sym> $10)
						${ '\t' }(GOTO.IF (TOBOOL (SYM.CONST @b)) "block-13" "block-14")
						"block-13":
							(SET $10 (SYM.CONST @a))
							(GOTO "block-15")
						"block-14":
							(SET $10 (SYM.CONST @b))
							(GOTO "block-15")
						"block-15":
							${ result_setter('(DICT.GET (GET $9) (GET $10))') }
					`.trim()),
					maybe_access_output(16, 'my_map', 11, (result_setter) => extract_lines`
						(DECL <Map> $12 ${ op_maybe_unwrap_string('(GET my_map)') })
						(DECL <int> $13 (INT.MUL (INT.CONST 3) (INT.CONST 2)))
						(DECL <int> $14 (INT.ADD (INT.CONST 5) (GET $13)))
						${ result_setter('(MAP.GET (GET $12) (GET $14))') }
					`.join('\n\t')),
					'\n\t(ENDPROGRAM)',
				));
			});
			test.test('returns Some when base is optional and set; short-circuits evaluation of dynamic accessor.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list?: [int];
					val mut my_dict?: [:int];
					val mut my_map?:  {int -> int};
					set my_list = [42];
					set my_dict = [a= 42];
					set my_map  = {42 -> 11};
					my_list?.[2 * 2 - 3];
					my_dict?.[@b && @a];
					my_map?.[5 + 3 * 2];
				}`, {codegen: false}).builder.print(), xjs.String.dedent`
					"block-0":
						(DECL <record> my_list ${ op_maybe_string() })
						(DECL <record> my_dict ${ op_maybe_string() })
						(DECL <record> my_map ${ op_maybe_string() })
						(SET my_list ${ op_maybe_string('(LIST.NEW (INT.CONST 42))') })
						(SET my_dict ${ op_maybe_string('(DICT.NEW @a->(INT.CONST 42))') })
						(SET my_map ${ op_maybe_string('(MAP.NEW (INT.CONST 42)->(INT.CONST 11))') })
				`.trim().concat(
					maybe_access_output(1, 'my_list', 0, (result_setter) => extract_lines`
						(DECL <List> $1 ${ op_maybe_unwrap_string('(GET my_list)') })
						(DECL <int> $2 (INT.MUL (INT.CONST 2) (INT.CONST 2)))
						(DECL <int> $3 (INT.SUB (GET $2) (INT.CONST 3)))
						${ result_setter('(LIST.GET (GET $1) (GET $3))') }
					`.join('\n\t')),
					maybe_access_output(4, 'my_dict', 4, (result_setter) => xjs.String.dedent`
						${ '\t' }(DECL <Dict> $5 ${ op_maybe_unwrap_string('(GET my_dict)') })
						${ '\t' }(DECL <sym> $6)
						${ '\t' }(GOTO.IF (TOBOOL (SYM.CONST @b)) "block-7" "block-8")
						"block-7":
							(SET $6 (SYM.CONST @a))
							(GOTO "block-9")
						"block-8":
							(SET $6 (SYM.CONST @b))
							(GOTO "block-9")
						"block-9":
							${ result_setter('(DICT.GET (GET $5) (GET $6))') }
					`.trim()),
					maybe_access_output(10, 'my_map', 7, (result_setter) => extract_lines`
						(DECL <Map> $8 ${ op_maybe_unwrap_string('(GET my_map)') })
						(DECL <int> $9 (INT.MUL (INT.CONST 3) (INT.CONST 2)))
						(DECL <int> $10 (INT.ADD (INT.CONST 5) (GET $9)))
						${ result_setter('(MAP.GET (GET $8) (GET $10))') }
					`.join('\n\t')),
					'\n\t(ENDPROGRAM)',
				));
			});
			/* eslint-enable @stylistic/indent */
		});
	});
});
