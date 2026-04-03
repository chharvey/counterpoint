import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	AST,
	VALUE,
	TYPE,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
	VoidErrorOutOfBounds,
} from '../../../src/index.ts';
import {assertEqualTypes} from '../../assert-helpers.ts';
import {
	setupScript,
	typeUnit,
} from '../../helpers.ts';
import {
	extract_lines,
	repeat,
} from '../../utils.ts';



describe('ASTNodeAccess', () => {
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
		const program:    AST.ASTNodeGoal                           = AST.ASTNodeGoal.fromSource(source);
		const statements: readonly AST.ASTNodeStatementExpression[] = program.children.filter((stmt) => stmt instanceof AST.ASTNodeStatementExpression);
		program.varCheck();
		try {
			program.typeCheck();
		} catch {
			// if type-checking fails, proceed to `assert.throws` below
		}
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
		const program:    AST.ASTNodeGoal                           = AST.ASTNodeGoal.fromSource(source);
		const statements: readonly AST.ASTNodeStatementExpression[] = program.children.filter((stmt) => stmt instanceof AST.ASTNodeStatementExpression);
		program.varCheck();
		try {
			program.typeCheck();
		} catch {
			// if type-checking fails, proceed to `assert.throws` below
		}
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


	context('access kind: normal access (`a.‹b›`).', () => {
		context('when base is nullish.', () => {
			const SRCS = extract_lines`
				null.3;
				null.four;
				null.[((((),),),)];
			`;
			it('#fold: throws when base is null.', () => {
				xjs.Array.forEachAggregated(SRCS, (src, i) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), Error, `access manner: access by ${ ['index', 'key', 'expression'][i] }.`));
			});
		});

		context('access manner: by index / by key', () => {
			const SRC = `
				val     tup_fixed:   (int, float, str) = (1, 2.0, "three");
				val mut tup_unfixed: (int, float, str) = (1, 2.0, "three");

				val     rec_fixed:   (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");
				val mut rec_unfixed: (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");

				tup_fixed.0;   % type \`1\`       % value \`1\`
				tup_fixed.1;   % type \`2.0\`     % value \`2.0\`
				tup_fixed.2;   % type \`"three"\` % value \`"three"\`
				tup_unfixed.0; % type \`int\`     % non-foldable value
				tup_unfixed.1; % type \`float\`   % non-foldable value
				tup_unfixed.2; % type \`str\`     % non-foldable value

				rec_fixed.a;   % type \`1\`       % value \`1\`
				rec_fixed.b;   % type \`2.0\`     % value \`2.0\`
				rec_fixed._;   % type \`"three"\` % value \`"three"\`
				rec_unfixed.a; % type \`int\`     % non-foldable value
				rec_unfixed.b; % type \`float\`   % non-foldable value
				rec_unfixed._; % type \`str\`     % non-foldable value
			`;
			const THROWS = extract_lines`
				(1, 2.0, "three").3;
				(1, 2.0, "three").-1;
				(1, 2.0, "three").-4;
				(a= 1, b= 2.0, c= "three").d;
			`;
			describe('#fold', () => {
				it('return individual entries.', () => {
					testExprValues(SRC, [
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
				it('throws AssertionError when base is of incorrect type (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(extract_lines`
						(null, true, @hello).a;
						(a= 42).0;
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), assert.AssertionError));
				});
				it('throws when index is out of bounds / when key is out of range (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), VoidErrorOutOfBounds));
				});
			});
		});

		context('access manner: access by expression.', () => {
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
			const SRC = `
				${ DECLS }

				list_fixed.[0];      % type \`1\`       % value \`1\`
				list_fixed.[1];      % type \`2.0\`     % value \`2.0\`
				list_fixed.[2];      % type \`"three"\` % value \`"three"\`
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
				list_unfixed.[2];      % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@a];     % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@b];     % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@c];     % type \`int | float | str\` % non-foldable value
				set_unfixed.[1];       % type \`bool\`              % non-foldable value
				set_unfixed.[2.0];     % type \`bool\`              % non-foldable value
				set_unfixed.["three"]; % type \`bool\`              % non-foldable value
				map_unfixed.["a"];     % type \`int | float | str\` % non-foldable value
				map_unfixed.["b"];     % type \`int | float | str\` % non-foldable value
				map_unfixed.["c"];     % type \`int | float | str\` % non-foldable value
			`;
			const ERRS = `
				${ DECLS }

				list_fixed.[3];    % type \`never\`             % fold throws VoidError
				list_fixed.[-4];   % type \`never\`             % fold throws VoidError
				dict_fixed.[@d];   % type \`never\`             % fold throws VoidError
				list_unfixed.[3];  % type \`int | float | str\` % non-foldable value
				list_unfixed.[-4]; % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@d]; % type \`int | float | str\` % non-foldable value
			`;
			const ALLOWS = `
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
			`;
			describe('#fold', () => {
				it('returns individual entries for folded objects.', () => {
					testExprValues(SRC, [
						...TEST_VALUES,
						...TEST_VALUES,
						...repeat(VALUE.TRUE, 3),
						...TEST_VALUES,

						...repeat(null, 12),
					]);
				});
				it('for Lists/Dicts: when accessor expression is out of bounds/range, throws for folded objects, returns null for unfolded objects.', () => {
					testExprValues(ERRS, [
						...repeat(VoidErrorOutOfBounds, 3),
						...repeat(null, 3),
					]);
				});
				it('for Sets/Maps: when expression is correct type but out of range or incorrect type, returns `null` value for folded objects, returns native null for unfolded objects.', () => {
					testExprValues(ALLOWS, repeat([
						VALUE.FALSE,
						VALUE.NULL,
						...repeat(null, 2),
					], 4).flat());
				});
			});
		});
	});


	context('access kind: maybe access (`a?.‹b›`).', () => {
		context('when base is nullish.', () => {
			const SRC = `
				null?.3;
				null?.four;
				null?.[((((),),),)];
			`;
			describe('#fold', () => {
				it('returns base when it is null.', () => {
					testExprValues(SRC, repeat(VALUE.NULL, 3));
				});
				it('chained maybe access.', () => {
					const prop1 = new VALUE.Tuple([VALUE.TRUE]); // (true,)
					const prop2 = new VALUE.Tuple();             // ()
					return testExprValues(`
						val bound1: (prop?: (bool,)) = (prop= (true,));
						val bound2: (prop?: (?: bool)) = (prop= ());
						bound1;
						bound1?.prop;
						bound1?.prop?.0;
						bound2;
						bound2?.prop;
					`, [
						new VALUE.Record(new Map([[0x100n, prop1]])), // (prop= (true,))
						prop1,                                        // (true,)
						VALUE.TRUE,                                   // true
						new VALUE.Record(new Map([[0x100n, prop2]])), // (prop= ())
						prop2,                                        // ()
					]);
				});
				it('maybe access of non-existent value returns null (bypassing type-checking).', () => {
					assert.strictEqual(
						AST.ASTNodeAccess.fromSource('(prop= ()).prop?.0;').fold(),
						VALUE.NULL,
					);
				});
			});
		});

		context('access manner: access by index / by key.', () => {
			const SRC = `
				val     tupo1_f: (int, float, ?: str) = (1, 2.0, "three");
				val mut tupo1_u: (int, float, ?: str) = (1, 2.0, "three");
				val mut tupo2_u: (int, float, ?: str) = (1, 2.0);

				val     reco1_f: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
				val mut reco1_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0, b= "three");
				val mut reco2_u: (a: int, c: float, b?: str) = (a= 1, c= 2.0);

				tupo1_f?.2; % type \`"three"\` % value \`"three"\`
				tupo1_u?.2; % type \`str?\`    % non-foldable value
				tupo2_u?.2; % type \`str?\`    % non-foldable value

				reco1_f?.b; % type \`"three"\` % value \`"three"\`
				reco1_u?.b; % type \`str?\`    % non-foldable value
				reco2_u?.b; % type \`str?\`    % non-foldable value
			`;
			const THROWS = extract_lines`
				(1, 2.0, "three")?.3;
				(1, 2.0, "three")?.-4;
				(a= 1, b= 2.0, c= "three")?.d;
			`;
			describe('#fold', () => {
				it('returns folded values as normal.', () => {
					testExprValues(SRC, [
						new VALUE.String('three'),
						...repeat(null, 2),

						new VALUE.String('three'),
						...repeat(null, 2),
					]);
				});
				it('throws AssertionError when base is of incorrect type (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(extract_lines`
						(null, true, @hello)?.a;
						(a= 42)?.0;
					`, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), assert.AssertionError));
				});
				it('returns null when index is out of bounds / when key is out of range (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.strictEqual(AST.ASTNodeAccess.fromSource(src).fold(), VALUE.NULL));
				});
			});
		});

		context('access manner: access by expression.', () => {
			const DECLS = `
				val     list_fixed:   List.<     int | float | str> = [   1,    2.0,    "three"];
				val     dict_fixed:   Dict.<     int | float | str> = [a= 1, b= 2.0, c= "three"];
				val     map_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				val mut list_unfixed: List.<     int | float | str> = list_fixed;
				val mut dict_unfixed: Dict.<     int | float | str> = dict_fixed;
				val mut map_unfixed:  Map .<str, int | float | str> = map_fixed;
			`;
			const SRC = `
				${ DECLS }

				list_fixed?.[0];  % type \`1\`       % value \`1\`
				list_fixed?.[1];  % type \`2.0\`     % value \`2.0\`
				list_fixed?.[2];  % type \`"three"\` % value \`"three"\`
				dict_fixed?.[@a]; % type \`1\`       % value \`1\`
				dict_fixed?.[@b]; % type \`2.0\`     % value \`2.0\`
				dict_fixed?.[@c]; % type \`"three"\` % value \`"three"\`
				map_fixed?.["a"]; % type \`1\`       % value \`1\`
				map_fixed?.["b"]; % type \`2.0\`     % value \`2.0\`
				map_fixed?.["c"]; % type \`"three"\` % value \`"three"\`

				list_unfixed?.[0];  % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[1];  % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[2];  % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@a]; % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@b]; % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@c]; % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["a"]; % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["b"]; % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["c"]; % type \`int | float | str | null\` % non-foldable value
			`;
			const ERRS = `
				${ DECLS }

				list_fixed?.[3];  % type \`null\`  % value \`null\`
				list_fixed?.[-4]; % type \`null\`  % value \`null\`
				dict_fixed?.[@d]; % type \`null\`  % value \`null\`
				map_fixed?.["d"]; % type \`null\`  % value \`null\`

				list_unfixed?.[3];  % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[-4]; % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@d]; % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["d"]; % type \`int | float | str | null\` % non-foldable value
			`;
			describe('#fold', () => {
				it('short-circuits evaluation of accessor expression when base is null.', () => {
					testExprValues(`
						val list: List.<int> | null = null;
						val dict: Dict.<int> | null = [a= 42];

						val mut index: int = 0;
						val mut key:   sym = @a;

						list?.[index]; % value \`null\`     (\`index\` is never attempted to be folded because \`list\` is null)
						dict?.[key];   % non-foldable value (\`key\` is attempted to be folded because \`dict\` is not null)
					`, [
						VALUE.NULL,
						null,
					]);
				});
				it('returns individual entries for folded objects.', () => {
					testExprValues(SRC, [
						...TEST_VALUES,
						...TEST_VALUES,
						...TEST_VALUES,

						...repeat(null, 9),
					]);
				});
				it('when accessor expression is out of bounds/range, returns the `null` value for folded objects, returns null for unfolded objects.', () => {
					testExprValues(ERRS, [
						...repeat(VALUE.NULL, 4),
						...repeat(null, 4),
					]);
				});
			});
		});
	});



	it('access kind: result access (`a!.‹b›`) is unsupported.', () => { // TODO: v0.5.0
		assert.throws(() => AST.ASTNodeAccess.fromSource('(42,)!.0;'), TypeError);
	});



	describe('#type', () => {
		describe('when base is null.', () => {
			it('normal access throws.', () => {
				testExprTypes(`
					null.3;
					null.four;
					null.[((((),),),)];
				`, repeat(TypeErrorInvalidOperation, 3));
			});
			it('maybe access returns null.', () => {
				testExprTypes(`
					null?.3;
					null?.four;
					null?.[((((),),),)];
				`, repeat(TYPE.NULL, 3));
			});
			it('chained maybe access.', () => {
				const prop1: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL]);       // (bool,)
				const prop2 = new TYPE.Tuple([{type: TYPE.BOOL, optional: true}]); // (?: bool)
				return testExprTypes(`
					val mut bound1: (prop?: (bool,)) = (prop= (true,));
					val mut bound2: (prop?: (?: bool)) = (prop= ());
					bound1;
					bound1?.prop;
					bound1?.prop?.0;
					bound2;
					bound2?.prop;
					bound2?.prop?.0;
				`, [
					new TYPE.Record(new Map([[0x100n, {type: prop1, optional: true}]])), // (prop?: (bool,))
					prop1.union(TYPE.NULL),                                              // (bool,) | null
					TYPE.BOOL.union(TYPE.NULL),                                          // bool | null
					new TYPE.Record(new Map([[0x100n, {type: prop2, optional: true}]])), // (prop?: (?: bool))
					prop2.union(TYPE.NULL),                                              // (?: bool) | null
					TYPE.BOOL.union(TYPE.NULL),                                          // bool | null
				]);
			});
		});


		context('access manner: by index / by key', () => {
			describe('simple base types.', () => {
				it('entry is not optional and base is not nullish.', () => {
					testExprTypes(`
						val     tup_fixed:   (int, float, str) = (1, 2.0, "three");
						val mut tup_unfixed: (int, float, str) = (1, 2.0, "three");

						val     rec_fixed:   (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");
						val mut rec_unfixed: (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");

						tup_fixed.0;    % type \`1\`
						tup_fixed.1;    % type \`2.0\`
						tup_fixed.2;    % type \`"three"\`
						tup_unfixed.0;  % type \`int\`
						tup_unfixed.1;  % type \`float\`
						tup_unfixed.2;  % type \`str\`

						rec_fixed.a;   % type \`1\`
						rec_fixed.b;   % type \`2.0\`
						rec_fixed._;   % type \`"three"\`
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
					`, [
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

						...repeat(TypeErrorInvalidOperation, 4),
					]);
				});
				it('entry is optional.', () => {
					testExprTypes(`
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

						tupo1_f?.2; % type \`"three"\`
						tupo1_u?.2; % type \`str?\`
						tupo2_u?.2; % type \`str?\`

						reco1_f?.b; % type \`"three"\`
						reco1_u?.b; % type \`str?\`
						reco2_u?.b; % type \`str?\`
					`, [
						...repeat(TypeErrorInvalidOperation, 4),

						typeUnit('three'),
						...repeat(TYPE.STR.union(TYPE.NULL), 2),

						typeUnit('three'),
						...repeat(TYPE.STR.union(TYPE.NULL), 2),
					]);
				});
				it('throws when base object is of incorrect type.', () => {
					testExprTypes(`
						val mut a:                    unknown = (   10,    20);
						val mut b: (int, int)       | unknown = (   10,    20);
						val mut c:                    unknown = (x= 10, y= 20);
						val mut d: (x: int, y: int) | unknown = (x= 10, y= 20);

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
					`, repeat(TypeErrorNoEntry, 16));
				});
				it('throws when index is out of bounds / when key is out of range.', () => {
					testExprTypes(`
						(1, 2.0, "three").3;
						(1, 2.0, "three").-4;
						(a= 1, b= 2.0, c= "three").d;
						(1, 2.0, "three")?.3;
						(1, 2.0, "three")?.-4;
						(a= 1, b= 2.0, c= "three")?.d;
					`, repeat(TypeErrorNoEntry, 6));
				});
			});

			describe('intersection base types.', () => {
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
				it('every constituent has the entry and it’s required in some constituent.', () => {
					testExprTypes(`
						${ DECLS }
						tup.0;  % required & required % type \`A & C\`
						rec.x;  % required & required % type \`A & C\`
						tup.1;  % required & optional % type \`B & D\`
						tup?.0; % required & required
						rec?.x; % required & required
						tup?.1; % required & optional
					`, [
						...repeat(A.intersect(C), 2),
						B.intersect(D),
						...repeat(TypeErrorInvalidOperation, 3),
					]);
				});
				it('every constituent has the entry and it’s optional in every constituent.', () => {
					testExprTypes(`
						${ DECLS }
						rec.z;  % optional & optional
						rec?.z; % optional & optional % type \`B & D | null\`
					`, [
						TypeErrorInvalidOperation,
						B.intersect(D).union(TYPE.NULL),
					]);
				});
				it('some constituent does not have the entry.', () => {
					testExprTypes(`
						${ DECLS }
						tup.2;  % required & missing
						tup.3;  % missing  & missing
						rec.y;  % optional & missing
						tup?.2; % required & missing
						tup?.3; % missing  & missing
						rec?.y; % optional & missing
					`, [
						TYPE.INT,
						AggregateError,
						TypeErrorInvalidOperation,
						TypeErrorInvalidOperation,
						AggregateError,
						TYPE.INT.union(TYPE.NULL),
					]);
				});
				it('an intersection with union constituents.', () => {
					testExprTypes(`
						val mut collectionA: ((alpha: bool, bravo: 1) | (bravo: 2 | 3 | 4)) & (bravo: 3 | 4 | 5) = (bravo= 3);
						val mut collectionB: ((alpha: bool, bravo?: 1) | (bravo?: 2 | 3 | 4)) & (bravo?: 3 | 4 | 5) = (alpha= true);
						collectionA.bravo;  % type \`3 | 4\`
						collectionB?.bravo; % type \`3 | 4 | null\`
					`, [
						typeUnit(3n).union(typeUnit(4n)),
						typeUnit(3n).union(typeUnit(4n).union(TYPE.NULL)),
					]);
				});
			});

			describe('union base types.', () => {
				const DECLS = `
					val mut tup: (   null,     bool,     sym) | (   int, ?: float)          = (null, true, @hello);
					val mut rec: (a: null, b?: bool, c?: sym) | (a: int,           c?: str) = (a= 42);
				`;
				it('throws when some constituent is of incorrect type.', () => { // test only needed for unions (invalid for intersections)
					testExprTypes(`
						val mut mixed_tup: (str, bool, sym) | (a: str,  b?: bool, c?: sym) = ("hello", true, @world);
						val mut mixed_rec: (int, ?: float)  | (a: int, c?: str)            = (a= 42);

						mixed_tup.a;
						mixed_rec.0;
						mixed_tup?.a;
						mixed_rec?.0;
					`, repeat(TypeErrorInvalidOperation, 4));
				});
				it('every constituent has the entry and it’s required in every constituent.', () => {
					testExprTypes(`
						${ DECLS }
						tup.0; % type \`null | int\`
						rec.a; % type \`null | int\`
						tup?.0;
						rec?.a;
					`, [
						...repeat(TYPE.NULL.union(TYPE.INT), 2),
						...repeat(TypeErrorInvalidOperation, 2),
					]);
				});
				it('every constituent has the entry and it’s optional in some constituent.', () => {
					testExprTypes(`
						${ DECLS }
						tup.1;  % required | optional
						rec.c;  % optional | optional
						tup?.1; % required | optional % type \`bool | float | null\`
						rec?.c; % optional | optional % type \`sym  | str   | null\`
					`, [
						...repeat(TypeErrorInvalidOperation, 2),
						TYPE.Union.all(TYPE.BOOL, TYPE.FLOAT, TYPE.NULL),
						TYPE.Union.all(TYPE.SYM,  TYPE.STR,   TYPE.NULL),
					]);
				});
				it('some constituent does not have the entry.', () => {
					testExprTypes(`
						${ DECLS }
						tup.2;  % required | missing
						rec.b;  % optional | missing
						tup?.2; % required | missing
						rec?.b; % optional | missing
					`, repeat(TypeErrorNoEntry, 4));
				});
				it('a union with intersection constituents.', () => {
					testExprTypes(`
						val mut collectionA: (alpha: bool, bravo: 2 | 3 | 4) & (bravo: 3 | 4 | 5, charlie: str) | (bravo: 6) = (bravo= 6);
						val mut collectionB: (alpha: bool, bravo?: 2 | 3 | 4) & (bravo?: 3 | 4 | 5, charlie: str) | (bravo?: 6) = (bravo= 6);
						collectionA.bravo;  % type \`3 | 4 | 6\`
						collectionB?.bravo; % type \`3 | 4 | 6 | null\`
					`, [
						typeUnit(3n).union(typeUnit(4n)).union(typeUnit(6n)),
						// FIXME: compiler thinks `(alpha: bool, bravo?: 2 | 3 | 4) & (bravo?: 3 | 4 | 5, charlie: str)`
						// is a subtype of `(bravo?: 6)`, therefore returning type `6 | null`
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
						typeUnit(6n).union(TYPE.NULL) ??
						typeUnit(3n).union(typeUnit(4n)).union(typeUnit(6n)).union(TYPE.NULL),
					]);
				});
			});
		});

		context('access manner: access by expression.', () => {
			const TYPE_INT_FLOAT_STR      = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR);
			const TYPE_INT_FLOAT_STR_NULL = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR, TYPE.NULL);
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
			it('returns individual entry types for folded objects, union types for unfolded objects.', () => {
				const N_TYPES = [
					typeUnit(1n),
					typeUnit(2.0),
					typeUnit('three'),
				] as const;
				return testExprTypes(`
					${ DECLS }

					list_fixed.[0];      % type \`1\`
					list_fixed.[1];      % type \`2.0\`
					list_fixed.[2];      % type \`"three"\`
					dict_fixed.[@a];     % type \`1\`
					dict_fixed.[@b];     % type \`2.0\`
					dict_fixed.[@c];     % type \`"three"\`
					set_fixed.[1];       % type \`true\`
					set_fixed.[2.0];     % type \`true\`
					set_fixed.["three"]; % type \`true\`
					map_fixed.["a"];     % type \`1\`
					map_fixed.["b"];     % type \`2.0\`
					map_fixed.["c"];     % type \`"three"\`

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

					list_fixed?.[0];  % type \`1\`
					list_fixed?.[1];  % type \`2.0\`
					list_fixed?.[2];  % type \`"three"\`
					dict_fixed?.[@a]; % type \`1\`
					dict_fixed?.[@b]; % type \`2.0\`
					dict_fixed?.[@c]; % type \`"three"\`
					map_fixed?.["a"]; % type \`1\`
					map_fixed?.["b"]; % type \`2.0\`
					map_fixed?.["c"]; % type \`"three"\`

					list_unfixed?.[0];  % type \`int | float | str | null\`
					list_unfixed?.[1];  % type \`int | float | str | null\`
					list_unfixed?.[2];  % type \`int | float | str | null\`
					dict_unfixed?.[@a]; % type \`int | float | str | null\`
					dict_unfixed?.[@b]; % type \`int | float | str | null\`
					dict_unfixed?.[@c]; % type \`int | float | str | null\`
					map_unfixed?.["a"]; % type \`int | float | str | null\`
					map_unfixed?.["b"]; % type \`int | float | str | null\`
					map_unfixed?.["c"]; % type \`int | float | str | null\`
				`, [
					...N_TYPES,
					...N_TYPES,
					...repeat(TYPE.TRUE, 3),
					...N_TYPES,

					...repeat(TYPE_INT_FLOAT_STR, 6),
					...repeat(TYPE.BOOL, 3),
					...repeat(TYPE_INT_FLOAT_STR, 3),

					...N_TYPES,
					...N_TYPES,
					...N_TYPES,

					...repeat(TYPE_INT_FLOAT_STR_NULL, 9),
				]);
			});
			it('unsupported: throws for string access of dict.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('[a= 10, b= 20, c= 30].["a"];').type(), /String keys for dict access are not yet supported\./);
			});
			it('throws when base object is of incorrect type.', () => {
				testExprTypes(`
					(4).[2];
					(10, 20, 30).[1];
					(a= 10, b= 20, c= 30).[@b];
				`, repeat(TypeErrorInvalidOperation, 3));
				testExprTypes(`
					(4)?.[2];
					(10, 20, 30)?.[1];
					(a= 10, b= 20, c= 30)?.[@b];
					Set.<int>((10, 20, 30))?.[20];
					{10, 20, 30}?.[20];
				`, repeat(TypeErrorInvalidOperation, 5));
				return testExprTypes(`
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
				`, repeat(TypeErrorInvalidOperation, 8));
			});
			it('throws when constituents are of different types (allowing null).', () => {
				testExprTypes(`
					val mut mixed_list: List.<str | bool | sym> | Dict.<str | bool | sym> = ["hello", true, @world];
					val mut mixed_dict: List.<int | float>      | Dict.<int | str>        = [a= 42];

					val mut mixed_set:   {int} | {int -> int} = {42, 43};
					val mut mixed_map:   {int} | {int -> int} = {42 -> 43};
					val mut nullish_map: {int -> bool} | null = {42 -> false};

					mixed_list.[@a];
					mixed_dict.[0];

					mixed_set.[21];
					mixed_map.[21];
					nullish_map.[42];

					mixed_list?.[@a];
					mixed_dict?.[0];

					mixed_set?.[21];
					mixed_map?.[21];
					nullish_map?.[42]; % type \`bool | null\`
				`, [
					...repeat(TypeErrorInvalidOperation, 9),
					TYPE.BOOL.union(TYPE.NULL),
				]);
			});
			it('for Lists/Dicts/Maps: when accessor expression is correct type but out of bounds/range, returns `never`/`null` for folded objects, returns union type for unfolded objects.', () => {
				testExprTypes(`
					${ DECLS }

					list_fixed.[3];    % type \`never\`
					list_fixed.[-4];   % type \`never\`
					dict_fixed.[@d];   % type \`never\`

					list_unfixed.[3];  % type \`int | float | str\`
					list_unfixed.[-4]; % type \`int | float | str\`
					dict_unfixed.[@d]; % type \`int | float | str\`

					list_fixed?.[3];  % type \`null\`
					list_fixed?.[-4]; % type \`null\`
					dict_fixed?.[@d]; % type \`null\`

					list_unfixed?.[3];  % type \`int | float | str | null\`
					list_unfixed?.[-4]; % type \`int | float | str | null\`
					dict_unfixed?.[@d]; % type \`int | float | str | null\`
				`, [
					...repeat(TYPE.NEVER, 3),
					...repeat(TYPE_INT_FLOAT_STR, 3),
					...repeat(TYPE.NULL, 3),
					...repeat(TYPE_INT_FLOAT_STR_NULL, 3),
				]);
			});
			it('for Lists/Dicts: throws when accessor expression is of incorrect type.', () => {
				testExprTypes(`
					[1, 2.0, "three"].["3"];
					[a= 1, b= 2.0, c= "three"].[3];
					[1, 2.0, "three"]?.["3"];
					[a= 1, b= 2.0, c= "three"]?.[3];
				`, repeat(TypeErrorNotNarrow, 4));
			});
			it('for Sets/Maps: when expression is correct type but out of range or incorrect type, returns entry type.', () => {
				testExprTypes(`
					${ DECLS }
					val     set_mut_fixed:   Set .<     int | float | str> = {1, 2.0, "three"};
					val     map_mut_fixed:   Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
					val mut set_mut_unfixed: Set .<     int | float | str> = set_fixed;
					val mut map_mut_unfixed: Map .<str, int | float | str> = map_fixed;

					% correct type, but out of range
					set_fixed      .[42.0]; % type \`false\`
					map_fixed      .["d"];  % type \`null\`
					set_unfixed    .[42.0]; % type \`bool\`
					map_unfixed    .["d"];  % type \`int | float | str\`
					set_mut_fixed  .[42.0]; % type \`false\`
					map_mut_fixed  .["d"];  % type \`null\`
					set_mut_unfixed.[42.0]; % type \`bool\`
					map_mut_unfixed.["d"];  % type \`int | float | str\`

					map_fixed      ?.["d"];  % type \`null\`
					map_unfixed    ?.["d"];  % type \`int | float | str | null\`
					map_mut_fixed  ?.["d"];  % type \`null\`
					map_mut_unfixed?.["d"];  % type \`int | float | str | null\`

					% incorrect type
					set_fixed      .[true]; % type \`false\`
					map_fixed      .[true]; % type \`null\`
					set_unfixed    .[true]; % type \`bool\`
					map_unfixed    .[true]; % type \`int | float | str\`
					set_mut_fixed  .[true]; % type \`false\`
					map_mut_fixed  .[true]; % type \`null\`
					set_mut_unfixed.[true]; % type \`bool\`
					map_mut_unfixed.[true]; % type \`int | float | str\`

					map_fixed      ?.[true]; % type \`null\`
					map_unfixed    ?.[true]; % type \`int | float | str | null\`
					map_mut_fixed  ?.[true]; % type \`null\`
					map_mut_unfixed?.[true]; % type \`int | float | str | null\`
					`, [
					...repeat([
						TYPE.FALSE,
						TYPE.NULL,
						TYPE.BOOL,
						TYPE_INT_FLOAT_STR,
					], 2).flat(),
					TYPE.NULL,
					TYPE_INT_FLOAT_STR_NULL,
					TYPE.NULL,
					TYPE_INT_FLOAT_STR_NULL,
					...repeat([
						TYPE.FALSE,
						TYPE.NULL,
						TYPE.BOOL,
						TYPE_INT_FLOAT_STR,
					], 2).flat(),
					TYPE.NULL,
					TYPE_INT_FLOAT_STR_NULL,
					TYPE.NULL,
					TYPE_INT_FLOAT_STR_NULL,
				]);
			});
		});
	});



	describe('#lower', () => {
		describe('access kind: normal access (`a.‹b›`).', () => {
			it('tuple access returns an IR.TupleGet.', () => {
				assert.strictEqual(setupScript(`{
					(41 + 1, 42 / 2, 43 - 3).1;
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (NEG (INT.CONST 3)))
					(DECL <int> $3 (INT.ADD (INT.CONST 43) (GET $2)))
					(DECL <tuple> $4 (TUPLE.NEW (GET $0) (GET $1) (GET $3)))
					(DROP (TUPLE.GET 1 (GET $4)))
				`.join('\n'));
			});
			it('record access returns an IR.RecordGet.', () => {
				assert.strictEqual(setupScript(`{
					(a= 41 + 1, b= 42 / 2, c= 43 - 3).b;
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (NEG (INT.CONST 3)))
					(DECL <int> $3 (INT.ADD (INT.CONST 43) (GET $2)))
					(DECL <record> $4 (RECORD.NEW @a->(GET $0) @b->(GET $1) @c->(GET $3)))
					(DROP (RECORD.GET @b (GET $4)))
				`.join('\n'));
			});
			it('List access returns an IR.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					[41 + 1, 42 / 2, 43 - 3].[1];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (NEG (INT.CONST 3)))
					(DECL <int> $3 (INT.ADD (INT.CONST 43) (GET $2)))
					(DECL <List> $4 (LIST.NEW (GET $0) (GET $1) (GET $3)))
					(DROP (LIST.GET (GET $4) (INT.CONST 1)))
				`.join('\n'));
			});
			it('Dict access returns an IR.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					[a= 41 + 1, b= 42 / 2, c= 43 - 3].[@b];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (NEG (INT.CONST 3)))
					(DECL <int> $3 (INT.ADD (INT.CONST 43) (GET $2)))
					(DECL <Dict> $4 (DICT.NEW @a->(GET $0) @b->(GET $1) @c->(GET $3)))
					(DROP (DICT.GET (GET $4) (SYM.CONST @b)))
				`.join('\n'));
			});
			it('Set access returns an IR.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					{41 + 1, 42 / 2, 43 - 3}.[21];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (NEG (INT.CONST 3)))
					(DECL <int> $3 (INT.ADD (INT.CONST 43) (GET $2)))
					(DECL <Set> $4 (SET.NEW (GET $0) (GET $1) (GET $3)))
					(DROP (SET.GET (GET $4) (INT.CONST 21)))
				`.join('\n'));
			});
			it('Map access returns an IR.CollectionDynamicGet.', () => {
				assert.strictEqual(setupScript(`{
					{21 -> 41 + 1, 22 -> 42 / 2, 23 -> 43 - 3}.[22];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (NEG (INT.CONST 3)))
					(DECL <int> $3 (INT.ADD (INT.CONST 43) (GET $2)))
					(DECL <Map> $4 (MAP.NEW (INT.CONST 21)->(GET $0) (INT.CONST 22)->(GET $1) (INT.CONST 23)->(GET $3)))
					(DROP (MAP.GET (GET $4) (INT.CONST 22)))
				`.join('\n'));
			});
			it('nested access.', () => {
				assert.strictEqual(setupScript(`{
					[("hello", {41, 42, 43})].[0].1.[42];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <Set> $0 (SET.NEW (INT.CONST 41) (INT.CONST 42) (INT.CONST 43)))
					(DECL <tuple> $1 (TUPLE.NEW (STR.CONST "hello") (GET $0)))
					(DECL <List> $2 (LIST.NEW (GET $1)))
					(DECL <tuple> $3 (LIST.GET (GET $2) (INT.CONST 0)))
					(DECL <Set> $4 (TUPLE.GET 1 (GET $3)))
					(DROP (SET.GET (GET $4) (INT.CONST 42)))
				`.join('\n'));
			});
			it('union access.', () => {
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
				}`, {lower: true}).opt.print(), extract_lines`
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
		describe('access kind: maybe access (`a?.‹b›`).', () => {
			function maybe_access_output(
				block_n:      number,
				base_name:    string,
				result_ns:    [number, number] | [number],
				result_value: string | ((decl: (value: string) => string) => string),
			): string[] {
				const block_then:       string = `block-${ block_n }`;
				const block_else:       string = `block-${ block_n + 1 }`;
				const block_endif:      string = `block-${ block_n + 2 }`;
				const result_then_name: string = `$${ result_ns[0] }`;
				const result_else_name: string = `$${ result_ns[1] ?? result_ns[0] + 1 }`;
				function decl_result(res_name: string, res_val: string = '(NULL.CONST null)'): string {
					return `(DECL <${ res_val === '(NULL.CONST null)' ? 'null' : 'anything' }> ${ res_name } ${ res_val })`;
				}
				return extract_lines`
					if_false (ISNULL (GET ${ base_name })), goto "${ block_else }".
					"${ block_then }":
					${ decl_result(result_then_name) }
					goto "${ block_endif }".
					"${ block_else }":
					${ typeof result_value === 'string'
						? decl_result(result_else_name, result_value)
						: result_value((value) => decl_result(result_else_name, value)) }
					"${ block_endif }":
					(DROP (PHI "${ block_then }"->(GET ${ result_then_name }) "${ block_else }"->(GET ${ result_else_name })))
				`;
			}
			/* eslint-disable @stylistic/indent */
			it('tuple access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_tupleA: (int, int, ?:int) = (41 + 1, 42 / 2, 43 ^ 3);
					val mut my_tupleB: (int, int, ?:int) = (41 + 1, 42 / 2);
					my_tupleA?.2;
					my_tupleB?.2;
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
					(DECL <tuple> my_tupleA (TUPLE.NEW (GET $0) (GET $1) (GET $2)))
					(DECL <int> $3 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $4 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <tuple> my_tupleB (TUPLE.NEW (GET $3) (GET $4)))
				`.concat(
					...maybe_access_output(0, 'my_tupleA', [5], '(TUPLE.GET 2 (GET my_tupleA))'),
					...maybe_access_output(3, 'my_tupleB', [7], (decl) => `
						(DROP (GET my_tupleB))
						${ decl('(NULL.CONST null)') }
					`),
				).join('\n'));
			});
			it('record access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_recordX: (a: int, b?: int, c: int) = (a= 41 + 1, c= 42 / 2, b= 43 ^ 3);
					val mut my_recordY: (a: int, b?: int, c: int) = (a= 41 + 1, c= 42 / 2);
					my_recordX?.b;
					my_recordY?.b;
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
					(DECL <record> my_recordX (RECORD.NEW @a->(GET $0) @c->(GET $1) @b->(GET $2)))
					(DECL <int> $3 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $4 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <record> my_recordY (RECORD.NEW @a->(GET $3) @c->(GET $4)))
				`.concat(
					...maybe_access_output(0, 'my_recordX', [5], '(RECORD.GET @b (GET my_recordX))'),
					...maybe_access_output(3, 'my_recordY', [7], (decl) => `
						(DROP (GET my_recordY))
						${ decl('(NULL.CONST null)') }
					`),
				).join('\n'));
			});
			it('List access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list: [int] = [41, 42];
					my_list?.[2];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <List> my_list (LIST.NEW (INT.CONST 41) (INT.CONST 42)))
				`.concat(...maybe_access_output(0, 'my_list', [0], '(LIST.GET (GET my_list) (INT.CONST 2))')).join('\n'));
			});
			it('Dict access.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_dict: [:int] = [a= 41, c= 42];
					my_dict?.[@b];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <Dict> my_dict (DICT.NEW @a->(INT.CONST 41) @c->(INT.CONST 42)))
				`.concat(...maybe_access_output(0, 'my_dict', [0], '(DICT.GET (GET my_dict) (SYM.CONST @b))')).join('\n'));
			});
			it('Map access.', () => {
				assert.strictEqual(setupScript(`{
					val mut accessor: int = 22;
					{21 -> 41, 22 -> 42, 23 -> 43}?.[accessor];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <int> accessor (INT.CONST 22))
					(DECL <Map> $0 (MAP.NEW (INT.CONST 21)->(INT.CONST 41) (INT.CONST 22)->(INT.CONST 42) (INT.CONST 23)->(INT.CONST 43)))
				`.concat(...maybe_access_output(0, '$0', [1], '(MAP.GET (GET $0) (GET accessor))')).join('\n'));
			});
			it('returns null when base is null.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_tup:  (int, bool)  | null = null;
					val mut my_rec:  (a: int)     | null = null;
					val mut my_list: [int]        | null = null;
					val mut my_dict: [:int]       | null = null;
					val mut my_map:  {int -> int} | null = null;
					my_tup?.1;
					my_rec?.a;
					my_list?.[2 * 2 - 3];
					my_dict?.[@b && @a];
					my_map?.[5 + 3 * 2];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <null> my_tup (NULL.CONST null))
					(DECL <null> my_rec (NULL.CONST null))
					(DECL <null> my_list (NULL.CONST null))
					(DECL <null> my_dict (NULL.CONST null))
					(DECL <null> my_map (NULL.CONST null))
				`.concat(
					...maybe_access_output( 0, 'my_tup',  [0], '(NULL.CONST null)'),
					...maybe_access_output( 3, 'my_rec',  [2], '(NULL.CONST null)'),
					...maybe_access_output( 6, 'my_list', [4], '(NULL.CONST null)'),
					...maybe_access_output( 9, 'my_dict', [6], '(NULL.CONST null)'),
					...maybe_access_output(12, 'my_map',  [8], '(NULL.CONST null)'),
				).join('\n'));
			});
			it('short-circuits evaluation of dynamic accessor when base is non-null.', () => {
				assert.strictEqual(setupScript(`{
					val mut my_list: [int]        | null = [42];
					val mut my_dict: [:int]       | null = [a= 42];
					val mut my_map:  {int -> int} | null = {42 -> 11};
					my_list?.[2 * 2 - 3];
					my_dict?.[@b && @a];
					my_map?.[5 + 3 * 2];
				}`, {lower: true}).opt.print(), extract_lines`
					(DECL <List> my_list (LIST.NEW (INT.CONST 42)))
					(DECL <Dict> my_dict (DICT.NEW @a->(INT.CONST 42)))
					(DECL <Map> my_map (MAP.NEW (INT.CONST 42)->(INT.CONST 11)))
				`.concat(
					...maybe_access_output(0, 'my_list', [0, 4], (decl) => `
						(DECL <int> $1 (INT.MUL (INT.CONST 2) (INT.CONST 2)))
						(DECL <int> $2 (NEG (INT.CONST 3)))
						(DECL <int> $3 (INT.ADD (GET $1) (GET $2)))
						${ decl('(LIST.GET (GET my_list) (GET $3))') }
					`),
					...maybe_access_output(3, 'my_dict', [5, 9], (decl) => `
						if_false (TOBOOL (SYM.CONST @b)), goto "block-7".
						"block-6":
						(DECL <sym> $6 (SYM.CONST @a))
						goto "block-8".
						"block-7":
						(DECL <sym> $7 (SYM.CONST @b))
						"block-8":
						(DECL <sym> $8 (PHI "block-6"->(GET $6) "block-7"->(GET $7)))
						${ decl('(DICT.GET (GET my_dict) (GET $8))') }
					`),
					...maybe_access_output(9, 'my_map', [10, 13], (decl) => `
						(DECL <int> $11 (INT.MUL (INT.CONST 3) (INT.CONST 2)))
						(DECL <int> $12 (INT.ADD (INT.CONST 5) (GET $11)))
						${ decl('(MAP.GET (GET my_map) (GET $12))') }
					`),
				).join('\n'));
			});
			/* eslint-enable @stylistic/indent */
		});
	});
});
