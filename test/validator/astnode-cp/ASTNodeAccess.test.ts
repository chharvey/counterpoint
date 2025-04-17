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
import {assert_instanceof} from '../../../src/lib/index.ts';
import {
	CONFIG_FOLDING_OFF,
	typeUnit,
} from '../../helpers.ts';



describe('ASTNodeAccess', () => {
	/**
	 * Takes a program source text and compares it to the array of expected types.
	 * The format of the program source text must be
	 * 0 or more variable declarations and 0 or more nonempty expression-statements, possibly intermixed.
	 * (The source text must be valid!)
	 * The expression-statements’ expression types are compared to the expected types via `deepStrictEqual`.
	 * @param source   the program source text to parse and analyze
	 * @param expected the expected types of the expressions
	 */
	function testExprTypes(source: string, expected: readonly TYPE.Type[]): void {
		const program: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(source);
		program.varCheck();
		program.typeCheck();
		return assert.deepStrictEqual(
			program.children
				.filter((stmt) => stmt instanceof AST.ASTNodeStatementExpression)
				.map((stmt) => stmt.expr!.type()),
			expected,
		);
	}


	/**
	 * Takes a program source text and compares it to the array of expected folded values.
	 * The format of the program source text must be
	 * 0 or more variable declarations and 0 or more nonempty expression-statements, possibly intermixed.
	 * (The source text must be valid!)
	 * The expression-statements’ expression folded values, or null if they are not foldable, are compared to the expected values via `deepStrictEqual`.
	 * @param source   the program source text to parse and analyze
	 * @param expected the expected folded values (or null) of the expressions
	 */
	function testExprValues(source: string, expected: readonly (VALUE.Value | null)[]): void {
		const program: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(source);
		program.varCheck();
		program.typeCheck();
		return assert.deepStrictEqual(
			program.children
				.filter((stmt) => stmt instanceof AST.ASTNodeStatementExpression)
				.map((stmt) => stmt.expr!.fold()),
			expected,
		);
	}


	context('access kind: dot access (`a.‹b›`).', () => {
		context('when base is nullish.', () => {
			it('#type: throws a TypeError.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.4;')         .type(), TypeErrorNoEntry,          'access type: access by index.');
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.four;')      .type(), TypeErrorNoEntry,          'access type: access by key.');
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.[[[[[]]]]];').type(), TypeErrorInvalidOperation, 'access type: access by expression.');
			});
			it('#fold: throws.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.4;')         .fold(), Error, 'access type: access by index.');
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.four;')      .fold(), Error, 'access type: access by key.');
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.[[[[[]]]]];').fold(), Error, 'access type: access by expression.');
			});
		});

		context('access type: access by index.', () => {
			const SRC = `
				let     tup_fixed:   [int, float, str] = [1, 2.0, "three"];
				let var tup_unfixed: [int, float, str] = [1, 2.0, "three"];

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
			`;
			const THROWS = [
				'[1, 2.0, "three"].3;',
				'[1, 2.0, "three"].-4;',
			] as const;
			describe('#type', () => {
				it('return individual entry types', () => {
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
					]);
				});
				// TODO: throws when entry is optional
				it('throws when index is out of bounds.', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry));
				});
			});
			describe('#fold', () => {
				it('return individual entries', () => {
					testExprValues(SRC, [
						new VALUE.Integer(1n),
						new VALUE.Float(2.0),
						new VALUE.String('three'),
						null,
						null,
						null,
						new VALUE.Integer(1n),
						new VALUE.Float(2.0),
						new VALUE.String('three'),
						null,
						null,
						null,
					]);
				});
				it('throws when index is out of bounds.', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).fold(), VoidError01));
				});
			});
		});

		context('access type: access by key.', () => {
			const SRC = `
				let     rec_fixed:   [a: int, b: float, _: str] = [a= 1, b= 2.0, _= "three"];
				let var rec_unfixed: [a: int, b: float, _: str] = [a= 1, b= 2.0, _= "three"];

				rec_fixed.a;   % type \`1\`       % value \`1\`
				rec_fixed.b;   % type \`2.0\`     % value \`2.0\`
				rec_fixed._;   % type \`"three"\` % value \`"three"\`
				rec_unfixed.a; % type \`int\`     % non-foldable value
				rec_unfixed.b; % type \`float\`   % non-foldable value
				rec_unfixed._; % type \`str\`     % non-foldable value
			`;
			const THROWS = '[a= 1, b= 2.0, c= "three"].d;';
			describe('#type', () => {
				it('return individual entry types', () => {
					testExprTypes(SRC, [
						typeUnit(1n),
						typeUnit(2.0),
						typeUnit('three'),
						TYPE.INT,
						TYPE.FLOAT,
						TYPE.STR,
					]);
				});
				// TODO: throws when entry is optional
				it('throws when key is out of range.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource(THROWS).type(), TypeErrorNoEntry);
				});
			});
			describe('#fold', () => {
				it('return individual entries', () => {
					testExprValues(SRC, [
						new VALUE.Integer(1n),
						new VALUE.Float(2.0),
						new VALUE.String('three'),
						null,
						null,
						null,
					]);
				});
				it('throws when key is out of range.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource(THROWS).fold(), VoidError01);
				});
			});
		});

		context('access type: access by expression.', () => {
			// TODO:
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
					], (t, i) => assert.ok(t.isSubtypeOf(TYPE.NULL), `access type: access by ${ ['index', 'key', 'expression'][i] }.`));
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
					], (t, i) => assert.strictEqual(t, VALUE.NULL, `access type: access by ${ ['index', 'key', 'expression'][i] }.`));
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

		context('access type: access by index.', () => {
			const SRC = `
				let     tupo1_f: [int, float, ?: str] = [1, 2.0, "three"];
				let var tupo1_u: [int, float, ?: str] = [1, 2.0, "three"];
				let var tupo2_u: [int, float, ?: str] = [1, 2.0];

				tupo1_f?.2; % type \`"three"\` % value \`"three"\`
				tupo1_u?.2; % type \`str?\`    % non-foldable value
				tupo2_u?.2; % type \`str?\`    % non-foldable value
			`;
			const THROWS = [
				'[1, 2.0, "three"]?.3;',
				'[1, 2.0, "three"]?.-4;',
			] as const;
			describe('#type', () => {
				it('unions with null if entry is optional.', () => {
					testExprTypes(SRC, [
						typeUnit('three'),
						TYPE.STR.union(TYPE.NULL),
						TYPE.STR.union(TYPE.NULL),
					]);
				});
				// TODO: throws when entry is not optional
				it('throws when index is out of bounds.', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.throws(() => AST.ASTNodeAccess.fromSource(src).type(), TypeErrorNoEntry));
				});
			});
			describe('#fold', () => {
				it('returns folded values as normal.', () => {
					testExprValues(SRC, [
						new VALUE.String('three'),
						null,
						null,
					]);
				});
				it('returns null when index is out of bounds (bypassing type-checking).', () => {
					xjs.Array.forEachAggregated(THROWS, (src) => assert.strictEqual(AST.ASTNodeAccess.fromSource(src).fold(), VALUE.NULL));
				});
			});
		});

		context('access type: access by key.', () => {
			const SRC = `
				let     reco1_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
				let var reco1_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
				let var reco2_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0];

				reco1_f?.b; % type \`"three"\` % value \`"three"\`
				reco1_u?.b; % type \`str?\`    % non-foldable value
				reco2_u?.b; % type \`str?\`    % non-foldable value
			`;
			const THROWS = '[a= 1, b= 2.0, c= "three"]?.d;';
			describe('#type', () => {
				it('unions with null if entry is optional.', () => {
					testExprTypes(SRC, [
						typeUnit('three'),
						TYPE.STR.union(TYPE.NULL),
						TYPE.STR.union(TYPE.NULL),
					]);
				});
				// TODO: throws when entry is not optional
				it('throws when key is out of range.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource(THROWS).type(), TypeErrorNoEntry);
				});
			});
			describe('#fold', () => {
				it('returns folded values as normal.', () => {
					testExprValues(SRC, [
						new VALUE.String('three'),
						null,
						null,
					]);
				});
				it('returns null when key is out of range (bypassing type-checking).', () => {
					assert.strictEqual(AST.ASTNodeAccess.fromSource(THROWS).fold(), VALUE.NULL);
				});
			});
		});

		context('access type: access by expression.', () => {
			// TODO:
		});
	});


	context('access kind: claim access (`a!.‹b›`).', () => {
		context('access type: access by index.', () => {
			const SRC = `
				let     tupo1_f: [int, float, ?: str] = [1, 2.0, "three"];
				let var tupo1_u: [int, float, ?: str] = [1, 2.0, "three"];
				let var tupo2_u: [int, float, ?: str] = [1, 2.0];
				let var tupvoid: [int | void]         = [42];

				tupo1_f!.2; % type \`"three"\` % value \`"three"\`
				tupo1_u!.2; % type \`str\`     % non-foldable value
				tupo2_u!.2; % type \`str\`     % non-foldable value
				tupvoid!.0; % type \`int\`     % non-foldable value
			`;
			it('#type: always subtracts void.', () => {
				testExprTypes(SRC, [
					typeUnit('three'),
					TYPE.STR,
					TYPE.STR,
					TYPE.INT,
				]);
			});
			specify('#fold', () => {
				testExprValues(SRC, [
					new VALUE.String('three'),
					null,
					null,
					null,
				]);
			});
		});

		context('access type: access by key.', () => {
			const SRC = `
				let     reco1_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
				let var reco1_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
				let var reco2_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0];
				let var recvoid: [c: int | void]             = [c= 42];

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
				]);
			});
			specify('#fold', () => {
				testExprValues(SRC, [
					new VALUE.String('three'),
					null,
					null,
					null,
				]);
			});
		});

		context('access type: access by expression.', () => {
			// TODO:
		});
	});


	const EXPR_ACCESS_SRC: string = `
		%% statements 0 – 4 %%
		let a: [str] = ["a"];
		let b: [str] = ["b"];
		let c: [str] = ["c"];
		let var three: str = "three";

		%% statements 4 – 10 %%
		let     tup_fixed:    [int, float, str]              = [1, 2.0, "three"];
		let var tup_unfixed:  [int, float, str]              = [1, 2.0, "three"];
		let     list_fixed:   (int | float | str)[]          = List.<int | float | str>([1, 2.0, "three"]);
		let var list_unfixed: List.<int | float | str>       = List.<int | float | str>([1, 2.0, "three"]);
		let     set_fixed:    (int | float | str){}          = {1, 2.0, "three"};
		let var set_unfixed:  Set.<int | float | str>        = {1, 2.0, three};
		let     map_fixed:    {[str] -> int | float | str}   = {a -> 1, b -> 2.0, c -> "three"};
		let var map_unfixed:  Map.<[str], int | float | str> = {a -> 1, b -> 2.0, c -> three};

		%% statements 12 – 18 %%
		tup_fixed  .[0 + 0]; % type \`1\`       % value \`1\`
		tup_fixed  .[0 + 1]; % type \`2.0\`     % value \`2.0\`
		tup_fixed  .[0 + 2]; % type \`"three"\` % value \`"three"\`
		tup_unfixed.[0 + 0]; % type \`int\`     % non-computable value
		tup_unfixed.[0 + 1]; % type \`float\`   % non-computable value
		tup_unfixed.[0 + 2]; % type \`str\`     % non-computable value

		%% statements 18 – 24 %%
		list_fixed  .[0 + 0]; % type \`1\`                 % value \`1\`
		list_fixed  .[0 + 1]; % type \`2.0\`               % value \`2.0\`
		list_fixed  .[0 + 2]; % type \`"three"\`           % value \`"three"\`
		list_unfixed.[0 + 0]; % type \`int | float | str\` % non-computable value
		list_unfixed.[0 + 1]; % type \`int | float | str\` % non-computable value
		list_unfixed.[0 + 2]; % type \`int | float | str\` % non-computable value

		%% statements 24 – 30 %%
		set_fixed  .[1];       % type \`true\` % value \`true\`
		set_fixed  .[2.0];     % type \`true\` % value \`true\`
		set_fixed  .["three"]; % type \`true\` % value \`true\`
		set_unfixed.[1];       % type \`bool\` % non-computable value
		set_unfixed.[2.0];     % type \`bool\` % non-computable value
		set_unfixed.["three"]; % type \`bool\` % non-computable value

		%% statements 30 – 36 %%
		map_fixed  .[a]; % type \`1\`             % value \`1\`
		map_fixed  .[b]; % type \`2.0\`           % value \`2.0\`
		map_fixed  .[c]; % type \`"three"\`       % value \`"three"\`
		map_unfixed.[a]; % type \`1 | 2.0 | str\` % non-computable value
		map_unfixed.[b]; % type \`1 | 2.0 | str\` % non-computable value
		map_unfixed.[c]; % type \`1 | 2.0 | str\` % non-computable value

		%% statements 36 – 44 %%
		let     tupo1_f: [int, float, ?: str] = [1, 2.0, "three"];
		let     tupo2_f: [int, float, ?: str] = [1, 2.0];
		let     tupo3_f: [int, float]         = [1, 2.0, true];
		let     tupo4_f: [int, float]         = [1, 2.0];
		let var tupo1_u: [int, float, ?: str] = [1, 2.0, "three"];
		let var tupo2_u: [int, float, ?: str] = [1, 2.0];
		let var tupo3_u: [int, float]         = [1, 2.0, true];
		let var tupo4_u: [int, float]         = [1, 2.0];

		%% statements 44 – 46 %%
		tupo1_u.[0 + 2]; % type \`str | void\` % non-computable value
		tupo2_u.[0 + 2]; % type \`str | void\` % non-computable value

		%% statements 46 – 49 %%
		tupo1_f?.[0 + 2]; % type \`"three"\` % value \`"three"\`
		tupo1_u?.[0 + 2]; % type \`str?\`    % non-computable value
		tupo2_u?.[0 + 2]; % type \`str?\`    % non-computable value

		%% statements 49 – 55 %%
		list_fixed  ?.[2];       % type \`"three"\`                  % value \`"three"\`
		list_unfixed?.[2];       % type \`int | float | str | null\` % non-computable value
		set_fixed   ?.["three"]; % type \`true\`                     % value\`true\`
		set_unfixed ?.[three];   % type \`bool\`                     % non-computable value
		map_fixed   ?.[c];       % type \`"three"\`                  % value \`"three"\`
		map_unfixed ?.[c];       % type \`int | float | str | null\` % non-computable value

		%% statements 55 – 58 %%
		tupo1_f!.[0 + 2]; % type \`"three"\` % value \`"three"\`
		tupo1_u!.[0 + 2]; % type \`str\`     % non-computable value
		tupo2_u!.[0 + 2]; % type \`str\`     % non-computable value
	`;


	describe('#type', () => {
		function typeOfStmtExpr(stmt: AST.ASTNodeStatement): TYPE.Type {
			assert_instanceof(stmt, AST.ASTNodeStatementExpression);
			return stmt.expr!.type();
		}
		const COMMON_TYPES = {
			int_float: TYPE.Union.all(
				TYPE.INT,
				TYPE.FLOAT,
			),
			int_float_str: TYPE.Union.all(
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
			),
			int_float_str_null: TYPE.Union.all(
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
				TYPE.NULL,
			),
		};
		const expected: TYPE.Type[] = [
			typeUnit(1n),
			typeUnit(2.0),
			typeUnit('three'),
			TYPE.INT,
			TYPE.FLOAT,
			TYPE.STR,
		];
		const expected_o: TYPE.Type[] = [
			typeUnit('three'),
			TYPE.STR.union(TYPE.NULL),
			TYPE.STR.union(TYPE.NULL),
		];
		const expected_c: TYPE.Type[] = [
			typeUnit('three'),
			TYPE.STR,
			TYPE.STR,
		];

		context('access by computed expression.', () => {
			context('with constant folding on, folds expression accessor.', () => {
				let program: AST.ASTNodeGoal; // eslint-disable-line @typescript-eslint/init-declarations
				before(() => {
					program = AST.ASTNodeGoal.fromSource(EXPR_ACCESS_SRC);
					program.varCheck();
					program.typeCheck();
				});
				it('returns individual entry types for tuples.', () => {
					assert.deepStrictEqual(
						program.children.slice(12, 18).map((c) => typeOfStmtExpr(c)),
						expected,
					);
				});
				it('returns the union of all element types, constants, for lists.', () => {
					assert.deepStrictEqual(
						program.children.slice(18, 24).map((c) => typeOfStmtExpr(c)),
						[
							...expected.slice(0, 3),
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
						],
					);
				});
				it('returns boolean values for sets.', () => {
					program.children.slice(24, 27).forEach((c) => (
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							TYPE.TRUE,
						)
					));
					return program.children.slice(27, 30).forEach((c) => (
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							TYPE.BOOL,
						)
					));
				});
				it('returns the union of all consequent types, constants, for maps.', () => {
					assert.deepStrictEqual(
						program.children.slice(30, 36).map((c) => typeOfStmtExpr(c)),
						[
							...expected.slice(0, 3),
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
						],
					);
				});
				it('unions with void if tuple entry is optional.', () => {
					assert.deepStrictEqual(
						program.children.slice(44, 46).map((c) => typeOfStmtExpr(c)),
						[
							TYPE.STR.union(TYPE.VOID),
							TYPE.STR.union(TYPE.VOID),
						],
					);
				});
				it('unions with null if tuple entry and access are optional.', () => {
					assert.deepStrictEqual(
						program.children.slice(46, 49).map((c) => typeOfStmtExpr(c)),
						expected_o,
					);
				});
				it('unions with null if list/map access is optional.', () => {
					assert.deepStrictEqual(
						[
							...program.children.slice(49, 51),
							...program.children.slice(53, 55),
						].map((c) => typeOfStmtExpr(c)),
						[
							typeUnit('three'),
							COMMON_TYPES.int_float_str.union(TYPE.NULL),
							typeUnit('three'),
							COMMON_TYPES.int_float_str.union(TYPE.NULL),
						],
					);
				});
				it('does not union with null even when set access is optional.', () => {
					assert.deepStrictEqual(
						program.children.slice(51, 53).map((c) => typeOfStmtExpr(c)),
						[
							TYPE.TRUE,
							TYPE.BOOL,
						],
					);
				});
				it('claim access always subtracts void.', () => {
					assert.deepStrictEqual(
						program.children.slice(55, 58).map((c) => typeOfStmtExpr(c)),
						expected_c,
					);
				});
				it('throws when accessor expression is correct type but out of bounds for tuples.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"].[3];')   .type(), TypeErrorNoEntry);
					assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"].[-4];')  .type(), TypeErrorNoEntry);
					assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"]?.[3];')  .type(), TypeErrorNoEntry);
					assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"]?.[-4];') .type(), TypeErrorNoEntry);
				});
				it('returns the list item type when accessor expression is correct type but out of bounds for lists.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let var list: (int | float | str)[] = List.<int | float| str>([1, 2.0, "three"]);
						list.[3];
						list.[-4];
					`);
					goal.varCheck();
					goal.typeCheck();
					goal.children.slice(1, 3).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('throws when accessor expression is of incorrect type.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"].["3"];')                            .type(), TypeErrorNotNarrow);
					assert.throws(() => AST.ASTNodeAccess.fromSource('{1, 2.0, "three"}.[true];')                           .type(), TypeErrorNotNarrow);
					assert.throws(() => AST.ASTNodeAccess.fromSource('{["a"] -> 1, ["b"] -> 2.0, ["c"] -> "three"}.["a"];') .type(), TypeErrorNotNarrow);
				});
			});
			context('with constant folding off.', () => {
				let program: AST.ASTNodeGoal; // eslint-disable-line @typescript-eslint/init-declarations
				before(() => {
					program = AST.ASTNodeGoal.fromSource(EXPR_ACCESS_SRC, CONFIG_FOLDING_OFF);
					program.varCheck();
					program.typeCheck();
				});
				it('returns the union of all entry types for tuples.', () => {
					program.children.slice(12, 18).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('returns the union of all item types for lists.', () => {
					program.children.slice(18, 24).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('returns type `bool` for sets.', () => {
					program.children.slice(24, 30).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							TYPE.BOOL,
						);
					});
				});
				it('returns the union of all consequent types for maps.', () => {
					program.children.slice(30, 36).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('does not union with void, even with optional tuple entries.', () => {
					program.children.slice(44, 46).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('unions with null if tuple entry and access are optional.', () => {
					program.children.slice(46, 49).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							COMMON_TYPES.int_float_str_null,
						);
					});
				});
				it('unions with null if list/map access is optional.', () => {
					[
						...program.children.slice(49, 51),
						...program.children.slice(53, 55),
					].forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c),
							COMMON_TYPES.int_float_str.union(TYPE.NULL),
						);
					});
				});
				it('does not union with null even when set access is optional.', () => {
					program.children.slice(51, 53).forEach((c) => assert.deepStrictEqual(
						typeOfStmtExpr(c),
						TYPE.BOOL,
					));
				});
				it('claim access always subtracts void.', () => {
					assert.deepStrictEqual(
						program.children.slice(55, 58).map((c) => typeOfStmtExpr(c)),
						[
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
						],
					);
				});
			});
			it('throws when base object is of incorrect type.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('(4).[2];').type(), TypeErrorInvalidOperation);
			});
		});
	});


	describe('#fold', () => {
		function foldStmtExpr(stmt: AST.ASTNodeStatement): VALUE.Value | null {
			assert_instanceof(stmt, AST.ASTNodeStatementExpression);
			return stmt.expr!.fold();
		}
		const expected: Array<VALUE.Value | null> = [
			new VALUE.Integer(1n),
			new VALUE.Float(2.0),
			new VALUE.String('three'),
			null,
			null,
			null,
		];
		const expected_o: Array<VALUE.Value | null> = [
			new VALUE.String('three'),
			null,
			null,
		];

		context('access by computed expression.', () => {
			let program: AST.ASTNodeGoal; // eslint-disable-line @typescript-eslint/init-declarations
			before(() => {
				program = AST.ASTNodeGoal.fromSource(EXPR_ACCESS_SRC);
				program.varCheck();
				program.typeCheck();
			});
			it('returns individual entries for tuples.', () => {
				assert.deepStrictEqual(
					program.children.slice(12, 18).map((c) => foldStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(46, 49).map((c) => foldStmtExpr(c)),
					expected_o,
				);
				assert.deepStrictEqual(
					program.children.slice(55, 58).map((c) => foldStmtExpr(c)),
					expected_o,
				);
			});
			it('returns individual entries for lists.', () => {
				assert.deepStrictEqual(
					program.children.slice(18, 24).map((c) => foldStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(49, 51).map((c) => foldStmtExpr(c)),
					[
						new VALUE.String('three'),
						null,
					],
				);
			});
			it('returns individual entries for sets.', () => {
				assert.deepStrictEqual(
					program.children.slice(24, 30).map((c) => foldStmtExpr(c)),
					[
						VALUE.TRUE,
						VALUE.TRUE,
						VALUE.TRUE,
						null,
						null,
						null,
					],
				);
				assert.deepStrictEqual(
					program.children.slice(51, 53).map((c) => foldStmtExpr(c)),
					[
						VALUE.TRUE,
						null,
					],
				);
			});
			it('returns individual entries for maps.', () => {
				assert.deepStrictEqual(
					program.children.slice(30, 36).map((c) => foldStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(53, 55).map((c) => foldStmtExpr(c)),
					[
						new VALUE.String('three'),
						null,
					],
				);
			});
			it('throws when accessor expression is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"].[3];')                                .fold(), VoidError01);
				assert.throws(() => AST.ASTNodeAccess.fromSource('{["a"] -> 1, ["b"] -> 2.0, ["c"] -> "three"}.[["d"]];') .fold(), VoidError01);
			});
			it('returns false when (optionally) accessing element not in set.', () => {
				[
					'{1, 2.0, "three"} .[3];',
					'{1, 2.0, "three"}?.[3];',
				].forEach((src) => assert.deepStrictEqual(
					AST.ASTNodeAccess.fromSource(src).fold(),
					VALUE.FALSE,
				));
			});
			it('returns null when optionally accessing index/antecedent out of bounds.', () => {
				[
					AST.ASTNodeAccess.fromSource('[1, 2.0, "three"]?.[3];')                                .fold(),
					AST.ASTNodeAccess.fromSource('{["a"] -> 1, ["b"] -> 2.0, ["c"] -> "three"}?.[["d"]];') .fold(),
				].forEach((v) => {
					assert.strictEqual(v, VALUE.NULL);
				});
			});
		});
	});
});
