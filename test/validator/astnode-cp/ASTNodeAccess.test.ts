import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	AST,
	VALUE,
	TYPE,
	type Builder,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
	VoidError01,
} from '../../../src/index.ts';
import {assert_instanceof} from '../../../src/lib/index.ts';
import {assertEqualBins} from '../../assert-helpers.ts';
import {
	CONFIG_FOLDING_OFF,
	typeUnit,
	buildConst,
} from '../../helpers.ts';
import {setup} from '../../builder/utils.test.ts';



describe('ASTNodeAccess', () => {
	const INDEX_ACCESS_SRC: string = `
		%% statements 0 – 4 %%
		val     tup_fixed:    [int, float, str]     = [1, 2.0, "three"];
		val mut tup_unfixed:  [int, float, str]     = [1, 2.0, "three"];
		val     list_fixed:   (int | float | str)[] = List.<int | float | str>([1, 2.0, "three"]);
		val mut list_unfixed: (int | float | str)[] = List.<int | float | str>([1, 2.0, "three"]);

		%% statements 4 – 10 %%
		tup_fixed.0;   % type \`1\`       % value \`1\`
		tup_fixed.1;   % type \`2.0\`     % value \`2.0\`
		tup_fixed.2;   % type \`"three"\` % value \`"three"\`
		tup_unfixed.0; % type \`int\`     % non-computable value
		tup_unfixed.1; % type \`float\`   % non-computable value
		tup_unfixed.2; % type \`str\`     % non-computable value

		%% statements 10 – 16 %%
		list_fixed.0;   % type \`1\`                 % value \`1\`
		list_fixed.1;   % type \`2.0\`               % value \`2.0\`
		list_fixed.2;   % type \`"three"\`           % value \`"three"\`
		list_unfixed.0; % type \`int | float | str\` % non-computable value
		list_unfixed.1; % type \`int | float | str\` % non-computable value
		list_unfixed.2; % type \`int | float | str\` % non-computable value

		%% statements 16 – 22 %%
		tup_fixed.-3;   % type \`1\`       % value \`1\`
		tup_fixed.-2;   % type \`2.0\`     % value \`2.0\`
		tup_fixed.-1;   % type \`"three"\` % value \`"three"\`
		tup_unfixed.-3; % type \`int\`     % non-computable value
		tup_unfixed.-2; % type \`float\`   % non-computable value
		tup_unfixed.-1; % type \`str\`     % non-computable value

		%% statements 22 – 28 %%
		list_fixed.-3;   % type \`1\`                 % value \`1\`
		list_fixed.-2;   % type \`2.0\`               % value \`2.0\`
		list_fixed.-1;   % type \`"three"\`           % value \`"three"\`
		list_unfixed.-3; % type \`int | float | str\` % non-computable value
		list_unfixed.-2; % type \`int | float | str\` % non-computable value
		list_unfixed.-1; % type \`int | float | str\` % non-computable value

		%% statements 28 – 36 %%
		val     tupo1_f: [int, float, ?: str] = [1, 2.0, "three"];
		val     tupo2_f: [int, float, ?: str] = [1, 2.0];
		val     tupo3_f: [int, float]         = [1, 2.0, true];
		val     tupo4_f: [int, float]         = [1, 2.0];
		val mut tupo1_u: [int, float, ?: str] = [1, 2.0, "three"];
		val mut tupo2_u: [int, float, ?: str] = [1, 2.0];
		val mut tupo3_u: [int, float]         = [1, 2.0, true];
		val mut tupo4_u: [int, float]         = [1, 2.0];

		%% statements 36 – 38 %%
		tupo1_u.2; % type \`str | void\` % non-computable value
		tupo2_u.2; % type \`str | void\` % non-computable value

		%% statements 38 – 41 %%
		tupo1_f?.2; % type \`"three"\` % value \`"three"\`
		tupo1_u?.2; % type \`str?\`    % non-computable value
		tupo2_u?.2; % type \`str?\`    % non-computable value

		%% statements 41 – 43 %%
		list_fixed  ?.2; % type \`"three"\`                  % value \`"three"\`
		list_unfixed?.2; % type \`int | float | str | null\` % non-computable value

		%% statements 43 – 46 %%
		tupo1_f!.2; % type \`"three"\` % value \`"three"\`
		tupo1_u!.2; % type \`str\`     % non-computable value
		tupo2_u!.2; % type \`str\`     % non-computable value

		%% statements 46 – 48 %%
		val mut tupvoid: [int | void] = [42];
		tupvoid!.0; % type \`int\` % non-computable value
	`;
	const KEY_ACCESS_SRC: string = `
		%% statements 0 – 4 %%
		val     rec_fixed:    [a: int, b: float, _: str] = [a= 1, b= 2.0, _= "three"];
		val mut rec_unfixed:  [a: int, b: float, _: str] = [a= 1, b= 2.0, _= "three"];
		val     dict_fixed:   [: int | float | str]      = Dict.<int | float | str>([a= 1, b= 2.0, _= "three"]);
		val mut dict_unfixed: [: int | float | str]      = Dict.<int | float | str>([a= 1, b= 2.0, _= "three"]);

		%% statements 4 – 10 %%
		rec_fixed.a;   % type \`1\`       % value \`1\`
		rec_fixed.b;   % type \`2.0\`     % value \`2.0\`
		rec_fixed._;   % type \`"three"\` % value \`"three"\`
		rec_unfixed.a; % type \`int\`     % non-computable value
		rec_unfixed.b; % type \`float\`   % non-computable value
		rec_unfixed._; % type \`str\`     % non-computable value

		%% statements 10 – 16 %%
		dict_fixed.a;   % type \`1\`                 % value \`1\`
		dict_fixed.b;   % type \`2.0\`               % value \`2.0\`
		dict_fixed._;   % type \`"three"\`           % value \`"three"\`
		dict_unfixed.a; % type \`int | float | str\` % non-computable value
		dict_unfixed.b; % type \`int | float | str\` % non-computable value
		dict_unfixed._; % type \`int | float | str\` % non-computable value

		%% statements 16 – 24 %%
		val     reco1_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
		val     reco2_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0];
		val     reco3_f: [a: int, c: float]          = [a= 1, c= 2.0, b= true];
		val     reco4_f: [a: int, c: float]          = [a= 1, c= 2.0];
		val mut reco1_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= "three"];
		val mut reco2_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0];
		val mut reco3_u: [a: int, c: float]          = [a= 1, c= 2.0, b= true];
		val mut reco4_u: [a: int, c: float]          = [a= 1, c= 2.0];

		%% statements 24 – 26 %%
		reco1_u.b; % type \`str | void\` % non-computable value
		reco2_u.b; % type \`str | void\` % non-computable value

		%% statements 26 – 29 %%
		reco1_f?.b; % type \`"three"\` % value \`"three"\`
		reco1_u?.b; % type \`str?\`    % non-computable value
		reco2_u?.b; % type \`str?\`    % non-computable value

		%% statements 29 – 31 %%
		dict_fixed?._;   % type \`"three"\`                  % value \`"three"\`
		dict_unfixed?._; % type \`int | float | str | null\` % non-computable value

		%% statements 31 – 34 %%
		reco1_f!.b; % type \`"three"\` % value \`"three"\`
		reco1_u!.b; % type \`str\`     % non-computable value
		reco2_u!.b; % type \`str\`     % non-computable value

		%% statements 34 – 36 %%
		val mut recvoid: [c: int | void] = [c= 42];
		recvoid!.c; % type \`int\` % non-computable value
	`;
	const EXPR_ACCESS_SRC: string = `
		%% statements 0 – 4 %%
		val a: [str] = ["a"];
		val b: [str] = ["b"];
		val c: [str] = ["c"];
		val mut three: str = "three";

		%% statements 4 – 10 %%
		val     tup_fixed:    [int, float, str]              = [1, 2.0, "three"];
		val mut tup_unfixed:  [int, float, str]              = [1, 2.0, "three"];
		val     list_fixed:   (int | float | str)[]          = List.<int | float | str>([1, 2.0, "three"]);
		val mut list_unfixed: List.<int | float | str>       = List.<int | float | str>([1, 2.0, "three"]);
		val     set_fixed:    (int | float | str){}          = {1, 2.0, "three"};
		val mut set_unfixed:  Set.<int | float | str>        = {1, 2.0, three};
		val     map_fixed:    {[str] -> int | float | str}   = {a -> 1, b -> 2.0, c -> "three"};
		val mut map_unfixed:  Map.<[str], int | float | str> = {a -> 1, b -> 2.0, c -> three};

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
		val     tupo1_f: [int, float, ?: str] = [1, 2.0, "three"];
		val     tupo2_f: [int, float, ?: str] = [1, 2.0];
		val     tupo3_f: [int, float]         = [1, 2.0, true];
		val     tupo4_f: [int, float]         = [1, 2.0];
		val mut tupo1_u: [int, float, ?: str] = [1, 2.0, "three"];
		val mut tupo2_u: [int, float, ?: str] = [1, 2.0];
		val mut tupo3_u: [int, float]         = [1, 2.0, true];
		val mut tupo4_u: [int, float]         = [1, 2.0];

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
		context('when base is nullish.', () => {
			it('optional access returns type of base when it is a subtype of null.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.4;')          .type(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.four;')       .type(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.[[[[[]]]]];') .type(), TypeErrorInvalidOperation);
				[
					AST.ASTNodeAccess.fromSource('null?.3;')          .type(),
					AST.ASTNodeAccess.fromSource('null?.four;')       .type(),
					AST.ASTNodeAccess.fromSource('null?.[[[[[]]]]];') .type(),
				].forEach((t) => {
					assert.ok(t.isSubtypeOf(TYPE.NULL));
				});
			});
			it('chained optional access.', () => {
				const program: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut bound1: [prop?: [bool]] = [prop= [true]];
					val mut bound2: [prop?: [?: bool]] = [prop= []];

					bound1;          % type \`[prop?: [bool]]\`
					bound1?.prop;    % type \`[bool] | null\`
					bound1?.prop?.0; % type \`bool | null\`

					bound2;          % type \`[prop?: [?: bool]]\`
					bound2?.prop;    % type \`[?: bool] | null\`
					bound2?.prop?.0; % type \`bool | null\`
				`);
				program.varCheck();
				program.typeCheck();
				const prop1: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL]);
				const prop2             = new TYPE.Tuple([{type: TYPE.BOOL, optional: true}]);
				assert.deepStrictEqual(
					program.children.slice(2, 8).map((c) => typeOfStmtExpr(c)),
					[
						new TYPE.Record(new Map([[0x100n, {type: prop1, optional: true}]])),
						prop1.union(TYPE.NULL),
						TYPE.BOOL.union(TYPE.NULL),
						new TYPE.Record(new Map([[0x100n, {type: prop2, optional: true}]])),
						prop2.union(TYPE.NULL),
						TYPE.BOOL.union(TYPE.NULL),
					],
				);
			});
		});

		context('access by index.', () => {
			let program: AST.ASTNodeGoal; // eslint-disable-line @typescript-eslint/init-declarations
			before(() => {
				program = AST.ASTNodeGoal.fromSource(INDEX_ACCESS_SRC);
				program.varCheck();
				program.typeCheck();
			});
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(4, 10).map((c) => typeOfStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(10, 16).map((c) => typeOfStmtExpr(c)),
					[
						...expected.slice(0, 3),
						COMMON_TYPES.int_float_str,
						COMMON_TYPES.int_float_str,
						COMMON_TYPES.int_float_str,
					],
				);
			});
			it('negative indices count backwards from end.', () => {
				assert.deepStrictEqual(
					program.children.slice(16, 22).map((c) => typeOfStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(22, 28).map((c) => typeOfStmtExpr(c)),
					[
						...expected.slice(0, 3),
						COMMON_TYPES.int_float_str,
						COMMON_TYPES.int_float_str,
						COMMON_TYPES.int_float_str,
					],
				);
			});
			it('unions with void if entry is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(36, 38).map((c) => typeOfStmtExpr(c)),
					[
						TYPE.STR.union(TYPE.VOID),
						TYPE.STR.union(TYPE.VOID),
					],
				);
			});
			it('unions with null if entry and access are optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(38, 41).map((c) => typeOfStmtExpr(c)),
					expected_o,
				);
			});
			it('unions with null for lists if access is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(41, 43).map((c) => typeOfStmtExpr(c)),
					[
						typeUnit('three'),
						COMMON_TYPES.int_float_str.union(TYPE.NULL),
					],
				);
			});
			it('claim access always subtracts void.', () => {
				assert.deepStrictEqual(
					[
						...program.children.slice(43, 46),
						program.children[47],
					].map((c) => typeOfStmtExpr(c)),
					[
						...expected_c,
						TYPE.INT,
					],
				);
			});
			it('throws when index is out of bounds for tuples.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"].3;')   .type(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"].-4;')  .type(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"]?.3;')  .type(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"]?.-4;') .type(), TypeErrorNoEntry);
			});
			it('returns the list item type when index is out of bounds for lists.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut list: (int | float | str)[] = List.<int | float| str>([1, 2.0, "three"]);
					list.3;
					list.-4;
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
		});

		context('access by key.', () => {
			let program: AST.ASTNodeGoal; // eslint-disable-line @typescript-eslint/init-declarations
			before(() => {
				program = AST.ASTNodeGoal.fromSource(KEY_ACCESS_SRC);
				program.varCheck();
				program.typeCheck();
			});
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(4, 10).map((c) => typeOfStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(10, 16).map((c) => typeOfStmtExpr(c)),
					[
						...expected.slice(0, 3),
						COMMON_TYPES.int_float_str,
						COMMON_TYPES.int_float_str,
						COMMON_TYPES.int_float_str,
					],
				);
			});
			it('unions with void if entry is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(24, 26).map((c) => typeOfStmtExpr(c)),
					[
						TYPE.STR.union(TYPE.VOID),
						TYPE.STR.union(TYPE.VOID),
					],
				);
			});
			it('unions with null if entry and access are optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(26, 29).map((c) => typeOfStmtExpr(c)),
					expected_o,
				);
			});
			it('unions with null for dicts if access is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(29, 31).map((c) => typeOfStmtExpr(c)),
					[
						typeUnit('three'),
						COMMON_TYPES.int_float_str.union(TYPE.NULL),
					],
				);
			});
			it('claim access always subtracts void.', () => {
				assert.deepStrictEqual(
					[
						...program.children.slice(31, 34),
						program.children[35],
					].map((c) => typeOfStmtExpr(c)),
					[
						...expected_c,
						TYPE.INT,
					],
				);
			});
			it('throws when key is out of bounds for records.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('[a= 1, b= 2.0, c= "three"].d;')  .type(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeAccess.fromSource('[a= 1, b= 2.0, c= "three"]?.d;') .type(), TypeErrorNoEntry);
			});
			it('returns the dict item type when key is out of bounds for dicts.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut dict: [: int | float | str] = Dict.<int | float| str>([a= 1, b= 2.0, c= "three"]);
					dict.d;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.deepStrictEqual(
					typeOfStmtExpr(goal.children[1]),
					COMMON_TYPES.int_float_str,
				);
			});
		});

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
						val mut list: (int | float | str)[] = List.<int | float| str>([1, 2.0, "three"]);
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

		context('when base is nullish.', () => {
			it('optional access returns base when it is null.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.4;')          .fold());
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.four;')       .fold());
				assert.throws(() => AST.ASTNodeAccess.fromSource('null.[[[[[]]]]];') .fold());
				[
					AST.ASTNodeAccess.fromSource('null?.3;')          .fold(),
					AST.ASTNodeAccess.fromSource('null?.four;')       .fold(),
					AST.ASTNodeAccess.fromSource('null?.[[[[[]]]]];') .fold(),
				].forEach((t) => {
					assert.strictEqual(t, VALUE.NULL);
				});
			});
			it('chained optional access.', () => {
				const program: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val bound1: [prop?: [bool]] = [prop= [true]];
					val bound2: [prop?: [?: bool]] = [prop= []];

					bound1;          % value \`[prop= [true]]\`
					bound1?.prop;    % value \`[true]\`
					bound1?.prop?.0; % value \`true\`

					bound2;          % value \`[prop= []]\`
					bound2?.prop;    % value \`[]\`
				`);
				program.varCheck();
				program.typeCheck();
				const prop1 = new VALUE.Tuple([VALUE.TRUE]);
				const prop2 = new VALUE.Tuple();
				assert.deepStrictEqual(
					program.children.slice(2, 7).map((c) => foldStmtExpr(c)),
					[
						new VALUE.Record(new Map([[0x100n, prop1]])),
						prop1,
						VALUE.TRUE,
						new VALUE.Record(new Map([[0x100n, prop2]])),
						prop2,
					],
				);
				// must bypass type-checker:
				assert.strictEqual(
					AST.ASTNodeAccess.fromSource('[prop= []]?.prop?.0;').fold(),
					VALUE.NULL,
				);
			});
		});

		context('access by index.', () => {
			let program: AST.ASTNodeGoal; // eslint-disable-line @typescript-eslint/init-declarations
			before(() => {
				program = AST.ASTNodeGoal.fromSource(INDEX_ACCESS_SRC);
				program.varCheck();
				program.typeCheck();
			});
			it('returns individual entries.', () => {
				assert.deepStrictEqual(
					program.children.slice(4, 10).map((c) => foldStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(10, 16).map((c) => foldStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(38, 41).map((c) => foldStmtExpr(c)),
					expected_o,
				);
				assert.deepStrictEqual(
					[
						...program.children.slice(43, 46),
						program.children[47],
					].map((c) => foldStmtExpr(c)),
					[
						...expected_o,
						null,
					],
				);
			});
			it('negative indices count backwards from end.', () => {
				assert.deepStrictEqual(
					program.children.slice(16, 22).map((c) => foldStmtExpr(c)),
					expected,
				);
			});
			it('throws when index is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"].3;')  .fold(), VoidError01);
				assert.throws(() => AST.ASTNodeAccess.fromSource('[1, 2.0, "three"].-4;') .fold(), VoidError01);
			});
			it('returns null when optionally accessing index out of bounds.', () => {
				[
					AST.ASTNodeAccess.fromSource('[1, 2.0, "three"]?.3;')  .fold(),
					AST.ASTNodeAccess.fromSource('[1, 2.0, "three"]?.-4;') .fold(),
				].forEach((v) => {
					assert.strictEqual(v, VALUE.NULL);
				});
			});
		});

		context('access by key.', () => {
			let program: AST.ASTNodeGoal; // eslint-disable-line @typescript-eslint/init-declarations
			before(() => {
				program = AST.ASTNodeGoal.fromSource(KEY_ACCESS_SRC);
				program.varCheck();
				program.typeCheck();
			});
			it('returns individual entries.', () => {
				assert.deepStrictEqual(
					program.children.slice(4, 10).map((c) => foldStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(10, 16).map((c) => foldStmtExpr(c)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(26, 29).map((c) => foldStmtExpr(c)),
					expected_o,
				);
				assert.deepStrictEqual(
					program.children.slice(29, 31).map((c) => foldStmtExpr(c)),
					expected_o.slice(0, 2),
				);
				assert.deepStrictEqual(
					[
						...program.children.slice(31, 34),
						program.children[35],
					].map((c) => foldStmtExpr(c)),
					[
						...expected_o,
						null,
					],
				);
			});
			it('throws when key is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource('[a= 1, b= 2.0, c= "three"].d;').fold(), VoidError01);
			});
			it('returns null when optionally accessing key out of bounds.', () => {
				assert.strictEqual(
					AST.ASTNodeAccess.fromSource('[a= 1, b= 2.0, c= "three"]?.d;').fold(),
					VALUE.NULL,
				);
			});
		});

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

	describe('#build', () => {
		it('tuple access.', () => {
			function tuple(builder: Builder): binaryen.ExpressionRef {
				const inner01: binaryen.ExpressionRef = builder.module.struct.new([
					buildConst(builder, 2.2),
					buildConst(builder, 3.3),
				], builder.typeBuilder.getTempHeapType(2));
				const inner0: binaryen.ExpressionRef = builder.module.struct.new([
					builder.module.local.get(0, binaryen.v128),
					inner01,
				], builder.typeBuilder.getTempHeapType(1));
				const inner10: binaryen.ExpressionRef = builder.module.struct.new([
					buildConst(builder, 4.4),
				], builder.typeBuilder.getTempHeapType(4));
				const inner11: binaryen.ExpressionRef = builder.module.struct.new([
					buildConst(builder, 5.5),
					buildConst(builder, 6.6),
				], builder.typeBuilder.getTempHeapType(5));
				const inner1: binaryen.ExpressionRef = builder.module.struct.new([
					inner10,
					inner11,
				], builder.typeBuilder.getTempHeapType(3));
				return builder.module.struct.new([
					inner0,
					inner1,
				], builder.typeBuilder.getTempHeapType(0));
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
				const {builder, expr} = setup(`
					val mut x: float = 1.1;
					[[x, [2.2, 3.3]], [[4.4], [5.5, 6.6]]]${ access_src };
				`);
				return assertEqualBins(
					expr,
					expected_fn.call(null, builder),
				);
			});
		});

		it('accessing tuple pointers.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut tuple: [[float, float[2]], [[float], float[2]]] = [[1.1, [2.2, 3.3]], [[4.4], [5.5, 6.6]]];
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
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.build();
			const mod = goal.builder.module;
			const tb  = goal.builder.typeBuilder;
			const tuple: binaryen.ExpressionRef = mod.local.get(0, tb.getTempHeapType(0));
			return assertEqualBins(
				goal.children.slice(1).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.build()),
				[
					mod.struct.get(0, tuple, tb.getTempHeapType(0)),
					mod.struct.get(1, tuple, tb.getTempHeapType(0)),
					mod.struct.get(0, mod.struct.get(0, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(1)),
					mod.struct.get(1, mod.struct.get(0, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(1)),
					mod.struct.get(0, mod.struct.get(1, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(3)),
					mod.struct.get(1, mod.struct.get(1, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(3)),
					mod.struct.get(0, mod.struct.get(1, mod.struct.get(0, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(1)), tb.getTempHeapType(2)),
					mod.struct.get(1, mod.struct.get(1, mod.struct.get(0, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(1)), tb.getTempHeapType(2)),
					mod.struct.get(0, mod.struct.get(0, mod.struct.get(1, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(3)), tb.getTempHeapType(4)),
					mod.struct.get(0, mod.struct.get(1, mod.struct.get(1, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(3)), tb.getTempHeapType(5)),
					mod.struct.get(1, mod.struct.get(1, mod.struct.get(1, tuple, tb.getTempHeapType(0)), tb.getTempHeapType(3)), tb.getTempHeapType(5)),
				],
			);
		});
	});
});
