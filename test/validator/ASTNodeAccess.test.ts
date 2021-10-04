import * as assert from 'assert'
import {
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidType,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidRecord,
	TypeError01,
	TypeError02,
	TypeError04,
	VoidError01,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	CONFIG_FOLDING_OFF,
	TYPE_CONST_NULL,
	typeConstInt,
	typeConstFloat,
	typeConstStr,
} from '../helpers.js';



describe('ASTNodeAccess', () => {
	function programFactory(src: string): (validator: Validator) => AST.ASTNodeGoal {
		return (validator: Validator) => AST.ASTNodeGoal.fromSource(src, validator.config);
	}
	const INDEX_ACCESS_PROGRAM = programFactory(`
		%% statements 0 – 4 %%
		let         tup_fixed:    [int, float, str]     = [1, 2.0, 'three'];
		let unfixed tup_unfixed:  [int, float, str]     = [1, 2.0, 'three'];
		let         list_fixed:   (int | float | str)[] = List.<int | float | str>([1, 2.0, 'three']);
		let unfixed list_unfixed: (int | float | str)[] = List.<int | float | str>([1, 2.0, 'three']);

		%% statements 4 – 10 %%
		tup_fixed.0;   % type \`1\`       % value \`1\`
		tup_fixed.1;   % type \`2.0\`     % value \`2.0\`
		tup_fixed.2;   % type \`'three'\` % value \`'three'\`
		tup_unfixed.0; % type \`int\`     % non-computable value
		tup_unfixed.1; % type \`float\`   % non-computable value
		tup_unfixed.2; % type \`str\`     % non-computable value

		%% statements 10 – 16 %%
		list_fixed.0;   % type \`1\`                 % value \`1\`
		list_fixed.1;   % type \`2.0\`               % value \`2.0\`
		list_fixed.2;   % type \`'three'\`           % value \`'three'\`
		list_unfixed.0; % type \`int | float | str\` % non-computable value
		list_unfixed.1; % type \`int | float | str\` % non-computable value
		list_unfixed.2; % type \`int | float | str\` % non-computable value

		%% statements 16 – 22 %%
		tup_fixed.-3;   % type \`1\`       % value \`1\`
		tup_fixed.-2;   % type \`2.0\`     % value \`2.0\`
		tup_fixed.-1;   % type \`'three'\` % value \`'three'\`
		tup_unfixed.-3; % type \`int\`     % non-computable value
		tup_unfixed.-2; % type \`float\`   % non-computable value
		tup_unfixed.-1; % type \`str\`     % non-computable value

		%% statements 22 – 28 %%
		list_fixed.-3;   % type \`1\`                 % value \`1\`
		list_fixed.-2;   % type \`2.0\`               % value \`2.0\`
		list_fixed.-1;   % type \`'three'\`           % value \`'three'\`
		list_unfixed.-3; % type \`int | float | str\` % non-computable value
		list_unfixed.-2; % type \`int | float | str\` % non-computable value
		list_unfixed.-1; % type \`int | float | str\` % non-computable value

		%% statements 28 – 36 %%
		let         tupo1_f: [int, float, ?: str] = [1, 2.0, 'three'];
		let         tupo2_f: [int, float, ?: str] = [1, 2.0];
		let         tupo3_f: [int, float]         = [1, 2.0, true];
		let         tupo4_f: [int, float]         = [1, 2.0];
		let unfixed tupo1_u: [int, float, ?: str] = [1, 2.0, 'three'];
		let unfixed tupo2_u: [int, float, ?: str] = [1, 2.0];
		let unfixed tupo3_u: [int, float]         = [1, 2.0, true];
		let unfixed tupo4_u: [int, float]         = [1, 2.0];

		%% statements 36 – 38 %%
		tupo1_u.2; % type \`str | void\` % non-computable value
		tupo2_u.2; % type \`str | void\` % non-computable value

		%% statements 38 – 42 %%
		tupo1_f?.2; % type \`'three'\` % value \`'three'\`
		tupo1_u?.2; % type \`str?\`    % non-computable value
		tupo2_u?.2; % type \`str?\`    % non-computable value
		null;

		%% statements 42 – 44 %%
		list_fixed  ?.2; % type \`'three'\`                  % value \`'three'\`
		list_unfixed?.2; % type \`int | float | str | null\` % non-computable value

		%% statements 44 – 48 %%
		tupo1_f!.2; % type \`'three'\` % value \`'three'\`
		tupo1_u!.2; % type \`str\`     % non-computable value
		tupo2_u!.2; % type \`str\`     % non-computable value
		null;

		%% statements 48 – 50 %%
		let unfixed tupvoid: [int | void] = [42];
		tupvoid!.0; % type \`int\` % non-computable value
	`);
	const KEY_ACCESS_PROGRAM = programFactory(`
		%% statements 0 – 4 %%
		let         rec_fixed:    [a: int, b: float, c: str] = [a= 1, b= 2.0, c= 'three'];
		let unfixed rec_unfixed:  [a: int, b: float, c: str] = [a= 1, b= 2.0, c= 'three'];
		let         hash_fixed:   [: int | float | str]      = Hash.<int | float | str>([a= 1, b= 2.0, c= 'three']);
		let unfixed hash_unfixed: [: int | float | str]      = Hash.<int | float | str>([a= 1, b= 2.0, c= 'three']);

		%% statements 4 – 10 %%
		rec_fixed.a;   % type \`1\`       % value \`1\`
		rec_fixed.b;   % type \`2.0\`     % value \`2.0\`
		rec_fixed.c;   % type \`'three'\` % value \`'three'\`
		rec_unfixed.a; % type \`int\`     % non-computable value
		rec_unfixed.b; % type \`float\`   % non-computable value
		rec_unfixed.c; % type \`str\`     % non-computable value

		%% statements 10 – 16 %%
		hash_fixed.a;   % type \`1\`                 % value \`1\`
		hash_fixed.b;   % type \`2.0\`               % value \`2.0\`
		hash_fixed.c;   % type \`'three'\`           % value \`'three'\`
		hash_unfixed.a; % type \`int | float | str\` % non-computable value
		hash_unfixed.b; % type \`int | float | str\` % non-computable value
		hash_unfixed.c; % type \`int | float | str\` % non-computable value

		%% statements 16 – 24 %%
		let         reco1_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= 'three'];
		let         reco2_f: [a: int, c: float, b?: str] = [a= 1, c= 2.0];
		let         reco3_f: [a: int, c: float]          = [a= 1, c= 2.0, b= true];
		let         reco4_f: [a: int, c: float]          = [a= 1, c= 2.0];
		let unfixed reco1_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0, b= 'three'];
		let unfixed reco2_u: [a: int, c: float, b?: str] = [a= 1, c= 2.0];
		let unfixed reco3_u: [a: int, c: float]          = [a= 1, c= 2.0, b= true];
		let unfixed reco4_u: [a: int, c: float]          = [a= 1, c= 2.0];

		%% statements 24 – 26 %%
		reco1_u.b; % type \`str | void\` % non-computable value
		reco2_u.b; % type \`str | void\` % non-computable value

		%% statements 26 – 30 %%
		reco1_f?.b; % type \`'three'\` % value \`'three'\`
		reco1_u?.b; % type \`str?\`    % non-computable value
		reco2_u?.b; % type \`str?\`    % non-computable value
		null;

		%% statements 30 – 32 %%
		hash_fixed?.c;   % type \`'three'\`                  % value \`'three'\`
		hash_unfixed?.c; % type \`int | float | str | null\` % non-computable value

		%% statements 32 – 36 %%
		reco1_f!.b; % type \`'three'\` % value \`'three'\`
		reco1_u!.b; % type \`str\`     % non-computable value
		reco2_u!.b; % type \`str\`     % non-computable value
		null;

		%% statements 36 – 38 %%
		let unfixed recvoid: [c: int | void] = [c= 42];
		recvoid!.c; % type \`int\` % non-computable value
	`);
	const EXPR_ACCESS_PROGRAM = programFactory(`
		%% statements 0 – 4 %%
		let a: [str] = ['a'];
		let b: [str] = ['b'];
		let c: [str] = ['c'];
		let unfixed three: str = 'three';

		%% statements 4 – 10 %%
		let         tup_fixed:    [int, float, str]              = [1, 2.0, 'three'];
		let unfixed tup_unfixed:  [int, float, str]              = [1, 2.0, 'three'];
		let         list_fixed:   (int | float | str)[]          = List.<int | float | str>([1, 2.0, 'three']);
		let unfixed list_unfixed: List.<int | float | str>       = List.<int | float | str>([1, 2.0, 'three']);
		let         set_fixed:    (int | float | str){}          = {1, 2.0, 'three'};
		let unfixed set_unfixed:  Set.<int | float | str>        = {1, 2.0, three};
		let         map_fixed:    {[str] -> int | float | str}   = {a -> 1, b -> 2.0, c -> 'three'};
		let unfixed map_unfixed:  Map.<[str], int | float | str> = {a -> 1, b -> 2.0, c -> three};

		%% statements 12 – 18 %%
		tup_fixed  .[0 + 0]; % type \`1\`       % value \`1\`
		tup_fixed  .[0 + 1]; % type \`2.0\`     % value \`2.0\`
		tup_fixed  .[0 + 2]; % type \`'three'\` % value \`'three'\`
		tup_unfixed.[0 + 0]; % type \`int\`     % non-computable value
		tup_unfixed.[0 + 1]; % type \`float\`   % non-computable value
		tup_unfixed.[0 + 2]; % type \`str\`     % non-computable value

		%% statements 18 – 24 %%
		list_fixed  .[0 + 0]; % type \`1\`                 % value \`1\`
		list_fixed  .[0 + 1]; % type \`2.0\`               % value \`2.0\`
		list_fixed  .[0 + 2]; % type \`'three'\`           % value \`'three'\`
		list_unfixed.[0 + 0]; % type \`int | float | str\` % non-computable value
		list_unfixed.[0 + 1]; % type \`int | float | str\` % non-computable value
		list_unfixed.[0 + 2]; % type \`int | float | str\` % non-computable value

		%% statements 24 – 30 %%
		set_fixed  .[1];       % type \`1\`                 % value \`1\`
		set_fixed  .[2.0];     % type \`2.0\`               % value \`2.0\`
		set_fixed  .['three']; % type \`'three'\`           % value \`'three'\`
		set_unfixed.[1];       % type \`int | float | str\` % non-computable value
		set_unfixed.[2.0];     % type \`int | float | str\` % non-computable value
		set_unfixed.['three']; % type \`int | float | str\` % non-computable value

		%% statements 30 – 36 %%
		map_fixed  .[a]; % type \`1\`             % value \`1\`
		map_fixed  .[b]; % type \`2.0\`           % value \`2.0\`
		map_fixed  .[c]; % type \`'three'\`       % value \`'three'\`
		map_unfixed.[a]; % type \`1 | 2.0 | str\` % non-computable value
		map_unfixed.[b]; % type \`1 | 2.0 | str\` % non-computable value
		map_unfixed.[c]; % type \`1 | 2.0 | str\` % non-computable value

		%% statements 36 – 44 %%
		let         tupo1_f: [int, float, ?: str] = [1, 2.0, 'three'];
		let         tupo2_f: [int, float, ?: str] = [1, 2.0];
		let         tupo3_f: [int, float]         = [1, 2.0, true];
		let         tupo4_f: [int, float]         = [1, 2.0];
		let unfixed tupo1_u: [int, float, ?: str] = [1, 2.0, 'three'];
		let unfixed tupo2_u: [int, float, ?: str] = [1, 2.0];
		let unfixed tupo3_u: [int, float]         = [1, 2.0, true];
		let unfixed tupo4_u: [int, float]         = [1, 2.0];

		%% statements 44 – 46 %%
		tupo1_u.[0 + 2]; % type \`str | void\` % non-computable value
		tupo2_u.[0 + 2]; % type \`str | void\` % non-computable value

		%% statements 46 – 50 %%
		tupo1_f?.[0 + 2]; % type \`'three'\` % value \`'three'\`
		tupo1_u?.[0 + 2]; % type \`str?\`    % non-computable value
		tupo2_u?.[0 + 2]; % type \`str?\`    % non-computable value
		null;

		%% statements 50 – 56 %%
		list_fixed  ?.[2];       % type \`'three'\`                  % value \`'three'\`
		list_unfixed?.[2];       % type \`int | float | str | null\` % non-computable value
		set_fixed   ?.['three']; % type \`'three'\`                  % value \`'three'\`
		set_unfixed ?.[three];   % type \`int | float | str | null\` % non-computable value
		map_fixed   ?.[c];       % type \`'three'\`                  % value \`'three'\`
		map_unfixed ?.[c];       % type \`int | float | str | null\` % non-computable value

		%% statements 56 – 60 %%
		tupo1_f!.[0 + 2]; % type \`'three'\` % value \`'three'\`
		tupo1_u!.[0 + 2]; % type \`str\`     % non-computable value
		tupo2_u!.[0 + 2]; % type \`str\`     % non-computable value
		null;
	`);


	describe('#type', () => {
		function typeOfStmtExpr(stmt: AST.ASTNodeStatementExpression, validator: Validator): SolidType {
			return stmt.expr!.type(validator);
		}
		const COMMON_TYPES = {
			int_float: SolidType.unionAll([
				Int16,
				Float64,
			]),
			int_float_str: SolidType.unionAll([
				Int16,
				Float64,
				SolidString,
			]),
			int_float_str_null: SolidType.unionAll([
				Int16,
				Float64,
				SolidString,
				SolidNull,
			]),
		};
		const expected: SolidType[] = [
			typeConstInt(1n),
			typeConstFloat(2.0),
			typeConstStr('three'),
			Int16,
			Float64,
			SolidString,
		];
		const expected_o: SolidType[] = [
			typeConstStr('three'),
			SolidString.union(SolidNull),
			SolidString.union(SolidNull),
			TYPE_CONST_NULL,
		];
		const expected_c: SolidType[] = [
			typeConstStr('three'),
			SolidString,
			SolidString,
			TYPE_CONST_NULL,
		];
		context('when base is nullish.', () => {
			it('optional access returns type of base when it is a subtype of null.', () => {
				const validator: Validator = new Validator();
				assert.throws(() => AST.ASTNodeAccess.fromSource(`null.4;`)         .type(validator), TypeError04);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`null.four;`)      .type(validator), TypeError04);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`null.[[[[[]]]]];`).type(validator), TypeError01);
				[
					AST.ASTNodeAccess.fromSource(`null?.3;`)         .type(validator),
					AST.ASTNodeAccess.fromSource(`null?.four;`)      .type(validator),
					AST.ASTNodeAccess.fromSource(`null?.[[[[[]]]]];`).type(validator),
				].forEach((t) => {
					assert.ok(t.isSubtypeOf(SolidNull));
				});
			});
			it('chained optional access.', () => {
				const validator: Validator = new Validator();
				const program: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let unfixed bound1: [prop?: [bool]] = [prop= [true]];
					let unfixed bound2: [prop?: [?: bool]] = [prop= []];

					bound1;          % type \`[prop?: [bool]]\`
					bound1?.prop;    % type \`[bool] | null\`
					bound1?.prop?.0; % type \`bool | null\`

					bound2;          % type \`[prop?: [?: bool]]\`
					bound2?.prop;    % type \`[?: bool] | null\`
					bound2?.prop?.0; % type \`bool | null\`
				`);
				program.varCheck(validator);
				program.typeCheck(validator);
				const prop1: SolidTypeTuple = SolidTypeTuple.fromTypes([SolidBoolean]);
				const prop2: SolidTypeTuple = new SolidTypeTuple([{type: SolidBoolean, optional: true}]);
				assert.deepStrictEqual(
					program.children.slice(2, 8).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						new SolidTypeRecord(new Map([[0x101n, {type: prop1, optional: true}]])),
						prop1.union(SolidNull),
						SolidBoolean.union(SolidNull),
						new SolidTypeRecord(new Map([[0x101n, {type: prop2, optional: true}]])),
						prop2.union(SolidNull),
						SolidBoolean.union(SolidNull),
					],
				);
			});
		});

		context('access by index.', () => {
			let validator: Validator;
			let program: AST.ASTNodeGoal;
			before(() => {
				validator = new Validator();
				program = INDEX_ACCESS_PROGRAM(validator);
				program.varCheck(validator);
				program.typeCheck(validator);
			});
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(4, 10).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(10, 16).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
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
					program.children.slice(16, 22).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(22, 28).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
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
					program.children.slice(36, 38).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						SolidString.union(SolidType.VOID),
						SolidString.union(SolidType.VOID),
					],
				);
			});
			it('unions with null if entry and access are optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(38, 42).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected_o,
				);
			});
			it('unions with null for lists if access is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(42, 44).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						typeConstStr('three'),
						COMMON_TYPES.int_float_str.union(SolidNull),
					],
				);
			});
			it('claim access always subtracts void.', () => {
				assert.deepStrictEqual(
					[
						...program.children.slice(44, 48),
						program.children[49],
					].map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						...expected_c,
						Int16,
					],
				);
			});
			it('throws when index is out of bounds for tuples.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].3;`)  .type(validator), TypeError04);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].-4;`) .type(validator), TypeError04);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.3;`) .type(validator), TypeError04);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.-4;`).type(validator), TypeError04);
			});
			it('returns the list item type when index is out of bounds for lists.', () => {
				const validator: Validator = new Validator();
				const program: AST.ASTNodeGoal = programFactory(`
					let list: (int | float | str)[] = List.<int | float| str>([1, 2.0, 'three']);
					list.3;
					list.-4;
				`)(validator);
				program.varCheck(validator);
				program.typeCheck(validator);
				program.children.slice(1, 3).forEach((c) => {
					assert.deepStrictEqual(
						typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
						COMMON_TYPES.int_float_str,
					);
				});
			});
		});

		context('access by key.', () => {
			let validator: Validator;
			let program: AST.ASTNodeGoal;
			before(() => {
				validator = new Validator();
				program = KEY_ACCESS_PROGRAM(validator);
				program.varCheck(validator);
				program.typeCheck(validator);
			});
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(4, 10).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(10, 16).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
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
					program.children.slice(24, 26).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						SolidString.union(SolidType.VOID),
						SolidString.union(SolidType.VOID),
					],
				);
			});
			it('unions with null if entry and access are optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(26, 30).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected_o,
				);
			});
			it('unions with null for hashes if access is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(30, 32).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						typeConstStr('three'),
						COMMON_TYPES.int_float_str.union(SolidNull),
					],
				);
			});
			it('claim access always subtracts void.', () => {
				assert.deepStrictEqual(
					[
						...program.children.slice(32, 36),
						program.children[37],
					].map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						...expected_c,
						Int16,
					],
				);
			});
			it('throws when key is out of bounds for records.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[a= 1, b= 2.0, c= 'three'].d;`) .type(validator), TypeError04);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[a= 1, b= 2.0, c= 'three']?.d;`).type(validator), TypeError04);
			});
			it('returns the hash item type when key is out of bounds for hashes.', () => {
				const validator: Validator = new Validator();
				const program: AST.ASTNodeGoal = programFactory(`
					let list: [: int | float | str] = Hash.<int | float| str>([a= 1, b= 2.0, c= 'three']);
					list.d;
				`)(validator);
				program.varCheck(validator);
				program.typeCheck(validator);
				assert.deepStrictEqual(
					typeOfStmtExpr(program.children[1] as AST.ASTNodeStatementExpression, validator),
					COMMON_TYPES.int_float_str,
				);
			});
		});

		context('access by computed expression.', () => {
			context('with constant folding on, folds expression accessor.', () => {
				let validator: Validator;
				let program: AST.ASTNodeGoal;
				before(() => {
					validator = new Validator();
					program = EXPR_ACCESS_PROGRAM(validator);
					program.varCheck(validator);
					program.typeCheck(validator);
				});
				it('returns individual entry types for tuples.', () => {
					assert.deepStrictEqual(
						program.children.slice(12, 18).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						expected,
					);
				});
				it('returns the union of all element types, constants, for lists.', () => {
					assert.deepStrictEqual(
						program.children.slice(18, 24).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						[
							...expected.slice(0, 3),
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
						],
					);
				});
				it('returns the union of all element types, constants, for sets.', () => {
					assert.deepStrictEqual(
						program.children.slice(24, 30).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						[
							...expected.slice(0, 3),
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
						],
					);
				});
				it('returns the union of all consequent types, constants, for maps.', () => {
					assert.deepStrictEqual(
						program.children.slice(30, 36).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
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
						program.children.slice(44, 46).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						[
							SolidString.union(SolidType.VOID),
							SolidString.union(SolidType.VOID),
						],
					);
				});
				it('unions with null if tuple entry and access are optional.', () => {
					assert.deepStrictEqual(
						program.children.slice(46, 50).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						expected_o,
					);
				});
				it('unions with null if list/set/mappping access is optional.', () => {
					assert.deepStrictEqual(
						program.children.slice(50, 56).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						[
							typeConstStr('three'),
							COMMON_TYPES.int_float_str.union(SolidNull),
							typeConstStr('three'),
							COMMON_TYPES.int_float_str.union(SolidNull),
							typeConstStr('three'),
							COMMON_TYPES.int_float_str.union(SolidNull),
						],
					);
				});
				it('claim access always subtracts void.', () => {
					assert.deepStrictEqual(
						program.children.slice(56, 60).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						expected_c,
					);
				});
				it('throws when accessor expression is correct type but out of bounds for tuples.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].[3];`)  .type(validator), TypeError04);
					assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].[-4];`) .type(validator), TypeError04);
					assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.[3];`) .type(validator), TypeError04);
					assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.[-4];`).type(validator), TypeError04);
				});
				it('returns the list item type when accessor expression is correct type but out of bounds for lists.', () => {
					const validator: Validator = new Validator();
					const program: AST.ASTNodeGoal = programFactory(`
						let list: (int | float | str)[] = List.<int | float| str>([1, 2.0, 'three']);
						list.[3];
						list.[-4];
					`)(validator);
					program.varCheck(validator);
					program.typeCheck(validator);
					program.children.slice(1, 3).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('throws when accessor expression is of incorrect type.', () => {
					assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].['3'];`).type(validator), TypeError02);
					assert.throws(() => AST.ASTNodeAccess.fromSource(`{1, 2.0, 'three'}.[true];`).type(validator), TypeError02);
					assert.throws(() => AST.ASTNodeAccess.fromSource(`{['a'] -> 1, ['b'] -> 2.0, ['c'] -> 'three'}.['a'];`).type(validator), TypeError02);
				});
			});
			context('with constant folding off.', () => {
				let validator: Validator;
				let program: AST.ASTNodeGoal;
				before(() => {
					validator = new Validator(CONFIG_FOLDING_OFF);
					program = EXPR_ACCESS_PROGRAM(validator);
					program.varCheck(validator);
					program.typeCheck(validator);
				});
				it('returns the union of all entry types for tuples.', () => {
					program.children.slice(12, 18).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('returns the union of all item types for lists.', () => {
					program.children.slice(18, 24).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('returns the union of all element types for sets.', () => {
					program.children.slice(24, 30).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('returns the union of all consequent types for maps.', () => {
					program.children.slice(30, 36).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('does not union with void, even with optional tuple entries.', () => {
					program.children.slice(44, 46).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
							COMMON_TYPES.int_float_str,
						);
					});
				});
				it('unions with null if access is optional.', () => {
					assert.deepStrictEqual(
						program.children.slice(46, 50).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						[
							COMMON_TYPES.int_float_str_null,
							COMMON_TYPES.int_float_str_null,
							COMMON_TYPES.int_float_str_null,
							TYPE_CONST_NULL,
						],
					);
					program.children.slice(50, 56).forEach((c) => {
						assert.deepStrictEqual(
							typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator),
							COMMON_TYPES.int_float_str.union(SolidNull),
						);
					});
				});
				it('claim access always subtracts void.', () => {
					assert.deepStrictEqual(
						program.children.slice(56, 60).map((c) => typeOfStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
						[
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
							COMMON_TYPES.int_float_str,
							TYPE_CONST_NULL,
						],
					);
				});
			});
			it('throws when base object is of incorrect type.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource(`(4).[2];`).type(new Validator()), TypeError01);
			});
		});
	});


	describe('#fold', () => {
		function foldStmtExpr(stmt: AST.ASTNodeStatementExpression, validator: Validator): SolidObject | null {
			return stmt.expr!.fold(validator);
		}
		const expected: (SolidObject | null)[] = [
			new Int16(1n),
			new Float64(2.0),
			new SolidString('three'),
			null,
			null,
			null,
		];
		const expected_o: (SolidObject | null)[] = [
			new SolidString('three'),
			null,
			null,
			SolidNull.NULL,
		];

		context('when base is nullish.', () => {
			it('optional access returns base when it is null.', () => {
				const validator: Validator = new Validator();
				assert.throws(() => AST.ASTNodeAccess.fromSource(`null.4;`)         .fold(validator), /TypeError: \w+\.get is not a function/);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`null.four;`)      .fold(validator), /TypeError: \w+\.get is not a function/);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`null.[[[[[]]]]];`).fold(validator), /TypeError: \w+\.get is not a function/);
				[
					AST.ASTNodeAccess.fromSource(`null?.3;`)         .fold(validator),
					AST.ASTNodeAccess.fromSource(`null?.four;`)      .fold(validator),
					AST.ASTNodeAccess.fromSource(`null?.[[[[[]]]]];`).fold(validator),
				].forEach((t) => {
					assert.strictEqual(t, SolidNull.NULL);
				});
			});
			it('chained optional access.', () => {
				const validator: Validator = new Validator();
				const program: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let bound1: [prop?: [bool]] = [prop= [true]];
					let bound2: [prop?: [?: bool]] = [prop= []];

					bound1;          % value \`[prop= [true]]\`
					bound1?.prop;    % value \`[true]\`
					bound1?.prop?.0; % value \`true\`

					bound2;          % value \`[prop= []]\`
					bound2?.prop;    % value \`[]\`
				`);
				program.varCheck(validator);
				program.typeCheck(validator);
				const prop1: SolidTuple = new SolidTuple([SolidBoolean.TRUE]);
				const prop2: SolidTuple = new SolidTuple();
				assert.deepStrictEqual(
					program.children.slice(2, 7).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						new SolidRecord(new Map([[0x101n, prop1],])),
						prop1,
						SolidBoolean.TRUE,
						new SolidRecord(new Map([[0x101n, prop2]])),
						prop2,
					],
				);
				// must bypass type-checker:
				assert.deepStrictEqual(
					AST.ASTNodeAccess.fromSource(`[prop= []]?.prop?.0;`).fold(validator),
					SolidNull.NULL,
				);
			});
		});

		context('access by index.', () => {
			let validator: Validator;
			let program: AST.ASTNodeGoal;
			before(() => {
				validator = new Validator();
				program = INDEX_ACCESS_PROGRAM(validator);
				program.varCheck(validator);
				program.typeCheck(validator);
			});
			it('returns individual entries.', () => {
				assert.deepStrictEqual(
					program.children.slice(4, 10).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(10, 16).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(38, 42).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected_o,
				);
				assert.deepStrictEqual(
					[
						...program.children.slice(44, 48),
						program.children[49]
					].map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						...expected_o,
						null,
					],
				);
			});
			it('negative indices count backwards from end.', () => {
				assert.deepStrictEqual(
					program.children.slice(16, 22).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
			});
			it('throws when index is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].3;`) .fold(validator), VoidError01);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].-4;`).fold(validator), VoidError01);
			});
			it('returns null when optionally accessing index out of bounds.', () => {
				[
					AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.3;`) .fold(validator),
					AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.-4;`).fold(validator),
				].forEach((v) => {
					assert.deepStrictEqual(v, SolidNull.NULL);
				});
			});
		});

		context('access by key.', () => {
			let validator: Validator;
			let program: AST.ASTNodeGoal;
			before(() => {
				validator = new Validator();
				program = KEY_ACCESS_PROGRAM(validator);
				program.varCheck(validator);
				program.typeCheck(validator);
			});
			it('returns individual entries.', () => {
				assert.deepStrictEqual(
					program.children.slice(4, 10).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(10, 16).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(26, 30).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected_o,
				);
				assert.deepStrictEqual(
					[
						...program.children.slice(32, 36),
						program.children[37],
					].map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						...expected_o,
						null,
					],
				);
			});
			it('throws when key is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[a= 1, b= 2.0, c= 'three'].d;`).fold(validator), VoidError01);
			});
			it('returns null when optionally accessing key out of bounds.', () => {
				[
					AST.ASTNodeAccess.fromSource(`[a= 1, b= 2.0, c= 'three']?.d;`).fold(validator),
				].forEach((v) => {
					assert.deepStrictEqual(v, SolidNull.NULL);
				});
			});
		});

		context('access by computed expression.', () => {
			let validator: Validator;
			let program: AST.ASTNodeGoal;
			before(() => {
				validator = new Validator();
				program = EXPR_ACCESS_PROGRAM(validator);
				program.varCheck(validator);
				program.typeCheck(validator);
			});
			it('returns individual entries for tuples.', () => {
				assert.deepStrictEqual(
					program.children.slice(12, 18).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(46, 50).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected_o,
				);
				assert.deepStrictEqual(
					program.children.slice(56, 60).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected_o,
				);
			});
			it('returns individual entries for lists.', () => {
				assert.deepStrictEqual(
					program.children.slice(18, 24).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(50, 52).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						new SolidString('three'),
						null,
					],
				);
			});
			it('returns individual entries for sets.', () => {
				assert.deepStrictEqual(
					program.children.slice(24, 30).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(52, 54).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						new SolidString('three'),
						null,
					],
				);
			});
			it('returns individual entries for maps.', () => {
				assert.deepStrictEqual(
					program.children.slice(30, 36).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					expected,
				);
				assert.deepStrictEqual(
					program.children.slice(54, 56).map((c) => foldStmtExpr(c as AST.ASTNodeStatementExpression, validator)),
					[
						new SolidString('three'),
						null,
					],
				);
			});
			it('throws when accessor expression is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three'].[3];`)                               .fold(validator), VoidError01);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`{1, 2.0, 'three'}.[3];`)                               .fold(validator), VoidError01);
				assert.throws(() => AST.ASTNodeAccess.fromSource(`{['a'] -> 1, ['b'] -> 2.0, ['c'] -> 'three'}.[['a']];`).fold(validator), VoidError01);
			});
			it('returns null when optionally accessing index/antecedent out of bounds.', () => {
				[
					AST.ASTNodeAccess.fromSource(`[1, 2.0, 'three']?.[3];`)                               .fold(validator),
					AST.ASTNodeAccess.fromSource(`{1, 2.0, 'three'}?.[3];`)                               .fold(validator),
					AST.ASTNodeAccess.fromSource(`{['a'] -> 1, ['b'] -> 2.0, ['c'] -> 'three'}?.[['a']];`).fold(validator),
				].forEach((v) => {
					assert.deepStrictEqual(v, SolidNull.NULL);
				});
			});
		});
	});
});
