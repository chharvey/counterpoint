import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	AST,
	VALUE,
	TYPE,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
	VoidError01,
} from '../../../src/index.ts';
import type {ConstructorType} from '../../../src/lib/index.ts';
import {typeUnit} from '../../helpers.ts';
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
					: assert.deepStrictEqual(stmt.expr!.type(), expected);
			}))
			: assert.deepStrictEqual(
				statements.map((stmt) => stmt.expr!.type()),
				expecteds,
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
			const SRCS = extract_lines(`
				null.4;
				null.four;
				null.[[[[[]]]]];
			`);
			it('#type: throws a TypeError.', () => {
				xjs.Array.forEachAggregated(SRCS, (src, i) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), [
					TypeErrorNoEntry,
					TypeErrorNoEntry,
					TypeErrorInvalidOperation,
				][i], `access type: access by ${ ['index', 'key', 'expression'][i] }.`));
			});
			it('#fold: throws.', () => {
				xjs.Array.forEachAggregated(SRCS, (src, i) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), Error, `access type: access by ${ ['index', 'key', 'expression'][i] }.`));
			});
		});

		context('access type: by index / by key', () => {
			const SRC = `
				let     tup_fixed:   [int, float, str] = [1, 2.0, "three"];
				let var tup_unfixed: [int, float, str] = [1, 2.0, "three"];

				let     rec_fixed:   [a: int, b: float, _: str] = [a= 1, b= 2.0, _= "three"];
				let var rec_unfixed: [a: int, b: float, _: str] = [a= 1, b= 2.0, _= "three"];

				tup_fixed.0;   % type \`1\`       % value \`1\`
				tup_fixed.1;   % type \`2.0\`     % value \`2.0\`
				tup_fixed.2;   % type \`"three"\` % value \`"three"\`
				tup_unfixed.0; % type \`int\`     % non-foldable value
				tup_unfixed.1; % type \`float\`   % non-foldable value
				tup_unfixed.2; % type \`str\`     % non-foldable value
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
			`;
			const THROWS = extract_lines(`
				[1, 2.0, "three"].3;
				[1, 2.0, "three"].-4;
				[a= 1, b= 2.0, c= "three"].d;
			`);
			describe('#type', () => {
				it('return individual entry types.', () => {
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
				it('throws when entry is optional.', () => {
					testExprTypes(`
						let tup_a: [int, int, ?: int] = [10, 20];
						let tup_b: [int, int, ?: int] = [10, 20, 30];

						let rec_a: [x: int, y?: int, z: int] = [x= 10, z= 20];
						let rec_b: [x: int, y?: int, z: int] = [x= 10, z= 20, y= 30];

						tup_a.2;
						tup_b.2;

						rec_a.y;
						rec_b.y;
					`, repeat(TypeErrorInvalidOperation, 4));
				});
				it('throws when base object is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines(`
						(4).2;
						List.<int>([10, 20, 30]).1;

						(4).c;
						Dict.<int>([a= 10, b= 20, c= 30]).b;
					`), (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry, src));
				});
				it('throws when index is out of bounds / when key is out of range.', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry));
				});
			});
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

						new VALUE.Integer(1n),
						new VALUE.Float(2.0),
						new VALUE.String('three'),
						...repeat(null, 3),
					]);
				});
				it('throws when index is out of bounds / when key is out of range.', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), VoidError01));
				});
			});
		});

		context('access type: access by expression.', () => {
			const DECLS = `
				let     list_fixed:   List.<     int | float | str> = List.<int | float | str>([   1,    2.0,    "three"]);
				let     dict_fixed:   Dict.<     int | float | str> = Dict.<int | float | str>([a= 1, b= 2.0, c= "three"]);
				let     set_fixed:    Set .<     int | float | str> = {1, 2.0, "three"};
				let     map_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				let var list_unfixed: List.<     int | float | str> = list_fixed;
				let var dict_unfixed: Dict.<     int | float | str> = dict_fixed;
				let var set_unfixed:  Set .<     int | float | str> = set_fixed;
				let var map_unfixed:  Map .<str, int | float | str> = map_fixed;
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

				list_fixed.[3];   % type \`never\` % fold throws VoidError
				list_fixed.[-4];  % type \`never\` % fold throws VoidError
				dict_fixed.[@d];  % type \`never\` % fold throws VoidError
				set_fixed.[42.0]; % type \`false\` % value \`false\`
				map_fixed.["d"];  % type \`never\` % fold throws VoidError

				list_unfixed.[3];   % type \`int | float | str\` % non-foldable value
				list_unfixed.[-4];  % type \`int | float | str\` % non-foldable value
				dict_unfixed.[@d];  % type \`int | float | str\` % non-foldable value
				set_unfixed.[42.0]; % type \`bool\`              % non-foldable value
				map_unfixed.["d"];  % type \`int | float | str\` % non-foldable value
			`;
			describe('#type', () => {
				it('returns individual entry types for folded objects, union types for unfolded objects.', () => {
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
				it('unsupported: throws for string access of dict.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource('Dict.<int>([a= 10, b= 20, c= 30]).["a"];').type(), /String keys for dict access are not yet supported\./);
				});
				it('throws when base object is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines(`
						(4).[2];
						[10, 20, 30].[1];
						[a= 10, b= 20, c= 30].[@b];
					`), (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorInvalidOperation, src));
				});
				it('when accessor expression is correct type but out of bounds/range, returns `never` for folded objects, returns union type for unfolded objects.', () => {
					const TYPE_INT_FLOAT_STR = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR);
					return testExprTypes(ERRS, [
						...repeat(TYPE.NEVER, 3),
						TYPE.FALSE,
						TYPE.NEVER,

						...repeat(TYPE_INT_FLOAT_STR, 3),
						TYPE.BOOL,
						TYPE_INT_FLOAT_STR,
					]);
				});
				it('throws when accessor expression is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines(`
						List.<int | float | str>([1, 2.0, "three"]).["3"];
						Dict.<int | float | str>([a= 1, b= 2.0, c= "three"]).[3];
						{1, 2.0, "three"}.[true];
						{["a"] -> 1, ["b"] -> 2.0, ["c"] -> "three"}.["a"];
					`), (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNotNarrow, src));
				});
			});
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
				it('when accessor expression is out of bounds/range, throws for folded objects, returns null for unfolded objects.', () => {
					testExprValues(ERRS, [
						...repeat(VoidError01, 3),
						VALUE.FALSE,
						VoidError01,

						...repeat(null, 5),
					]);
				});
			});
		});
	});


	context('access kind: potential access (`a?.‹b›`).', () => {
		context('when base is nullish.', () => {
			describe('#type', () => {
				it('returns type of base when it is a subtype of null.', () => {
					xjs.Array.forEachAggregated([
						AST.ASTNodeAccess.fromSource('null?.3;')         .type(),
						AST.ASTNodeAccess.fromSource('null?.four;')      .type(),
						AST.ASTNodeAccess.fromSource('null?.[[[[[]]]]];').type(),
					], (typ, i) => assert.ok(typ.isSubtypeOf(TYPE.NULL), `access type: access by ${ ['index', 'key', 'expression'][i] }.`));
				});
				it('chained optional access.', () => {
					const prop1: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL]);       // [bool]
					const prop2 = new TYPE.Tuple([{type: TYPE.BOOL, optional: true}]); // [?: bool]
					return testExprTypes(`
						let var bound1: [prop?: [bool]] = [prop= [true]];
						let var bound2: [prop?: [?: bool]] = [prop= []];
						bound1;
						bound1?.prop;
						bound1?.prop?.0;
						bound2;
						bound2?.prop;
						bound2?.prop?.0;
					`, [
						new TYPE.Record(new Map([[0x100n, {type: prop1, optional: true}]])), // [prop?: [bool]]
						prop1.union(TYPE.NULL),                                              // [bool] | null
						TYPE.BOOL.union(TYPE.NULL),                                          // bool | null
						new TYPE.Record(new Map([[0x100n, {type: prop2, optional: true}]])), // [prop?: [?: bool]]
						prop2.union(TYPE.NULL),                                              // [?: bool] | null
						TYPE.BOOL.union(TYPE.NULL),                                          // bool | null
					]);
				});
			});
			describe('#fold', () => {
				it('returns base when it is null.', () => {
					xjs.Array.forEachAggregated([
						AST.ASTNodeAccess.fromSource('null?.3;')         .fold(),
						AST.ASTNodeAccess.fromSource('null?.four;')      .fold(),
						AST.ASTNodeAccess.fromSource('null?.[[[[[]]]]];').fold(),
					], (val, i) => assert.strictEqual(val, VALUE.NULL, `access type: access by ${ ['index', 'key', 'expression'][i] }.`));
				});
				it('chained optional access.', () => {
					const prop1 = new VALUE.Tuple([VALUE.TRUE]); // [true]
					const prop2 = new VALUE.Tuple();             // []
					return testExprValues(`
						let bound1: [prop?: [bool]] = [prop= [true]];
						let bound2: [prop?: [?: bool]] = [prop= []];
						bound1;
						bound1?.prop;
						bound1?.prop?.0;
						bound2;
						bound2?.prop;
					`, [
						new VALUE.Record(new Map([[0x100n, prop1]])), // [prop= [true]]
						prop1,                                        // [true]
						VALUE.TRUE,                                   // true
						new VALUE.Record(new Map([[0x100n, prop2]])), // [prop= []]
						prop2,                                        // []
					]);
				});
				it('potential-access of non-existent value returns null (bypassing type-checking).', () => {
					assert.strictEqual(
						AST.ASTNodeAccess.fromSource('[prop= []]?.prop?.0;').fold(),
						VALUE.NULL,
					);
				});
			});
		});

		context('access type: access by index / by key.', () => {
			const SRC = `
				let     tupo1_f: [int, float, ?: str] = [1, 2.0, "three"];
				let var tupo1_u: [int, float, ?: str] = [1, 2.0, "three"];
				let var tupo2_u: [int, float, ?: str] = [1, 2.0];

				let     reco1_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
				let var reco1_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
				let var reco2_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0];

				tupo1_f?.2; % type \`"three"\` % value \`"three"\`
				tupo1_u?.2; % type \`str?\`    % non-foldable value
				tupo2_u?.2; % type \`str?\`    % non-foldable value

				reco1_f?.b; % type \`"three"\` % value \`"three"\`
				reco1_u?.b; % type \`str?\`    % non-foldable value
				reco2_u?.b; % type \`str?\`    % non-foldable value
			`;
			const THROWS = extract_lines(`
				[1, 2.0, "three"]?.3;
				[1, 2.0, "three"]?.-4;
				[a= 1, b= 2.0, c= "three"]?.d;
			`);
			describe('#type', () => {
				it('unions with null if entry is optional.', () => {
					testExprTypes(SRC, [
						typeUnit('three'),
						...repeat(TYPE.STR.union(TYPE.NULL), 2),

						typeUnit('three'),
						...repeat(TYPE.STR.union(TYPE.NULL), 2),
					]);
				});
				it('throws when entry is not optional and base is not nullish.', () => {
					testExprTypes(`
						let tup_a: [int, int, ?: int] = [10, 20];
						let tup_b: [int, int, ?: int] = [10, 20, 30];

						let rec_a: [x: int, y?: int, z: int] = [x= 10, z= 20];
						let rec_b: [x: int, y?: int, z: int] = [x= 10, z= 20, y= 30];

						tup_a?.1;
						tup_b?.1;

						rec_a?.z;
						rec_b?.z;
					`, repeat(TypeErrorInvalidOperation, 4));
				});
				it('throws when index is out of bounds / when key is out of range.', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry));
				});
			});
			describe('#fold', () => {
				it('returns folded values as normal.', () => {
					testExprValues(SRC, [
						new VALUE.String('three'),
						...repeat(null, 2),

						new VALUE.String('three'),
						...repeat(null, 2),
					]);
				});
				it('returns null when index is out of bounds / when key is out of range (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.strictEqual(AST.ASTNodeAccess.fromSource(src).fold(), VALUE.NULL));
				});
			});
		});

		context('access type: access by expression.', () => {
			const DECLS = `
				let     list_fixed:   List.<     int | float | str> = List.<int | float | str>([   1,    2.0,    "three"]);
				let     dict_fixed:   Dict.<     int | float | str> = Dict.<int | float | str>([a= 1, b= 2.0, c= "three"]);
				let     set_fixed:    Set .<     int | float | str> = {1, 2.0, "three"};
				let     map_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
				let var list_unfixed: List.<     int | float | str> = list_fixed;
				let var dict_unfixed: Dict.<     int | float | str> = dict_fixed;
				let var set_unfixed:  Set .<     int | float | str> = set_fixed;
				let var map_unfixed:  Map .<str, int | float | str> = map_fixed;
			`;
			const SRC = `
				${ DECLS }

				list_fixed?.[0];      % type \`1\`       % value \`1\`
				list_fixed?.[1];      % type \`2.0\`     % value \`2.0\`
				list_fixed?.[2];      % type \`"three"\` % value \`"three"\`
				dict_fixed?.[@a];     % type \`1\`       % value \`1\`
				dict_fixed?.[@b];     % type \`2.0\`     % value \`2.0\`
				dict_fixed?.[@c];     % type \`"three"\` % value \`"three"\`
				set_fixed?.[1];       % type \`true\`    % value \`true\`
				set_fixed?.[2.0];     % type \`true\`    % value \`true\`
				set_fixed?.["three"]; % type \`true\`    % value \`true\`
				map_fixed?.["a"];     % type \`1\`       % value \`1\`
				map_fixed?.["b"];     % type \`2.0\`     % value \`2.0\`
				map_fixed?.["c"];     % type \`"three"\` % value \`"three"\`

				list_unfixed?.[0];      % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[1];      % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[2];      % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@a];     % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@b];     % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@c];     % type \`int | float | str | null\` % non-foldable value
				set_unfixed?.[1];       % type \`bool\`                     % non-foldable value
				set_unfixed?.[2.0];     % type \`bool\`                     % non-foldable value
				set_unfixed?.["three"]; % type \`bool\`                     % non-foldable value
				map_unfixed?.["a"];     % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["b"];     % type \`int | float | str | null\` % non-foldable value
				map_unfixed?.["c"];     % type \`int | float | str | null\` % non-foldable value
			`;
			const ERRS = `
				${ DECLS }

				list_fixed?.[3];   % type \`null\`  % value \`null\`
				list_fixed?.[-4];  % type \`null\`  % value \`null\`
				dict_fixed?.[@d];  % type \`null\`  % value \`null\`
				set_fixed?.[42.0]; % type \`false\` % value \`false\`
				map_fixed?.["d"];  % type \`null\`  % value \`null\`

				list_unfixed?.[3];   % type \`int | float | str | null\` % non-foldable value
				list_unfixed?.[-4];  % type \`int | float | str | null\` % non-foldable value
				dict_unfixed?.[@d];  % type \`int | float | str | null\` % non-foldable value
				set_unfixed?.[42.0]; % type \`bool\`                     % non-foldable value
				map_unfixed?.["d"];  % type \`int | float | str | null\` % non-foldable value
			`;
			describe('#type', () => {
				it('returns individual entry types for folded objects, union types for unfolded objects.', () => {
					const N_TYPES = [
						typeUnit(1n),
						typeUnit(2.0),
						typeUnit('three'),
					] as const;
					const TYPE_INT_FLOAT_STR_NULL = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR, TYPE.NULL);
					return testExprTypes(SRC, [
						...N_TYPES,
						...N_TYPES,
						...repeat(TYPE.TRUE, 3),
						...N_TYPES,

						...repeat(TYPE_INT_FLOAT_STR_NULL, 6),
						...repeat(TYPE.BOOL, 3),
						...repeat(TYPE_INT_FLOAT_STR_NULL, 3),
					]);
				});
				it('throws when base object is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines(`
						(4)?.[2];
						[10, 20, 30]?.[1];
						[a= 10, b= 20, c= 30]?.[@b];
					`), (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorInvalidOperation, src));
				});
				it('when accessor expression is correct type but out of bounds/range, returns `null` for folded objects, union types for unfolded objects.', () => {
					const TYPE_INT_FLOAT_STR_NULL = TYPE.Union.all(TYPE.INT, TYPE.FLOAT, TYPE.STR, TYPE.NULL);
					return testExprTypes(ERRS, [
						...repeat(TYPE.NULL, 3),
						TYPE.FALSE,
						TYPE.NULL,

						...repeat(TYPE_INT_FLOAT_STR_NULL, 3),
						TYPE.BOOL,
						TYPE_INT_FLOAT_STR_NULL,
					]);
				});
				it('throws when accessor expression is of incorrect type.', () => {
					xjs.Array.forEachAggregated(extract_lines(`
						List.<int | float | str>([1, 2.0, "three"])?.["3"];
						Dict.<int | float | str>([a= 1, b= 2.0, c= "three"])?.[3];
						{1, 2.0, "three"}?.[true];
						{["a"] -> 1, ["b"] -> 2.0, ["c"] -> "three"}?.["a"];
					`), (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNotNarrow, src));
				});
			});
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
				it('when accessor expression is out of bounds/range, returns the `null` value for folded objects, returns null for unfolded objects.', () => {
					testExprValues(ERRS, [
						...repeat(VALUE.NULL, 3),
						VALUE.FALSE,
						VALUE.NULL,

						...repeat(null, 5),
					]);
				});
			});
		});
	});


	context('access kind: claim access (`a!.‹b›`).', () => {
		context('access type: access by index / by key.', () => {
			const SRC = `
				let     tupo1_f: [int, float, ?: str] = [1, 2.0, "three"];
				let var tupo1_u: [int, float, ?: str] = [1, 2.0, "three"];
				let var tupo2_u: [int, float, ?: str] = [1, 2.0];
				let var tupvoid: [int | void]         = [42];

				let     reco1_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
				let var reco1_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
				let var reco2_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0];
				let var recvoid: [c: int | void]             = [c= 42];

				tupo1_f!.2; % type \`"three"\` % value \`"three"\`
				tupo1_u!.2; % type \`str\`     % non-foldable value
				tupo2_u!.2; % type \`str\`     % non-foldable value
				tupvoid!.0; % type \`int\`     % non-foldable value

				reco1_f!.b; % type \`"three"\` % value \`"three"\`
				reco1_u!.b; % type \`str\`     % non-foldable value
				reco2_u!.b; % type \`str\`     % non-foldable value
				recvoid!.c; % type \`int\`     % non-foldable value
			`;
			it('#type: always subtracts void.', () => {
				testExprTypes(SRC, [
					typeUnit('three'),
					TYPE.STR,
					TYPE.STR,
					TYPE.INT,

					typeUnit('three'),
					TYPE.STR,
					TYPE.STR,
					TYPE.INT,
				]);
			});
			specify('#fold', () => {
				testExprValues(SRC, [
					new VALUE.String('three'),
					...repeat(null, 3),

					new VALUE.String('three'),
					...repeat(null, 3),
				]);
			});
		});

		context('access type: access by expression.', () => {
			const SRC = `
				let     listvoid_fixed:   (int | void)[]      = List.<int | void>([42]);
				let     dictvoid_fixed:   [: int | void]      = Dict.<int | void>([a= 42]);
				let     setvoid_fixed:    (int | void){}      = {42};
				let     mapvoid_fixed:    {str -> int | void} = {"a" -> 42};
				let var listvoid_unfixed: (int | void)[]      = listvoid_fixed;
				let var dictvoid_unfixed: [: int | void]      = dictvoid_fixed;
				let var setvoid_unfixed:  (int | void){}      = setvoid_fixed;
				let var mapvoid_unfixed:  {str -> int | void} = mapvoid_fixed;

				listvoid_fixed!.[0];  % type \`42\`   % value \`42\`
				dictvoid_fixed!.[@a]; % type \`42\`   % value \`42\`
				setvoid_fixed!.[42];  % type \`true\` % value \`true\`
				mapvoid_fixed!.["a"]; % type \`42\`   % value \`42\`

				listvoid_unfixed!.[0];  % type \`int\`  % non-foldable value
				dictvoid_unfixed!.[@a]; % type \`int\`  % non-foldable value
				setvoid_unfixed!.[42];  % type \`bool\` % non-foldable value
				mapvoid_unfixed!.["a"]; % type \`int\`  % non-foldable value
			`;
			it('#type: always subtracts void.', () => {
				const N_TYPE = typeUnit(42n);
				return testExprTypes(SRC, [
					...repeat(N_TYPE, 2),
					TYPE.TRUE,
					N_TYPE,

					...repeat(TYPE.INT, 2),
					TYPE.BOOL,
					TYPE.INT,
				]);
			});
			specify('#fold', () => {
				const val = new VALUE.Integer(42n);
				return testExprValues(SRC, [
					...repeat(val, 2),
					VALUE.TRUE,
					val,

					...repeat(null, 4),
				]);
			});
		});
	});
});
