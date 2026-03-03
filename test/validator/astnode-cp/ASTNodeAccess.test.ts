import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	assert_instanceof,
	AST,
	VALUE,
	TYPE,
	type Builder,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
	VoidErrorOutOfBounds,
} from '../../../src/index.ts';
import {
	assertEqualTypes,
	assertEqualBins,
	assertAssignable,
} from '../../assert-helpers.ts';
import {
	setupScript,
	typeUnit,
	buildConst,
} from '../../helpers.ts';
import {
	extract_lines,
	repeat,
} from '../../utils.ts';



test.suite('ASTNodeAccess', () => {
	const TEST_VALUES = [
		VALUE.INT_1,
		new VALUE.Float(2.0),
		new VALUE.String('three'),
	] as const;

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
		const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(source);
		goal.varCheck();
		try {
			goal.typeCheck();
		} catch {
			// if type-checking fails, proceed to `assert.throws` below
		}
		const statements: readonly AST.ASTNodeStatementExpression[] = goal.block!.children.filter((stmt) => stmt instanceof AST.ASTNodeStatementExpression);
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


	/**
	 * Takes a program source text and compares it to the array of expected folded values.
	 * The format of the program source text must be
	 * 0 or more variable declarations and 0 or more nonempty expression-statements, possibly intermixed.
	 * (The source text must be valid!)
	 * The expression-statements’ expression folded values, or null if they are not foldable, are compared to the expected values via `deepStrictEqual`.
	 * If any of the expecteds are Error (or subclasses) constructors, then the expression fold is expected to throw, and is tested against that.
	 * @param source    the program source text to parse and analyze
	 * @param expecteds the expected folded values (or null) of the expressions
	 */
	function testExprValues(source: string, expecteds: readonly (VALUE.Value | null | ConstructorType<Error>)[]): void {
		const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(source);
		goal.varCheck();
		try {
			goal.typeCheck();
		} catch {
			// if type-checking fails, proceed to `assert.throws` below
		}
		const statements: readonly AST.ASTNodeStatementExpression[] = goal.block!.children.filter((stmt) => stmt instanceof AST.ASTNodeStatementExpression);
		return expecteds.some((it) => it instanceof Function)
			? (assert.strictEqual(statements.length, expecteds.length, 'Arrays are not the same length.'), xjs.Array.forEachAggregated(statements, (stmt, i) => {
				const expected: VALUE.Value | null | ConstructorType<Error> = expecteds[i];
				return expected instanceof Function
					? assert.throws(() => stmt.expr!.fold(), expected)
					: assert.deepStrictEqual(stmt.expr!.fold(), expected);
			}))
			: assert.deepStrictEqual(
				statements.map((stmt) => stmt.expr!.fold()),
				expecteds,
			);
	}


	test.suite('access kind: normal access (`a.‹b›`).', () => {
		test.suite('when base is nullish.', () => {
			const SRCS = extract_lines`
				null.3
				null.four
				null.[((((),),),)]
			`;
			test.test('#type: throws when base is a subtype of null.', () => {
				xjs.Array.forEachAggregated(SRCS, (src, i) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), [
					...repeat(TypeErrorNoEntry, 2),
					TypeErrorInvalidOperation,
				][i], `access manner: access by ${ ['index', 'key', 'expression'][i] }.`));
			});
			test.test('#fold: throws when base is null.', () => {
				xjs.Array.forEachAggregated(SRCS, (src, i) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), Error, `access manner: access by ${ ['index', 'key', 'expression'][i] }.`));
			});
		});

		test.suite('access manner: by index / by key', () => {
			const SRC = `{
				val     tup_fixed:   (int, float, str) = (1, 2.0, "three");
				val mut tup_unfixed: (int, float, str) = (1, 2.0, "three");

				val     rec_fixed:   (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");
				val mut rec_unfixed: (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");

				tup_fixed.0;    % type \`1\`       % value \`1\`
				tup_fixed.1;    % type \`2.0\`     % value \`2.0\`
				tup_fixed.+2;   % type \`"three"\` % value \`"three"\`
				tup_unfixed.0;  % type \`int\`     % non-foldable value
				tup_unfixed.1;  % type \`float\`   % non-foldable value
				tup_unfixed.+2; % type \`str\`     % non-foldable value
				tup_fixed.-3;   % type \`1\`       % value \`1\`
				tup_fixed.-2;   % type \`2.0\`     % value \`2.0\`
				tup_fixed.-1;   % type \`"three"\` % value \`"three"\`
				tup_unfixed.-3; % type \`int\`     % non-foldable value
				tup_unfixed.-2; % type \`float\`   % non-foldable value
				tup_unfixed.-1; % type \`str\`     % non-foldable value

				rec_fixed.a;   % type \`1\`       % value \`1\`
				rec_fixed.b;   % type \`2.0\`     % value \`2.0\`
				rec_fixed._;   % type \`"three"\` % value \`"three"\`
				rec_unfixed.a; % type \`int\`     % non-foldable value
				rec_unfixed.b; % type \`float\`   % non-foldable value
				rec_unfixed._; % type \`str\`     % non-foldable value
			}`;
			const THROWS = extract_lines`
				(1, 2.0, "three").3
				(1, 2.0, "three").-4
				(a= 1, b= 2.0, c= "three").d
			`;
			test.suite('#type', () => {
				test.test('return individual entry types.', () => {
					testExprTypes(SRC, [
						typeUnit(1n),
						typeUnit(2.0),
						typeUnit('three'),
						TYPE.INT,
						TYPE.FLOAT,
						TYPE.STR,
						typeUnit(1n),
						typeUnit(2.0),
						typeUnit('three'),
						TYPE.INT,
						TYPE.FLOAT,
						TYPE.STR,

						typeUnit(1n),
						typeUnit(2.0),
						typeUnit('three'),
						TYPE.INT,
						TYPE.FLOAT,
						TYPE.STR,
					]);
				});
				test.test('throws when base object is of type `anything`.', () => {
					testExprTypes(`{
						val mut a:                    anything = (   10,    20);
						val mut b: (int, int)       | anything = (   10,    20);
						val mut c:                    anything = (x= 10, y= 20);
						val mut d: (x: int, y: int) | anything = (x= 10, y= 20);

						a.0;
						b.1;
						c.x;
						d.y;
					}`, repeat(TypeErrorNoEntry, 4));
				});
				test.test('throws when base object is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						(4).2
						[10, 20, 30].1

						(4).c
						[a= 10, b= 20, c= 30].b
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry, src));
				});
				test.test('throws when index is out of bounds / when key is out of range.', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry));
				});
				test.test('throws when entry is optional.', () => {
					testExprTypes(`{
						val tup_a: (int, int, ?: int) = (10, 20);
						val tup_b: (int, int, ?: int) = (10, 20, 30);

						val rec_a: (x: int, y?: int, z: int) = (x= 10, z= 20);
						val rec_b: (x: int, y?: int, z: int) = (x= 10, z= 20, y= 30);

						tup_a.2;
						tup_b.2;

						rec_a.y;
						rec_b.y;
					}`, repeat(TypeErrorInvalidOperation, 4));
				});
				test.suite('if base is an intersection type.', () => {
					const DECLS = `
						type A = (a: str);
						type B = (b: str);
						type C = (c: str);
						type D = (d: str);
						val mut tup: (   A,     B,       int) & (   C,  ?: D)        = ((a= "tup.0.a", c= "tup.0.c"), (b= "tup.1.b", d= "tup.1.d"), 42);
						val mut rec: (x: A, y?: int, z?: B)   & (x: C,        z?: D) = (x= (a= "rec.x.a", c= "rec.x.c"), y= 42, z= (b= "rec.z.b", d= "rec.z.d"));
					`;
					const A: TYPE.Record = TYPE.Record.fromTypes(new Map([[0x100n, TYPE.STR]]));
					const B: TYPE.Record = TYPE.Record.fromTypes(new Map([[0x102n, TYPE.STR]]));
					const C: TYPE.Record = TYPE.Record.fromTypes(new Map([[0x104n, TYPE.STR]]));
					const D: TYPE.Record = TYPE.Record.fromTypes(new Map([[0x106n, TYPE.STR]]));
					test.test('if any constituent has the entry and it’s required, returns the intersection of those.', () => {
						testExprTypes(`{
							${ DECLS }

							tup.0; % required & required % type \`A & C\`
							rec.x; % required & required % type \`A & C\`
							tup.1; % required & optional % type \`B & D\`
							tup.2; % required & missing  % type \`int\`
						}`, [
							...repeat(A.intersect(C), 2),
							B.intersect(D),
							TYPE.INT,
						]);
					});
					test.test('throws when some constituent (but not all) does not have the entry, or has it but it is optional.', () => {
						testExprTypes(`{
							${ DECLS }

							rec.y; % optional & missing
							rec.z; % optional & optional
						}`, repeat(TypeErrorInvalidOperation, 2));
					});
					test.test('an intersection with union constituents.', () => {
						testExprTypes(`{
							val mut collection: ((alpha: bool) | (bravo: 2 | 3 | 4)) & (bravo: 3 | 4 | 5) = (bravo= 3);
							collection.bravo; % type \`3 | 4\`
						}`, [typeUnit(3n).union(typeUnit(4n))]);
					});
				});
				test.suite('if base is a union type.', () => {
					const DECLS = `
						val mut tup: (   null,     bool,     sym) | (   int, ?: float)          = (null, true, @hello);
						val mut rec: (a: null, b?: bool, c?: sym) | (a: int,           c?: str) = (a= 42);
					`;
					test.test('throws when one but not all constituents are of incorrect type.', () => {
						testExprTypes(`{
							val mut mixed_tup: (str, bool, sym) | (a: str,  b?: bool, c?: sym) = ("hello", true, @world);
							val mut mixed_rec: (int, ?: float)  | (a: int, c?: str)            = (a= 42);

							mixed_tup.a;
							mixed_rec.0;
						}`, repeat(TypeErrorInvalidOperation, 2));
					});
					test.test('throws when every constituent does not have the entry (index out of bounds / key out of range).', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
							${ DECLS }

							tup.3;
							rec.d;
						}`);
						goal.varCheck();
						return assert.throws(() => goal.typeCheck(), (err) => {
							assert_instanceof(err, AggregateError);
							assertAssignable(err, {
								cons:   AggregateError,
								errors: [
									{
										cons:   AggregateError,
										errors: [
											{cons: TypeErrorNoEntry, message: 'Index `3` does not exist on type `(null, bool, sym)`.'},
											{cons: TypeErrorNoEntry, message: 'Index `3` does not exist on type `(int, ?: float)`.'},
										],
									},
									{
										cons:   AggregateError,
										errors: [
											{cons: TypeErrorNoEntry, message: 'Key `d` does not exist on type `(258: null, 259?: bool, 260?: sym)`.'},
											{cons: TypeErrorNoEntry, message: 'Key `d` does not exist on type `(258: int, 260?: str)`.'},
										],
									},
								],
							});
							return true;
						});
					});
					test.test('if every constituent has the entry and it’s required, returns the union of those.', () => {
						testExprTypes(`{
							${ DECLS }

							tup.0; % type \`null | int\`
							rec.a; % type \`null | int\`
						}`, repeat(TYPE.NULL.union(TYPE.INT), 2));
					});
					test.test('throws when some constituent (but not all) does not have the entry, or has it but it is optional.', () => {
						testExprTypes(`{
							${ DECLS }

							tup.1; % required | optional
							tup.2; % required | missing
							rec.b; % optional | missing
							rec.c; % optional | optional
						}`, repeat(TypeErrorInvalidOperation, 4));
					});
					test.test('a union with intersection constituents.', () => {
						testExprTypes(`{
							val mut collection: (alpha: bool, bravo: 2 | 3 | 4) & (bravo: 3 | 4 | 5, charlie: str) | () = ();
							collection.bravo;
						}`, [TypeErrorInvalidOperation]);
					});
				});
			});
			test.suite('#fold', () => {
				test.test('return individual entries.', () => {
					testExprValues(SRC, [
						new VALUE.Integer(1n),
						new VALUE.Float(2.0),
						new VALUE.String('three'),
						...repeat(null, 3),
						new VALUE.Integer(1n),
						new VALUE.Float(2.0),
						new VALUE.String('three'),
						...repeat(null, 3),

						new VALUE.Integer(1n),
						new VALUE.Float(2.0),
						new VALUE.String('three'),
						...repeat(null, 3),
					]);
				});
				test.test('throws AssertionError when base is of incorrect type (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(extract_lines`
						(null, true, @hello).a
						(a= 42).0
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), assert.AssertionError));
				});
				test.test('throws when index is out of bounds / when key is out of range (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), VoidErrorOutOfBounds));
				});
			});
		});

		test.suite('access manner: access by expression.', () => {
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
			const SRC = `{
				${ DECLS }

				list_fixed.[0];      % type \`1\`       % value \`1\`
				list_fixed.[1];      % type \`2.0\`     % value \`2.0\`
				list_fixed.[+2];     % type \`"three"\` % value \`"three"\`
				dict_fixed.[@a];     % type \`1\`       % value \`1\`
				dict_fixed.[@b];     % type \`2.0\`     % value \`2.0\`
				dict_fixed.[@c];     % type \`"three"\` % value \`"three"\`
				set_fixed.[1];       % type \`true\`    % value \`true\`
				set_fixed.[2.0];     % type \`true\`    % value \`true\`
				set_fixed.["three"]; % type \`true\`    % value \`true\`
				map_fixed.["a"];     % type \`1\`       % value \`1\`
				map_fixed.["b"];     % type \`2.0\`     % value \`2.0\`
				map_fixed.["c"];     % type \`"three"\` % value \`"three"\`

				list_unfixed.[0];      % type \`int | float | str\` % non-foldable value
				list_unfixed.[1];      % type \`int | float | str\` % non-foldable value
				list_unfixed.[+2];     % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@a];     % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@b];     % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@c];     % type \`int | float | str\` % non-foldable value
				set_unfixed.[1];       % type \`bool\`              % non-foldable value
				set_unfixed.[2.0];     % type \`bool\`              % non-foldable value
				set_unfixed.["three"]; % type \`bool\`              % non-foldable value
				map_unfixed.["a"];     % type \`int | float | str\` % non-foldable value
				map_unfixed.["b"];     % type \`int | float | str\` % non-foldable value
				map_unfixed.["c"];     % type \`int | float | str\` % non-foldable value
			}`;
			const ERRS = `{
				${ DECLS }

				list_fixed.[3];    % type \`nothing\`           % fold throws VoidError
				list_fixed.[-4];   % type \`nothing\`           % fold throws VoidError
				dict_fixed.[@d];   % type \`nothing\`           % fold throws VoidError
				list_unfixed.[3];  % type \`int | float | str\` % non-foldable value
				list_unfixed.[-4]; % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@d]; % type \`int | float | str\` % non-foldable value
			}`;
			const ALLOWS = `{
				${ DECLS }
				val     set_mut_fixed:    Set .<     int | float | str> = {1, 2.0, "three"};
				val     map_mut_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				val mut set_mut_unfixed:  Set .<     int | float | str> = set_fixed;
				val mut map_mut_unfixed:  Map .<str, int | float | str> = map_fixed;

				% correct type, but out of range
				set_fixed      .[42.0]; % type \`false\`             % value \`false\`
				map_fixed      .["d"];  % type \`null\`              % value \`null\`
				set_unfixed    .[42.0]; % type \`bool\`              % non-foldable value
				map_unfixed    .["d"];  % type \`int | float | str\` % non-foldable value
				set_mut_fixed  .[42.0]; % type \`false\`             % value \`false\`
				map_mut_fixed  .["d"];  % type \`null\`              % value \`null\`
				set_mut_unfixed.[42.0]; % type \`bool\`              % non-foldable value
				map_mut_unfixed.["d"];  % type \`int | float | str\` % non-foldable value

				% incorrect type
				set_fixed      .[true]; % type \`false\`             % value \`false\`
				map_fixed      .[true]; % type \`null\`              % value \`null\`
				set_unfixed    .[true]; % type \`bool\`              % non-foldable value
				map_unfixed    .[true]; % type \`int | float | str\` % non-foldable value
				set_mut_fixed  .[true]; % type \`false\`             % value \`false\`
				map_mut_fixed  .[true]; % type \`null\`              % value \`null\`
				set_mut_unfixed.[true]; % type \`bool\`              % non-foldable value
				map_mut_unfixed.[true]; % type \`int | float | str\` % non-foldable value
			}`;
			test.suite('#type', () => {
				test.test('throws when one but not all constituents are of incorrect type.', () => {
					testExprTypes(`{
						val mut mixed_list: List.<str | bool | sym> | Dict.<str | bool | sym> = ["hello", true, @world];
						val mut mixed_dict: List.<int | float>      | Dict.<int | str>        = [a= 42];

						val mut nullish_map: {int -> bool} | null = {42 -> false};

						mixed_list.[@a];
						mixed_dict.[0];

						nullish_map.[42];
					}`, repeat(TypeErrorInvalidOperation, 3));
				});
				test.test('returns individual entry types for folded objects, union types for unfolded objects.', () => {
					const N_TYPES = [
						typeUnit(1n),
						typeUnit(2.0),
						typeUnit('three'),
					] as const;
					const TYPE_INT_FLOAT_STR = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR);
					return testExprTypes(SRC, [
						...N_TYPES,
						...N_TYPES,
						...repeat(TYPE.TRUE, 3),
						...N_TYPES,

						...repeat(TYPE_INT_FLOAT_STR, 6),
						...repeat(TYPE.BOOL, 3),
						...repeat(TYPE_INT_FLOAT_STR, 3),
					]);
				});
				test.test('unsupported: throws for string access of dict.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource('[a= 10, b= 20, c= 30].["a"]').type(), /String keys for dict access are not yet supported\./);
				});
				test.test('throws when base object is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						(4).[2]
						(10, 20, 30).[1]
						(a= 10, b= 20, c= 30).[@b]
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorInvalidOperation, src));
				});
				test.test('for Lists/Dicts: when accessor expression is correct type but out of bounds/range, returns `nothing` for folded objects, returns union type for unfolded objects.', () => {
					const TYPE_INT_FLOAT_STR = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR);
					return testExprTypes(ERRS, [
						...repeat(TYPE.NOTHING, 3),
						...repeat(TYPE_INT_FLOAT_STR, 3),
					]);
				});
				test.test('for Lists/Dicts: throws when accessor expression is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						[1, 2.0, "three"].["3"]
						[a= 1, b= 2.0, c= "three"].[3]
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNotNarrow, src));
				});
				test.test('for Sets/Maps: when expression is correct type but out of range or incorrect type, returns entry type.', () => {
					const TYPE_INT_FLOAT_STR = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR);
					return testExprTypes(ALLOWS, repeat([
						TYPE.FALSE,
						TYPE.NULL,
						TYPE.BOOL,
						TYPE_INT_FLOAT_STR,
					], 4).flat());
				});
			});
			test.suite('#fold', () => {
				test.test('returns individual entries for folded objects.', () => {
					testExprValues(SRC, [
						...TEST_VALUES,
						...TEST_VALUES,
						...repeat(VALUE.TRUE, 3),
						...TEST_VALUES,

						...repeat(null, 12),
					]);
				});
				test.test('for Lists/Dicts: when accessor expression is out of bounds/range, throws for folded objects, returns null for unfolded objects.', () => {
					testExprValues(ERRS, [
						...repeat(VoidErrorOutOfBounds, 3),
						...repeat(null, 3),
					]);
				});
				test.test('for Sets/Maps: when expression is correct type but out of range or incorrect type, returns `null` value for folded objects, returns native null for unfolded objects.', () => {
					testExprValues(ALLOWS, repeat([
						VALUE.FALSE,
						VALUE.NULL,
						...repeat(null, 2),
					], 4).flat());
				});
			});
		});
	});


	test.suite('access kind: maybe access (`a?.‹b›`).', () => {
		test.suite('when base is nullish.', () => {
			const SRC = `{
				null?.3;
				null?.four;
				null?.[((((),),),)];
			}`;
			test.suite('#type', () => {
				test.test('throws when base is a subtype of null.', () => {
					testExprTypes(SRC, [
						...repeat(TypeErrorNoEntry, 2),
						TYPE.NULL,
					]);
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
						prop1.union(TYPE.NULL),                                              // (bool,) | null
						TYPE.BOOL.union(TYPE.NULL),                                          // bool | null
						new TYPE.Record(new Map([[0x100n, {type: prop2, optional: true}]])), // (prop?: (?: bool))
						prop2.union(TYPE.NULL),                                              // (?: bool) | null
						TYPE.BOOL.union(TYPE.NULL),                                          // bool | null
					]);
				});
			});
			test.suite('#fold', () => {
				test.test('returns base when it is null.', () => {
					testExprValues(SRC, repeat(VALUE.NULL, 3));
				});
				test.test('chained maybe access.', () => {
					const prop1 = new VALUE.Tuple([VALUE.TRUE]); // (true,)
					const prop2 = new VALUE.Tuple();             // ()
					return testExprValues(`{
						val bound1: (prop?: (bool,)) = (prop= (true,));
						val bound2: (prop?: (?: bool)) = (prop= ());
						bound1;
						bound1?.prop;
						bound1?.prop?.0;
						bound2;
						bound2?.prop;
					}`, [
						new VALUE.Record(new Map([[0x100n, prop1]])), // (prop= (true,))
						prop1,                                        // (true,)
						VALUE.TRUE,                                   // true
						new VALUE.Record(new Map([[0x100n, prop2]])), // (prop= ())
						prop2,                                        // ()
					]);
				});
				test.test('maybe access of non-existent value returns null (bypassing type-checking).', () => {
					assert.strictEqual(
						AST.ASTNodeAccess.fromSource('(prop= ()).prop?.0').fold(),
						VALUE.NULL,
					);
				});
			});
		});

		test.suite('access manner: access by index / by key.', () => {
			const SRC = `{
				val     tupo1_f: (int, float, ?: str) = (1, 2.0, "three");
				val mut tupo1_u: (int, float, ?: str) = (1, 2.0, "three");
				val mut tupo2_u: (int, float, ?: str) = (1, 2.0);

				val     reco1_f: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
				val mut reco1_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
				val mut reco2_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0);

				tupo1_f?.+2; % type \`"three"\` % value \`"three"\`
				tupo1_u?.+2; % type \`str?\`    % non-foldable value
				tupo2_u?.2;  % type \`str?\`    % non-foldable value

				reco1_f?.b; % type \`"three"\` % value \`"three"\`
				reco1_u?.b; % type \`str?\`    % non-foldable value
				reco2_u?.b; % type \`str?\`    % non-foldable value
			}`;
			const THROWS = extract_lines`
				(1, 2.0, "three")?.3
				(1, 2.0, "three")?.-4
				(a= 1, b= 2.0, c= "three")?.d
			`;
			test.suite('#type', () => {
				test.test('unions with null if entry is optional.', () => {
					testExprTypes(SRC, [
						typeUnit('three'),
						...repeat(TYPE.STR.union(TYPE.NULL), 2),

						typeUnit('three'),
						...repeat(TYPE.STR.union(TYPE.NULL), 2),
					]);
				});
				test.test('returns `anything` when base object is of type `anything`.', () => {
					testExprTypes(`{
						val mut a:                    anything = (   10,    20);
						val mut b: (int, int)       | anything = (   10,    20);
						val mut c:                    anything = (x= 10, y= 20);
						val mut d: (x: int, y: int) | anything = (x= 10, y= 20);

						a?.0;
						b?.1;
						c?.x;
						d?.y;
					}`, repeat(TYPE.ANYTHING, 4));
				});
				test.test('throws when base object is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						(4)?.2
						[10, 20, 30]?.1

						(4)?.c
						[a= 10, b= 20, c= 30]?.b
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry, src));
				});
				test.test('throws when index is out of bounds / when key is out of range.', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry));
				});
				test.test('throws when entry is not optional and base is not nullish.', () => {
					testExprTypes(`{
						val tup_a: (int, int, ?: int) = (10, 20);
						val tup_b: (int, int, ?: int) = (10, 20, 30);

						val rec_a: (x: int, y?: int, z: int) = (x= 10, z= 20);
						val rec_b: (x: int, y?: int, z: int) = (x= 10, z= 20, y= 30);

						tup_a?.1;
						tup_b?.1;

						rec_a?.z;
						rec_b?.z;
					}`, repeat(TypeErrorInvalidOperation, 4));
				});
				test.suite('if base is an intersection type.', () => {
					const DECLS = `
						type A = (a: str);
						type B = (b: str);
						type C = (c: str);
						type D = (d: str);
						val mut tup: (   A,     B,       int) & (   C,  ?: D)        = ((a= "tup.0.a", c= "tup.0.c"), (b= "tup.1.b", d= "tup.1.d"), 42);
						val mut rec: (x: A, y?: int, z?: B)   & (x: C,        z?: D) = (x= (a= "rec.x.a", c= "rec.x.c"), y= 42, z= (b= "rec.z.b", d= "rec.z.d"));
					`;
					const B: TYPE.Record = TYPE.Record.fromTypes(new Map([[0x102n, TYPE.STR]]));
					const D: TYPE.Record = TYPE.Record.fromTypes(new Map([[0x106n, TYPE.STR]]));
					test.test('throws if any constituent has the entry and it’s required.', () => {
						testExprTypes(`{
							${ DECLS }

							tup?.0; % required & required
							rec?.x; % required & required
							tup?.1; % required & optional
							tup?.2; % required & missing
						}`, repeat(TypeErrorInvalidOperation, 4));
					});
					test.test('if some constituent (but not all) does not have the entry, or has it but it is optional, returns the intersection of all such constituents’ entries, unioned with null.', () => {
						testExprTypes(`{
							${ DECLS }

							rec?.y; % optional & missing  % type \`int   | null\`
							rec?.z; % optional & optional % type \`B & D | null\`
						}`, [
							TYPE.INT.union(TYPE.NULL),
							B.intersect(D).union(TYPE.NULL),
						]);
					});
					test.test('an intersection with union constituents.', () => {
						testExprTypes(`{
							val mut collection: ((alpha: bool) | (bravo: 2 | 3 | 4)) & (bravo: 3 | 4 | 5) = (bravo= 3);
							collection?.bravo;
						}`, [TypeErrorInvalidOperation]);
					});
				});
				test.suite('if base is a union type.', () => {
					const DECLS = `
						val mut tup: (   null,     bool,     sym) | (   int, ?: float)          = (null, true, @hello);
						val mut rec: (a: null, b?: bool, c?: sym) | (a: int,           c?: str) = (a= 42);
					`;
					test.test('unions with null when one but not all constituents are of incorrect type.', () => {
						testExprTypes(`{
							val mut mixed_tup: (str, bool, sym) | (a: str,  b?: bool, c?: sym) = ("hello", true, @world);
							val mut mixed_rec: (int, ?: float)  | (a: int, c?: str)            = (a= 42);

							mixed_tup?.a; % type \`null | str\`
							mixed_rec?.0; % type \`int  | null\`
						}`, [
							TYPE.NULL.union(TYPE.STR),
							TYPE.INT.union(TYPE.NULL),
						]);
					});
					test.test('throws when every constituent does not have the entry (index out of bounds / key out of range).', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
							${ DECLS }

							tup?.3;
							rec?.d;
						}`);
						goal.varCheck();
						return assert.throws(() => goal.typeCheck(), (err) => {
							assert_instanceof(err, AggregateError);
							assertAssignable(err, {
								cons:   AggregateError,
								errors: [
									{
										cons:   AggregateError,
										errors: [
											{cons: TypeErrorNoEntry, message: 'Index `3` does not exist on type `(null, bool, sym)`.'},
											{cons: TypeErrorNoEntry, message: 'Index `3` does not exist on type `(int, ?: float)`.'},
										],
									},
									{
										cons:   AggregateError,
										errors: [
											{cons: TypeErrorNoEntry, message: 'Key `d` does not exist on type `(258: null, 259?: bool, 260?: sym)`.'},
											{cons: TypeErrorNoEntry, message: 'Key `d` does not exist on type `(258: int, 260?: str)`.'},
										],
									},
								],
							});
							return true;
						});
					});
					test.test('throws when every constituent has the entry and it’s required.', () => {
						testExprTypes(`{
							${ DECLS }

							tup?.0;
							rec?.a;
						}`, repeat(TypeErrorInvalidOperation, 2));
					});
					test.test('if some constituent (but not all) has the entry and it is required, or if some constituent (and maybe all) has the entry and it is optional, returns the union of all such constituents’ entries, unioned with null.', () => {
						testExprTypes(`{
							${ DECLS }

							tup?.1; % type \`bool | float | null\` % required | optional
							tup?.2; % type \`sym          | null\` % required | missing
							rec?.b; % type \`bool         | null\` % optional | missing
							rec?.c; % type \`sym  | str   | null\` % optional | optional
						}`, [
							TYPE.Union.all(TYPE.BOOL, TYPE.FLOAT, TYPE.NULL),
							TYPE.Union.all(TYPE.SYM,              TYPE.NULL),
							TYPE.Union.all(TYPE.BOOL,             TYPE.NULL),
							TYPE.Union.all(TYPE.SYM,  TYPE.STR,   TYPE.NULL),
						]);
					});
					test.test('a union with intersection constituents.', () => {
						testExprTypes(`{
							val mut collection: (alpha: bool, bravo: 2 | 3 | 4) & (bravo: 3 | 4 | 5, charlie: str) | () = ();
							collection?.bravo; % type \`3 | 4 | null\`
						}`, [typeUnit(3n).union(typeUnit(4n)).union(TYPE.NULL)]);
					});
				});
			});
			test.suite('#fold', () => {
				test.test('returns folded values as normal.', () => {
					testExprValues(SRC, [
						new VALUE.String('three'),
						...repeat(null, 2),

						new VALUE.String('three'),
						...repeat(null, 2),
					]);
				});
				test.test('throws AssertionError when base is of incorrect type (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(extract_lines`
						(null, true, @hello)?.a
						(a= 42)?.0
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), assert.AssertionError));
				});
				test.test('returns null when index is out of bounds / when key is out of range (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.strictEqual(AST.ASTNodeAccess.fromSource(src).fold(), VALUE.NULL));
				});
			});
		});

		test.suite('access manner: access by expression.', () => {
			const DECLS = `
				val     list_fixed:   List.<     int | float | str> = [   1,    2.0,    "three"];
				val     dict_fixed:   Dict.<     int | float | str> = [a= 1, b= 2.0, c= "three"];
				val     map_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				val mut list_unfixed: List.<     int | float | str> = list_fixed;
				val mut dict_unfixed: Dict.<     int | float | str> = dict_fixed;
				val mut map_unfixed:  Map .<str, int | float | str> = map_fixed;
			`;
			const SRC = `{
				${ DECLS }

				list_fixed?.[0];  % type \`1\`       % value \`1\`
				list_fixed?.[1];  % type \`2.0\`     % value \`2.0\`
				list_fixed?.[+2]; % type \`"three"\` % value \`"three"\`
				dict_fixed?.[@a]; % type \`1\`       % value \`1\`
				dict_fixed?.[@b]; % type \`2.0\`     % value \`2.0\`
				dict_fixed?.[@c]; % type \`"three"\` % value \`"three"\`
				map_fixed?.["a"]; % type \`1\`       % value \`1\`
				map_fixed?.["b"]; % type \`2.0\`     % value \`2.0\`
				map_fixed?.["c"]; % type \`"three"\` % value \`"three"\`

				list_unfixed?.[0];  % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[1];  % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[+2]; % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@a]; % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@b]; % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@c]; % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["a"]; % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["b"]; % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["c"]; % type \`int | float | str | null\` % non-foldable value
			}`;
			const ERRS = `{
				${ DECLS }

				list_fixed?.[3];  % type \`null\`  % value \`null\`
				list_fixed?.[-4]; % type \`null\`  % value \`null\`
				dict_fixed?.[@d]; % type \`null\`  % value \`null\`
				map_fixed?.["d"]; % type \`null\`  % value \`null\`

				list_unfixed?.[3];  % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[-4]; % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@d]; % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["d"]; % type \`int | float | str | null\` % non-foldable value
			}`;
			test.suite('#type', () => {
				test.test('unions with null when one but not all constituents are of incorrect type.', () => {
					testExprTypes(`{
						val mut mixed_list: List.<str | bool | sym> | Dict.<str | bool | sym> = ["hello", true, @world];
						val mut mixed_dict: List.<int | float>      | Dict.<int | str>        = [a= 42];

						val mut nullish_map: {int -> bool} | null = {42 -> false};

						mixed_list?.[@a]; % type \`null | (str | bool | sym)\`
						mixed_dict?.[0];  % type \`(int | float) | null\`

						nullish_map?.[42]; % type \`bool | null\`
					}`, [
						TYPE.Union.all(TYPE.NULL, TYPE.STR, TYPE.BOOL, TYPE.SYM),
						TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.NULL),
						TYPE.Union.all(TYPE.BOOL, TYPE.NULL),
					]);
				});
				test.test('returns individual entry types for folded objects, union types for unfolded objects.', () => {
					const N_TYPES = [
						typeUnit(1n),
						typeUnit(2.0),
						typeUnit('three'),
					] as const;
					const TYPE_INT_FLOAT_STR_NULL = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR, TYPE.NULL);
					return testExprTypes(SRC, [
						...N_TYPES,
						...N_TYPES,
						...N_TYPES,

						...repeat(TYPE_INT_FLOAT_STR_NULL, 9),
					]);
				});
				test.test('throws when base object is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						(4)?.[2]
						(10, 20, 30)?.[1]
						(a= 10, b= 20, c= 30)?.[@b]
						Set.<int>((10, 20, 30))?.[20]
						{10, 20, 30}?.[20]
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorInvalidOperation, src));
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
				test.test('when accessor expression is correct type but out of bounds/range, returns `null` for folded objects, union types for unfolded objects.', () => {
					const TYPE_INT_FLOAT_STR_NULL = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR, TYPE.NULL);
					return testExprTypes(ERRS, [
						...repeat(TYPE.NULL, 4),
						...repeat(TYPE_INT_FLOAT_STR_NULL, 4),
					]);
				});
				test.test('throws when accessor expression is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						[1, 2.0, "three"]?.["3"]
						[a= 1, b= 2.0, c= "three"]?.[3]
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNotNarrow, src));
				});
			});
			test.suite('#fold', () => {
				test.test('short-circuits evaluation of accessor expression when base is null.', () => {
					testExprValues(`{
						val list: List.<int> | null = null;
						val dict: Dict.<int> | null = [a= 42];

						val mut index: int = 0;
						val mut key:   sym = @a;

						list?.[index]; % value \`null\`     (\`index\` is never attempted to be folded because \`list\` is null)
						dict?.[key];   % non-foldable value (\`key\` is attempted to be folded because \`dict\` is not null)
					}`, [
						VALUE.NULL,
						null,
					]);
				});
				test.test('returns individual entries for folded objects.', () => {
					testExprValues(SRC, [
						...TEST_VALUES,
						...TEST_VALUES,
						...TEST_VALUES,

						...repeat(null, 9),
					]);
				});
				test.test('when accessor expression is out of bounds/range, returns the `null` value for folded objects, returns null for unfolded objects.', () => {
					testExprValues(ERRS, [
						...repeat(VALUE.NULL, 4),
						...repeat(null, 4),
					]);
				});
			});
		});
	});


	test.test.todo('access kind: result access (`a!.‹b›`).', () => {
		assert.ok('TODO:');
	});

	test.suite('#lower', () => {
		test.suite('access kind: normal access (`a.‹b›`).', () => {
			test.test('tuple access returns an IR.TupleGet.', () => {
				assert.strictEqual(setupScript(`{
					(41 + 1, 42 / 2, 43 - 3).1;
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
					(DECL <tuple> $3 (TUPLE.NEW (GET $0) (GET $1) (GET $2)))
					(DROP (TUPLE.GET 1 (GET $3)))
				`.join('\n'));
			});
			test.test('record access returns an IR.RecordGet.', () => {
				assert.strictEqual(setupScript(`{
					(a= 41 + 1, b= 42 / 2, c= 43 - 3).b;
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
					(DECL <record> $3 (RECORD.NEW @a->(GET $0) @b->(GET $1) @c->(GET $2)))
					(DROP (RECORD.GET @b (GET $3)))
				`.join('\n'));
			});
			test.test('List access returns an IR.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					[41 + 1, 42 / 2, 43 - 3].[1];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
					(DECL <List> $3 (LIST.NEW (GET $0) (GET $1) (GET $2)))
					(DROP (LIST.GET (GET $3) (INT.CONST 1)))
				`.join('\n'));
			});
			test.test('Dict access returns an IR.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					[a= 41 + 1, b= 42 / 2, c= 43 - 3].[@b];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
					(DECL <Dict> $3 (DICT.NEW @a->(GET $0) @b->(GET $1) @c->(GET $2)))
					(DROP (DICT.GET (GET $3) (SYM.CONST @b)))
				`.join('\n'));
			});
			test.test('Set access returns an IR.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					{41 + 1, 42 / 2, 43 - 3}.[21];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
					(DECL <Set> $3 (SET.NEW (GET $0) (GET $1) (GET $2)))
					(DROP (SET.GET (GET $3) (INT.CONST 21)))
				`.join('\n'));
			});
			test.test('Map access returns an IR.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					{21 -> 41 + 1, 22 -> 42 / 2, 23 -> 43 - 3}.[22];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.SUB (INT.CONST 43) (INT.CONST 3)))
					(DECL <Map> $3 (MAP.NEW (INT.CONST 21)->(GET $0) (INT.CONST 22)->(GET $1) (INT.CONST 23)->(GET $2)))
					(DROP (MAP.GET (GET $3) (INT.CONST 22)))
				`.join('\n'));
			});
			test.test('nested access.', () => {
				assert.strictEqual(setupScript(`{
					[("hello", {41, 42, 43})].[0].1.[42];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <Set> $0 (SET.NEW (INT.CONST 41) (INT.CONST 42) (INT.CONST 43)))
					(DECL <tuple> $1 (TUPLE.NEW (STR.CONST "hello") (GET $0)))
					(DECL <List> $2 (LIST.NEW (GET $1)))
					(DECL <tuple> $3 (LIST.GET (GET $2) (INT.CONST 0)))
					(DECL <Set> $4 (TUPLE.GET 1 (GET $3)))
					(DROP (SET.GET (GET $4) (INT.CONST 42)))
				`.join('\n'));
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
				}`, {lower: true, build: false}).opt.print(), extract_lines`
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
				`.join('\n'));
			});
		});
		test.suite('access kind: maybe access (`a?.‹b›`).', () => {
			function maybe_access_output(
				block_n:      number,
				base_name:    string,
				result_ns:    [number, number] | [number],
				result_value: string | ((set: (value: string) => string) => string),
			): string[] {
				const block_then:       string = `block-${ block_n }`;
				const block_else:       string = `block-${ block_n + 1 }`;
				const block_endif:      string = `block-${ block_n + 2 }`;
				const result_then_name: string = `$${ result_ns[0] }`;
				const result_else_name: string = `$${ result_ns[1] ?? result_ns[0] + 1 }`;
				return extract_lines`
					if_false (ISNULL (GET ${ base_name })), goto "${ block_else }".
					"${ block_then }":
					(DECL <null> ${ result_then_name } (NULL.CONST null))
					goto "${ block_endif }".
					"${ block_else }":
					${ typeof result_value === 'string' ? `
						(DECL <${ result_value === '(NULL.CONST null)' ? 'null' : 'anything' }> ${ result_else_name } ${ result_value })
					` : result_value((value) => `
						(DECL <anything> ${ result_else_name } ${ value })
					`) }
					"${ block_endif }":
					(DROP (PHI "${ block_then }"->(GET ${ result_then_name }) "${ block_else }"->(GET ${ result_else_name })))
				`;
			}
			/* eslint-disable @stylistic/indent */
			test.test('tuple access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_tupleA: (int, int, ?:int) = (41 + 1, 42 / 2, 43 ^ 3);
					val mut my_tupleB: (int, int, ?:int) = (41 + 1, 42 / 2);
					my_tupleA?.2;
					my_tupleB?.2;
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
					(DECL <tuple> my_tupleA (TUPLE.NEW (GET $0) (GET $1) (GET $2)))
					(DECL <int> $3 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $4 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <tuple> my_tupleB (TUPLE.NEW (GET $3) (GET $4)))
				`.concat(
					...maybe_access_output(0, 'my_tupleA', [5], '(TUPLE.GET 2 (GET my_tupleA))'),
					...maybe_access_output(3, 'my_tupleB', [7], '(NULL.CONST null)'),
				).join('\n'));
			});
			test.test('record access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_recordX: (a: int, b?: int, c: int) = (a= 41 + 1, c= 42 / 2, b= 43 ^ 3);
					val mut my_recordY: (a: int, b?: int, c: int) = (a= 41 + 1, c= 42 / 2);
					my_recordX?.b;
					my_recordY?.b;
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
					(DECL <record> my_recordX (RECORD.NEW @a->(GET $0) @c->(GET $1) @b->(GET $2)))
					(DECL <int> $3 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $4 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <record> my_recordY (RECORD.NEW @a->(GET $3) @c->(GET $4)))
				`.concat(
					...maybe_access_output(0, 'my_recordX', [5], '(RECORD.GET @b (GET my_recordX))'),
					...maybe_access_output(3, 'my_recordY', [7], '(NULL.CONST null)'),
				).join('\n'));
			});
			test.test('List access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list: [int] = [41, 42];
					my_list?.[2];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <List> my_list (LIST.NEW (INT.CONST 41) (INT.CONST 42)))
				`.concat(...maybe_access_output(0, 'my_list', [0], '(LIST.GET (GET my_list) (INT.CONST 2))')).join('\n'));
			});
			test.test('Dict access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_dict: [:int] = [a= 41, c= 42];
					my_dict?.[@b];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <Dict> my_dict (DICT.NEW @a->(INT.CONST 41) @c->(INT.CONST 42)))
				`.concat(...maybe_access_output(0, 'my_dict', [0], '(DICT.GET (GET my_dict) (SYM.CONST @b))')).join('\n'));
			});
			test.test('Map access.', () => {
				assert.strictEqual(setupScript(`{
					val mut accessor: int = 22;
					{21 -> 41, 22 -> 42, 23 -> 43}?.[accessor];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <int> accessor (INT.CONST 22))
					(DECL <Map> $0 (MAP.NEW (INT.CONST 21)->(INT.CONST 41) (INT.CONST 22)->(INT.CONST 42) (INT.CONST 23)->(INT.CONST 43)))
				`.concat(...maybe_access_output(0, '$0', [1], '(MAP.GET (GET $0) (GET accessor))')).join('\n'));
			});
			test.test('union access.', () => {
				assert.strictEqual(setupScript(`{
					val mut mixed_tup: (str, bool, sym) | (a: str,  b?: bool, c?: sym) = ("hello", true, @world);
					val mut mixed_rec: (int, ?: float)  | (a: int, c?: str)            = (a= 42);
					val mut mixed_lst: [int]            | [:int]                       = [42];
					val mut mixed_dct: [int]            | [:int]                       = [a= 42];
					val mut mixed_set: {int}            | {int -> str}                 = {42};
					val mut mixed_map: {int}            | {int -> str}                 = {42 -> "hello"};
					mixed_tup?.0;    %== "hello"
					mixed_tup?.a;    %== null
					mixed_rec?.0;    %== null
					mixed_rec?.a;    %== 42
					mixed_lst?.[0];  %== 42
					mixed_dct?.[@a]; %== 42
					mixed_set?.[42]; %== true
					mixed_map?.[42]; %== "hello"
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <tuple> mixed_tup (TUPLE.NEW (STR.CONST "hello") (BOOL.CONST true) (SYM.CONST @world)))
					(DECL <record> mixed_rec (RECORD.NEW @a->(INT.CONST 42)))
					(DECL <List> mixed_lst (LIST.NEW (INT.CONST 42)))
					(DECL <Dict> mixed_dct (DICT.NEW @a->(INT.CONST 42)))
					(DECL <Set> mixed_set (SET.NEW (INT.CONST 42)))
					(DECL <Map> mixed_map (MAP.NEW (INT.CONST 42)->(STR.CONST "hello")))
				`.concat(
					...maybe_access_output(0x00, 'mixed_tup', [0x00], '(TUPLE.GET 0 (GET mixed_tup))'),
					...maybe_access_output(0x03, 'mixed_tup', [0x02], '(NULL.CONST null)'),
					...maybe_access_output(0x06, 'mixed_rec', [0x04], '(NULL.CONST null)'),
					...maybe_access_output(0x09, 'mixed_rec', [0x06], '(RECORD.GET @a (GET mixed_rec))'),
					...maybe_access_output(0x0c, 'mixed_lst', [0x08], '(LIST.GET (GET mixed_lst) (INT.CONST 0))'),
					...maybe_access_output(0x0f, 'mixed_dct', [0x0a], '(DICT.GET (GET mixed_dct) (SYM.CONST @a))'),
					...maybe_access_output(0x12, 'mixed_set', [0x0c], '(SET.GET (GET mixed_set) (INT.CONST 42))'),
					...maybe_access_output(0x15, 'mixed_map', [0x0e], '(MAP.GET (GET mixed_map) (INT.CONST 42))'),
				).join('\n'));
			});
			test.test('throws a validation error when accessor is incorrect type.', () => {
				assert.throws(() => setupScript(`{
					val mut mixed_lst: [int] | [:int] = [42];
					val mut mixed_dct: [int] | [:int] = [a= 42];
					mixed_lst?.[@a]; % \`(LIST.GET (GET mixed_lst) (SYM.CONST @a))\` is invalid
					mixed_dct?.[0];  % \`(DICT.GET (GET mixed_dct) (INT.CONST 0))\`  is invalid
				}`, {lower: true, build: false}), (err) => {
					/* eslint-enable @stylistic/indent */
					assert_instanceof(err, AggregateError);
					assertAssignable(err, {
						cons:   AggregateError,
						errors: [
							{cons: assert.AssertionError, message: 'The expression evaluated to a falsy value:\n\n  assert.ok(this.accessor.type.isSubtypeOf(TYPE.INT))\n'},
							{cons: assert.AssertionError, message: 'The expression evaluated to a falsy value:\n\n  assert.ok(this.accessor.type.isSubtypeOf(TYPE.SYM.union(TYPE.STR)))\n'},
						],
					});
					return true;
					/* eslint-disable @stylistic/indent */
				});
			});
			test.test('returns null when base is null.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list: [int]        | null = null;
					val mut my_dict: [:int]       | null = null;
					val mut my_map:  {int -> int} | null = null;
					my_list?.[2 * 2 - 3];
					my_dict?.[@b && @a];
					my_map?.[5 + 3 * 2];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <null> my_list (NULL.CONST null))
					(DECL <null> my_dict (NULL.CONST null))
					(DECL <null> my_map (NULL.CONST null))
				`.concat(
					...maybe_access_output(0, 'my_list', [0], '(NULL.CONST null)'),
					...maybe_access_output(3, 'my_dict', [2], '(NULL.CONST null)'),
					...maybe_access_output(6, 'my_map',  [4], '(NULL.CONST null)'),
				).join('\n'));
			});
			test.test('short-circuits evaluation of dynamic accessor when base is non-null.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list: [int]        | null = [42];
					val mut my_dict: [:int]       | null = [a= 42];
					val mut my_map:  {int -> int} | null = {42 -> 11};
					my_list?.[2 * 2 - 3];
					my_dict?.[@b && @a];
					my_map?.[5 + 3 * 2];
				}`, {lower: true, build: false}).opt.print(), extract_lines`
					(DECL <List> my_list (LIST.NEW (INT.CONST 42)))
					(DECL <Dict> my_dict (DICT.NEW @a->(INT.CONST 42)))
					(DECL <Map> my_map (MAP.NEW (INT.CONST 42)->(INT.CONST 11)))
				`.concat(
					...maybe_access_output(0, 'my_list', [0, 3], (set) => `
						(DECL <int> $1 (INT.MUL (INT.CONST 2) (INT.CONST 2)))
						(DECL <int> $2 (INT.SUB (GET $1) (INT.CONST 3)))
						${ set('(LIST.GET (GET my_list) (GET $2))') }
					`),
					...maybe_access_output(3, 'my_dict', [4, 8], (set) => `
						if_false (TOBOOL (SYM.CONST @b)), goto "block-7".
						"block-6":
						(DECL <sym> $5 (SYM.CONST @a))
						goto "block-8".
						"block-7":
						(DECL <sym> $6 (SYM.CONST @b))
						"block-8":
						(DECL <sym> $7 (PHI "block-6"->(GET $5) "block-7"->(GET $6)))
						${ set('(DICT.GET (GET my_dict) (GET $7))') }
					`),
					...maybe_access_output(9, 'my_map', [9, 12], (set) => `
						(DECL <int> $10 (INT.MUL (INT.CONST 3) (INT.CONST 2)))
						(DECL <int> $11 (INT.ADD (INT.CONST 5) (GET $10)))
						${ set('(MAP.GET (GET my_map) (GET $11))') }
					`),
				).join('\n'));
			});
			/* eslint-enable @stylistic/indent */
		});
	});

	test.suite('#build', () => {
		test.suite('tuple access & nesting.', () => {
			test.test('direct access.', () => {
				function tuple(builder: Builder): binaryen.ExpressionRef {
					const inner01: binaryen.ExpressionRef = builder.module.struct.new([
						buildConst(builder, 2.2),
						buildConst(builder, 3.3),
					], builder.typeBuilder.getTempHeapType(0));
					const inner0: binaryen.ExpressionRef = builder.module.struct.new([
						builder.module.local.get(0, binaryen.v128),
						inner01,
					], builder.typeBuilder.getTempHeapType(1));
					const inner10: binaryen.ExpressionRef = builder.module.struct.new([
						buildConst(builder, 4.4),
					], builder.typeBuilder.getTempHeapType(2));
					const inner11: binaryen.ExpressionRef = builder.module.struct.new([
						buildConst(builder, 5.5),
						buildConst(builder, 6.6),
					], builder.typeBuilder.getTempHeapType(3));
					const inner1: binaryen.ExpressionRef = builder.module.struct.new([
						inner10,
						inner11,
					], builder.typeBuilder.getTempHeapType(4));
					return builder.module.struct.new([
						inner0,
						inner1,
					], builder.typeBuilder.getTempHeapType(5));
				}
				return xjs.Map.forEachAggregated(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
					['.0',     (builder) => builder.module.struct.get(0, tuple(builder), builder.typeBuilder.getTempHeapType(0))],
					['.1',     (builder) => builder.module.struct.get(1, tuple(builder), builder.typeBuilder.getTempHeapType(0))],
					['.0.0',   (builder) => builder.module.struct.get(0, builder.module.struct.get(0, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(1))],
					['.0.1',   (builder) => builder.module.struct.get(1, builder.module.struct.get(0, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(1))],
					['.1.0',   (builder) => builder.module.struct.get(0, builder.module.struct.get(1, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3))],
					['.1.1',   (builder) => builder.module.struct.get(1, builder.module.struct.get(1, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3))],
					['.0.1.0', (builder) => builder.module.struct.get(0, builder.module.struct.get(1, builder.module.struct.get(0, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(1)), builder.typeBuilder.getTempHeapType(2))],
					['.0.1.1', (builder) => builder.module.struct.get(1, builder.module.struct.get(1, builder.module.struct.get(0, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(1)), builder.typeBuilder.getTempHeapType(2))],
					['.1.0.0', (builder) => builder.module.struct.get(0, builder.module.struct.get(0, builder.module.struct.get(1, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3)), builder.typeBuilder.getTempHeapType(4))],
					['.1.1.0', (builder) => builder.module.struct.get(0, builder.module.struct.get(1, builder.module.struct.get(1, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3)), builder.typeBuilder.getTempHeapType(5))],
					['.1.1.1', (builder) => builder.module.struct.get(1, builder.module.struct.get(1, builder.module.struct.get(1, tuple(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3)), builder.typeBuilder.getTempHeapType(5))],
				]), (expected_fn, access_src) => {
					const {goal, stmts} = setupScript(`{
						val mut x: float = 1.1;
						((x, (2.2, 3.3)), ((4.4,), (5.5, 6.6)))${ access_src };
					}`);
					return assertEqualBins(
						(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
						expected_fn.call(null, goal.builder),
					);
				});
			});
			test.test('pointer access.', () => {
				const {stmts, mod, tb} = setupScript(`{
					val mut tuple: ((float, (float, float)), ((float,), (float, float))) = ((1.1, (2.2, 3.3)), ((4.4,), (5.5, 6.6)));
					tuple.0;
					tuple.1;
					tuple.0.0;
					tuple.0.1;
					tuple.1.0;
					tuple.1.1;
					tuple.0.1.0;
					tuple.0.1.1;
					tuple.1.0.0;
					tuple.1.1.0;
					tuple.1.1.1;
				}`);
				const tuple: binaryen.ExpressionRef = mod.local.get(0, tb.getTempHeapType(5));
				return assertEqualBins(
					stmts.slice(1).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.build()),
					[
						mod.struct.get(0, tuple, tb.getTempHeapType(5)),
						mod.struct.get(1, tuple, tb.getTempHeapType(5)),
						mod.struct.get(0, mod.struct.get(0, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(1)),
						mod.struct.get(1, mod.struct.get(0, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(1)),
						mod.struct.get(0, mod.struct.get(1, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(4)),
						mod.struct.get(1, mod.struct.get(1, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(4)),
						mod.struct.get(0, mod.struct.get(1, mod.struct.get(0, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(1)), tb.getTempHeapType(0)),
						mod.struct.get(1, mod.struct.get(1, mod.struct.get(0, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(1)), tb.getTempHeapType(0)),
						mod.struct.get(0, mod.struct.get(0, mod.struct.get(1, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(4)), tb.getTempHeapType(2)),
						mod.struct.get(0, mod.struct.get(1, mod.struct.get(1, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(4)), tb.getTempHeapType(3)),
						mod.struct.get(1, mod.struct.get(1, mod.struct.get(1, tuple, tb.getTempHeapType(5)), tb.getTempHeapType(4)), tb.getTempHeapType(3)),
					],
				);
			});
		});

		test.suite('tuple negative index access.', () => {
			test.test('direct access.', () => {
				const {goal, stmts, mod, tb} = setupScript(`{
					val mut x: float = 1.1;
					(x, 2.2, 3.3).-2;
				}`);
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
					mod.struct.get(1, mod.struct.new([
						mod.local.get(0, binaryen.v128),
						buildConst(goal.builder, 2.2),
						buildConst(goal.builder, 3.3),
					], tb.getTempHeapType(0)), tb.getTempHeapType(0)),
				);
			});
			test.test('pointer access.', () => {
				const {stmts, mod, tb} = setupScript(`{
					val mut tuple: (float, float, float) = (4.4, 5.5, 6.6);
					tuple.-1;
				}`);
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
					mod.struct.get(2, mod.local.get(0, tb.getTempHeapType(0)), tb.getTempHeapType(0)),
				);
			});
		});

		test.suite('record access & nesting.', () => {
			test.test('direct access.', () => {
				function record(builder: Builder): binaryen.ExpressionRef {
					const inner_ab: binaryen.ExpressionRef = builder.module.block(null, [
						builder.module.local.set(1, buildConst(builder, 2.2)),
						builder.module.local.set(2, buildConst(builder, 3.3)),
						builder.module.struct.new([
							builder.module.local.get(2, binaryen.v128),
							builder.module.local.get(1, binaryen.v128),
						], builder.typeBuilder.getTempHeapType(0)),
					], builder.typeBuilder.getTempHeapType(0));
					const inner_a: binaryen.ExpressionRef = builder.module.struct.new([
						builder.module.local.get(0, binaryen.v128),
						inner_ab,
					], builder.typeBuilder.getTempHeapType(1));
					const inner_ba: binaryen.ExpressionRef = builder.module.struct.new([
						buildConst(builder, 4.4),
					], builder.typeBuilder.getTempHeapType(2));
					const inner_bb: binaryen.ExpressionRef = builder.module.block(null, [
						builder.module.local.set(3, buildConst(builder, 5.5)),
						builder.module.local.set(4, buildConst(builder, 6.6)),
						builder.module.struct.new([
							builder.module.local.get(4, binaryen.v128),
							builder.module.local.get(3, binaryen.v128),
						], builder.typeBuilder.getTempHeapType(3)),
					], builder.typeBuilder.getTempHeapType(3));
					const inner_b: binaryen.ExpressionRef = builder.module.struct.new([
						inner_ba,
						inner_bb,
					], builder.typeBuilder.getTempHeapType(4));
					return builder.module.struct.new([
						inner_a,
						inner_b,
					], builder.typeBuilder.getTempHeapType(5));
				}
				return xjs.Map.forEachAggregated(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
					['.a',     (builder) => builder.module.struct.get(0, record(builder), builder.typeBuilder.getTempHeapType(0))],
					['.b',     (builder) => builder.module.struct.get(1, record(builder), builder.typeBuilder.getTempHeapType(0))],
					['.a.a',   (builder) => builder.module.struct.get(0, builder.module.struct.get(0, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(1))],
					['.a.b',   (builder) => builder.module.struct.get(1, builder.module.struct.get(0, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(1))],
					['.b.a',   (builder) => builder.module.struct.get(0, builder.module.struct.get(1, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3))],
					['.b.b',   (builder) => builder.module.struct.get(1, builder.module.struct.get(1, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3))],
					['.a.b.b', (builder) => builder.module.struct.get(1, builder.module.struct.get(1, builder.module.struct.get(0, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(1)), builder.typeBuilder.getTempHeapType(2))],
					['.a.b.a', (builder) => builder.module.struct.get(0, builder.module.struct.get(1, builder.module.struct.get(0, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(1)), builder.typeBuilder.getTempHeapType(2))],
					['.b.a.0', (builder) => builder.module.struct.get(0, builder.module.struct.get(0, builder.module.struct.get(1, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3)), builder.typeBuilder.getTempHeapType(4))],
					['.b.b.b', (builder) => builder.module.struct.get(1, builder.module.struct.get(1, builder.module.struct.get(1, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3)), builder.typeBuilder.getTempHeapType(5))],
					['.b.b.a', (builder) => builder.module.struct.get(0, builder.module.struct.get(1, builder.module.struct.get(1, record(builder), builder.typeBuilder.getTempHeapType(0)), builder.typeBuilder.getTempHeapType(3)), builder.typeBuilder.getTempHeapType(5))],
				]), (expected_fn, access_src) => {
					const {goal, stmts} = setupScript(`{
						val mut x: float = 1.1;
						(a= (a= x, b= (b= 2.2, a= 3.3)), b= (a= (4.4,), b= (b= 5.5, a= 6.6)))${ access_src };
					}`);
					return assertEqualBins(
						(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
						expected_fn.call(null, goal.builder),
					);
				});
			});
			test.test('pointer access.', () => {
				const {stmts, mod, tb} = setupScript(`{
					val mut record: (
						a: (a: float,    b: (b: float, a: float)),
						b: (a: (float,), b: (b: float, a: float)),
					) = (
						a= (a= 1.1,    b= (b= 2.2, a= 3.3)),
						b= (a= (4.4,), b= (b= 5.5, a= 6.6)),
					);
					record.a;
					record.b;
					record.a.a;
					record.a.b;
					record.b.a;
					record.b.b;
					record.a.b.b;
					record.a.b.a;
					record.b.a.0;
					record.b.b.b;
					record.b.b.a;
				}`);
				const record: binaryen.ExpressionRef = mod.local.get(4, tb.getTempHeapType(5));
				return assertEqualBins(
					stmts.slice(1).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.build()),
					[
						mod.struct.get(0, record, tb.getTempHeapType(5)),
						mod.struct.get(1, record, tb.getTempHeapType(5)),
						mod.struct.get(0, mod.struct.get(0, record, tb.getTempHeapType(5)), tb.getTempHeapType(1)),
						mod.struct.get(1, mod.struct.get(0, record, tb.getTempHeapType(5)), tb.getTempHeapType(1)),
						mod.struct.get(0, mod.struct.get(1, record, tb.getTempHeapType(5)), tb.getTempHeapType(4)),
						mod.struct.get(1, mod.struct.get(1, record, tb.getTempHeapType(5)), tb.getTempHeapType(4)),
						mod.struct.get(1, mod.struct.get(1, mod.struct.get(0, record, tb.getTempHeapType(5)), tb.getTempHeapType(1)), tb.getTempHeapType(0)),
						mod.struct.get(0, mod.struct.get(1, mod.struct.get(0, record, tb.getTempHeapType(5)), tb.getTempHeapType(1)), tb.getTempHeapType(0)),
						mod.struct.get(0, mod.struct.get(0, mod.struct.get(1, record, tb.getTempHeapType(5)), tb.getTempHeapType(4)), tb.getTempHeapType(2)),
						mod.struct.get(1, mod.struct.get(1, mod.struct.get(1, record, tb.getTempHeapType(5)), tb.getTempHeapType(4)), tb.getTempHeapType(3)),
						mod.struct.get(0, mod.struct.get(1, mod.struct.get(1, record, tb.getTempHeapType(5)), tb.getTempHeapType(4)), tb.getTempHeapType(3)),
					],
				);
			});
			test.test('skipped key ids.', () => {
				const {goal, stmts, mod, tb} = setupScript(`{
					val mut x: bool = false;
					val mut a: int = 1;
					val mut b: int = 2;
					val mut c: int = 3;
					val mut d: int = 4;
					val mut record1: (a: bool, b: int,   d: float) = (a= x,  b= 42,  d= 4.2); % validator indices [1, 2, 4]
					val mut record2: (a: int,  c: float, d: bool)  = (a= 42, c= 4.2, d= x);   % validator indices [1, 3, 4]
					val mut record3: (c: float, b: int)            = (c= 4.2, b= 42);         % validator indices [3, 2]
					(a= x,  b= 42,  d= 4.2) .b; % canonicalized index \`1\`
					(a= 42, c= 4.2, d= x)   .c; % canonicalized index \`1\`
					(c= record1, b= record2).c; % canonicalized index \`1\`
					record1.b; % canonicalized index \`1\`
					record2.c; % canonicalized index \`1\`
					record3.c; % canonicalized index \`1\`
				}`);
				const x:       binaryen.ExpressionRef = mod.local.get(0, binaryen.v128);
				const record1: binaryen.ExpressionRef = mod.local.get(5, tb.getTempHeapType(0));
				const record2: binaryen.ExpressionRef = mod.local.get(6, tb.getTempHeapType(1));
				const record3: binaryen.ExpressionRef = mod.local.get(9, tb.getTempHeapType(2));
				const adhoc1:  binaryen.ExpressionRef = mod.struct.new([
					x,
					buildConst(goal.builder, 42n),
					buildConst(goal.builder, 4.2),
				], goal.builder.typeBuilder.getTempHeapType(3));
				const adhoc2: binaryen.ExpressionRef = mod.struct.new([
					buildConst(goal.builder, 42n),
					buildConst(goal.builder, 4.2),
					x,
				], goal.builder.typeBuilder.getTempHeapType(4));
				const adhoc3: binaryen.ExpressionRef = mod.block(null, [
					mod.local.set(10, record1),
					mod.local.set(11, record2),
					mod.struct.new([
						mod.local.get(11, tb.getTempHeapType(1)),
						mod.local.get(10, tb.getTempHeapType(0)),
					], goal.builder.typeBuilder.getTempHeapType(5)),
				], goal.builder.typeBuilder.getTempHeapType(5));
				return assertEqualBins(
					stmts.slice(8).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.build()),
					[
						mod.struct.get(1, adhoc1,  tb.getTempHeapType(3)),
						mod.struct.get(1, adhoc2,  tb.getTempHeapType(4)),
						mod.struct.get(1, adhoc3,  tb.getTempHeapType(5)),
						mod.struct.get(1, record1, tb.getTempHeapType(0)),
						mod.struct.get(1, record2, tb.getTempHeapType(1)),
						mod.struct.get(1, record3, tb.getTempHeapType(2)),
					],
				);
			});
		});
	});
});
