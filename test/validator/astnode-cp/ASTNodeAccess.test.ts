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
	CONFIG_FOLDING_OFF,
	setupScript,
	typeUnit,
	buildConst,
	singletonTuple,
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
				let     tup_fixed:   (int, float, str) = (1, 2.0, "three");
				let var tup_unfixed: (int, float, str) = (1, 2.0, "three");

				let     rec_fixed:   (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");
				let var rec_unfixed: (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");

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
						let var a:                    anything = (   10,    20);
						let var b: (int, int)       | anything = (   10,    20);
						let var c:                    anything = (x= 10, y= 20);
						let var d: (x: int, y: int) | anything = (x= 10, y= 20);

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
						let tup_a: (int, int, ?: int) = (10, 20);
						let tup_b: (int, int, ?: int) = (10, 20, 30);

						let rec_a: (x: int, y?: int, z: int) = (x= 10, z= 20);
						let rec_b: (x: int, y?: int, z: int) = (x= 10, z= 20, y= 30);

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
						let var tup: (   A,     B,       int) & (   C,  ?: D)        = ((a= "tup.0.a", c= "tup.0.c"), (b= "tup.1.b", d= "tup.1.d"), 42);
						let var rec: (x: A, y?: int, z?: B)   & (x: C,        z?: D) = (x= (a= "rec.x.a", c= "rec.x.c"), y= 42, z= (b= "rec.z.b", d= "rec.z.d"));
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
							let var collection: ((alpha: bool) | (bravo: 2 | 3 | 4)) & (bravo: 3 | 4 | 5) = (bravo= 3);
							collection.bravo; % type \`3 | 4\`
						}`, [typeUnit(3n).union(typeUnit(4n))]);
					});
				});
				test.suite('if base is a union type.', () => {
					const DECLS = `
						let var tup: (   null,     bool,     sym) | (   int, ?: float)          = (null, true, @hello);
						let var rec: (a: null, b?: bool, c?: sym) | (a: int,           c?: str) = (a= 42);
					`;
					test.test('throws when one but not all constituents are of incorrect type.', () => {
						testExprTypes(`{
							let var mixed_tup: (str, bool, sym) | (a: str,  b?: bool, c?: sym) = ("hello", true, @world);
							let var mixed_rec: (int, ?: float)  | (a: int, c?: str)            = (a= 42);

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
											{cons: TypeErrorNoEntry, message: 'Key `d` does not exist on type `(257: null, 258?: bool, 259?: sym)`.'},
											{cons: TypeErrorNoEntry, message: 'Key `d` does not exist on type `(257: int, 259?: str)`.'},
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
							let var collection: (alpha: bool, bravo: 2 | 3 | 4) & (bravo: 3 | 4 | 5, charlie: str) | () = ();
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
				let     list_fixed:   List.<     int | float | str> = [   1,    2.0,    "three"];
				let     dict_fixed:   Dict.<     int | float | str> = [a= 1, b= 2.0, c= "three"];
				let     set_fixed:    Set .<     int | float | str> = {1, 2.0, "three"};
				let     map_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				let var list_unfixed: List.<     int | float | str> = list_fixed;
				let var dict_unfixed: Dict.<     int | float | str> = dict_fixed;
				let var set_unfixed:  Set .<     int | float | str> = set_fixed;
				let var map_unfixed:  Map .<str, int | float | str> = map_fixed;
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
				let     set_mut_fixed:    Set .<     int | float | str> = {1, 2.0, "three"};
				let     map_mut_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				let var set_mut_unfixed:  Set .<     int | float | str> = set_fixed;
				let var map_mut_unfixed:  Map .<str, int | float | str> = map_fixed;

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
						let var mixed_list: List.<str | bool | sym> | Dict.<str | bool | sym> = ["hello", true, @world];
						let var mixed_dict: List.<int | float>      | Dict.<int | str>        = [a= 42];

						let var nullish_map: {int -> bool} | null = {42 -> false};

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
						let var bound1: (prop?: (bool,)) = (prop= (true,));
						let var bound2: (prop?: (?: bool)) = (prop= ());
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
						let bound1: (prop?: (bool,)) = (prop= (true,));
						let bound2: (prop?: (?: bool)) = (prop= ());
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
				let     tupo1_f: (int, float, ?: str) = (1, 2.0, "three");
				let var tupo1_u: (int, float, ?: str) = (1, 2.0, "three");
				let var tupo2_u: (int, float, ?: str) = (1, 2.0);

				let     reco1_f: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
				let var reco1_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
				let var reco2_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0);

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
						let var a:                    anything = (   10,    20);
						let var b: (int, int)       | anything = (   10,    20);
						let var c:                    anything = (x= 10, y= 20);
						let var d: (x: int, y: int) | anything = (x= 10, y= 20);

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
						let tup_a: (int, int, ?: int) = (10, 20);
						let tup_b: (int, int, ?: int) = (10, 20, 30);

						let rec_a: (x: int, y?: int, z: int) = (x= 10, z= 20);
						let rec_b: (x: int, y?: int, z: int) = (x= 10, z= 20, y= 30);

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
						let var tup: (   A,     B,       int) & (   C,  ?: D)        = ((a= "tup.0.a", c= "tup.0.c"), (b= "tup.1.b", d= "tup.1.d"), 42);
						let var rec: (x: A, y?: int, z?: B)   & (x: C,        z?: D) = (x= (a= "rec.x.a", c= "rec.x.c"), y= 42, z= (b= "rec.z.b", d= "rec.z.d"));
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
							let var collection: ((alpha: bool) | (bravo: 2 | 3 | 4)) & (bravo: 3 | 4 | 5) = (bravo= 3);
							collection?.bravo;
						}`, [TypeErrorInvalidOperation]);
					});
				});
				test.suite('if base is a union type.', () => {
					const DECLS = `
						let var tup: (   null,     bool,     sym) | (   int, ?: float)          = (null, true, @hello);
						let var rec: (a: null, b?: bool, c?: sym) | (a: int,           c?: str) = (a= 42);
					`;
					test.test('unions with null when one but not all constituents are of incorrect type.', () => {
						testExprTypes(`{
							let var mixed_tup: (str, bool, sym) | (a: str,  b?: bool, c?: sym) = ("hello", true, @world);
							let var mixed_rec: (int, ?: float)  | (a: int, c?: str)            = (a= 42);

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
											{cons: TypeErrorNoEntry, message: 'Key `d` does not exist on type `(257: null, 258?: bool, 259?: sym)`.'},
											{cons: TypeErrorNoEntry, message: 'Key `d` does not exist on type `(257: int, 259?: str)`.'},
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
							let var collection: (alpha: bool, bravo: 2 | 3 | 4) & (bravo: 3 | 4 | 5, charlie: str) | () = ();
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
				let     list_fixed:   List.<     int | float | str> = [   1,    2.0,    "three"];
				let     dict_fixed:   Dict.<     int | float | str> = [a= 1, b= 2.0, c= "three"];
				let     map_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				let var list_unfixed: List.<     int | float | str> = list_fixed;
				let var dict_unfixed: Dict.<     int | float | str> = dict_fixed;
				let var map_unfixed:  Map .<str, int | float | str> = map_fixed;
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
						let var mixed_list: List.<str | bool | sym> | Dict.<str | bool | sym> = ["hello", true, @world];
						let var mixed_dict: List.<int | float>      | Dict.<int | str>        = [a= 42];

						let var nullish_map: {int -> bool} | null = {42 -> false};

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
						let     set_fixed:   Set.<int | float | str> = {1, 2.0, "three"};
						let var set_unfixed: Set.<int | float | str> = set_fixed;

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
						let list: List.<int> | null = null;
						let dict: Dict.<int> | null = [a= 42];

						let var index: int = 0;
						let var key:   sym = @a;

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

	test.suite('#build', () => {
		const bintype2: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128]);
		const bintype3: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128, binaryen.v128]);
		const bintype6: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128, binaryen.v128, binaryen.v128, binaryen.v128, binaryen.v128]);

		test.test('tuple access.', () => {
			const BASE_SRC = '((1.1, (2.2, 3.3)), ((4.4,), (5.5, 6.6)))';

			function make_tuple(builder: Builder): binaryen.ExpressionRef {
				const inner01: binaryen.ExpressionRef = builder.module.tuple.make([
					buildConst(builder, 2.2),
					buildConst(builder, 3.3),
				]);
				const inner11: binaryen.ExpressionRef = builder.module.tuple.make([
					buildConst(builder, 5.5),
					buildConst(builder, 6.6),
				]);
				const inner0: binaryen.ExpressionRef = builder.module.tuple.make([
					buildConst(builder, 1.1),
					builder.module.tuple.extract(builder.module.local.tee(0, inner01, bintype2), 0),
					builder.module.tuple.extract(builder.module.local.get(0, bintype2), 1),
				]);
				const inner1: binaryen.ExpressionRef = builder.module.tuple.make([
					builder.module.tuple.extract(singletonTuple(builder, buildConst(builder, 4.4)), 0),
					builder.module.tuple.extract(builder.module.local.tee(2, inner11, bintype2), 0),
					builder.module.tuple.extract(builder.module.local.get(2, bintype2), 1),
				]);
				return builder.module.tuple.make([
					builder.module.tuple.extract(builder.module.local.tee(1, inner0, bintype3), 0),
					builder.module.tuple.extract(builder.module.local.get(1, bintype3), 1),
					builder.module.tuple.extract(builder.module.local.get(1, bintype3), 2),
					builder.module.tuple.extract(builder.module.local.tee(3, inner1, bintype3), 0),
					builder.module.tuple.extract(builder.module.local.get(3, bintype3), 1),
					builder.module.tuple.extract(builder.module.local.get(3, bintype3), 2),
				]);
			}
			function make_tuple_0(builder: Builder): binaryen.ExpressionRef {
				return builder.module.tuple.make([
					builder.module.tuple.extract(builder.module.local.tee(4, make_tuple(builder), bintype6), 0),
					builder.module.tuple.extract(builder.module.local.get(4, bintype6), 1),
					builder.module.tuple.extract(builder.module.local.get(4, bintype6), 2),
				]);
			}
			function make_tuple_1(builder: Builder): binaryen.ExpressionRef {
				return builder.module.tuple.make([
					builder.module.tuple.extract(builder.module.local.tee(4, make_tuple(builder), bintype6), 3),
					builder.module.tuple.extract(builder.module.local.get(4, bintype6), 4),
					builder.module.tuple.extract(builder.module.local.get(4, bintype6), 5),
				]);
			}
			function make_tuple_0_1(builder: Builder): binaryen.ExpressionRef {
				return builder.module.tuple.make([
					builder.module.tuple.extract(builder.module.local.tee(5, make_tuple_0(builder), bintype3), 1),
					builder.module.tuple.extract(builder.module.local.get(5, bintype3), 2),
				]);
			}
			function make_tuple_1_0(builder: Builder): binaryen.ExpressionRef {
				return singletonTuple(builder, builder.module.tuple.extract(make_tuple_1(builder), 0));
			}
			function make_tuple_1_1(builder: Builder): binaryen.ExpressionRef {
				return builder.module.tuple.make([
					builder.module.tuple.extract(builder.module.local.tee(5, make_tuple_1(builder), bintype3), 1),
					builder.module.tuple.extract(builder.module.local.get(5, bintype3), 2),
				]);
			}

			return xjs.Map.forEachAggregated(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
				['.0',     (builder) => make_tuple_0(builder)],
				['.1',     (builder) => make_tuple_1(builder)],
				['.0.0',   (builder) => builder.module.tuple.extract(make_tuple_0(builder), 0)],
				['.0.1',   (builder) => make_tuple_0_1(builder)],
				['.1.0',   (builder) => make_tuple_1_0(builder)],
				['.1.1',   (builder) => make_tuple_1_1(builder)],
				['.0.1.0', (builder) => builder.module.tuple.extract(make_tuple_0_1(builder), 0)],
				['.0.1.1', (builder) => builder.module.tuple.extract(make_tuple_0_1(builder), 1)],
				['.1.0.0', (builder) => builder.module.tuple.extract(make_tuple_1_0(builder), 0)],
				['.1.1.0', (builder) => builder.module.tuple.extract(make_tuple_1_1(builder), 0)],
				['.1.1.1', (builder) => builder.module.tuple.extract(make_tuple_1_1(builder), 1)],
			]), (expected_fn, access_src) => {
				const access: AST.ASTNodeAccess = AST.ASTNodeAccess.fromSource(`${ BASE_SRC }${ access_src }`, CONFIG_FOLDING_OFF);
				return assertEqualBins(
					access.build(),
					expected_fn.call(null, access.builder),
				);
			});
		});

		test.test('accessing tuple pointers.', () => {
			const {goal, stmts, mod} = setupScript(`{
				let tuple: ((float, (float, float)), ((float,), (float, float))) = ((1.1, (2.2, 3.3)), ((4.4,), (5.5, 6.6)));
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
			}`, CONFIG_FOLDING_OFF);
			let tee_idx: number = 5;
			const inner0: binaryen.ExpressionRef = mod.tuple.make([
				mod.tuple.extract(mod.local.get(4, bintype6), 0),
				mod.tuple.extract(mod.local.get(4, bintype6), 1),
				mod.tuple.extract(mod.local.get(4, bintype6), 2),
			]);
			const inner1: binaryen.ExpressionRef = mod.tuple.make([
				mod.tuple.extract(mod.local.get(4, bintype6), 3),
				mod.tuple.extract(mod.local.get(4, bintype6), 4),
				mod.tuple.extract(mod.local.get(4, bintype6), 5),
			]);
			function make_tuple_0_1(): binaryen.ExpressionRef {
				const i = tee_idx++;
				return mod.tuple.make([
					mod.tuple.extract(mod.local.tee(i, inner0, bintype3), 1),
					mod.tuple.extract(mod.local.get(i, bintype3), 2),
				]);
			}
			const inner10: binaryen.ExpressionRef = singletonTuple(goal.builder, mod.tuple.extract(inner1, 0));
			function make_tuple_1_1(): binaryen.ExpressionRef {
				const i = tee_idx++;
				return mod.tuple.make([
					mod.tuple.extract(mod.local.tee(i, inner1, bintype3), 1),
					mod.tuple.extract(mod.local.get(i, bintype3), 2),
				]);
			}
			return assertEqualBins(
				stmts.slice(1).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.build()),
				[
					inner0,
					inner1,
					mod.tuple.extract(inner0, 0),
					make_tuple_0_1(),
					inner10,
					make_tuple_1_1(),
					mod.tuple.extract(make_tuple_0_1(), 0),
					mod.tuple.extract(make_tuple_0_1(), 1),
					mod.tuple.extract(inner10, 0),
					mod.tuple.extract(make_tuple_1_1(), 0),
					mod.tuple.extract(make_tuple_1_1(), 1),
				],
			);
		});
	});
});
