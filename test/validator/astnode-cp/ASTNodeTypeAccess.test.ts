import * as assert from 'assert';
import {
	AST,
	TYPE,
	TypeErrorNoEntry,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {
	typeUnitInt,
	typeUnitFloat,
	typeUnitStr,
} from '../../helpers.js';



describe('ASTNodeTypeAccess', () => {
	describe('#eval', () => {
		function evalTypeDecl(decl: AST.ASTNodeStatement): TYPE.Type {
			assert_instanceof(decl, AST.ASTNodeDeclarationType);
			return decl.assigned.eval();
		}
		const expected: TYPE.Type[] = [
			typeUnitInt(1n),
			typeUnitFloat(2.0),
			typeUnitStr('three'),
			TYPE.INT,
			TYPE.FLOAT,
			TYPE.STR,
		];
		let program: AST.ASTNodeGoal; // eslint-disable-line @typescript-eslint/init-declarations
		before(() => {
			program = AST.ASTNodeGoal.fromSource(`
				%% statements 0 – 2 %%
				type TupC = [1,   2.0,   "three"];
				type TupV = [int, float, str];

				%% statements 2 – 14 %%
				type A1 = TupC.0;  % type \`1\`
				type A2 = TupC.1;  % type \`2.0\`
				type A3 = TupC.2;  % type \`"three"\`
				type A4 = TupV.0;  % type \`int\`
				type A5 = TupV.1;  % type \`float\`
				type A6 = TupV.2;  % type \`str\`
				type B1 = TupC.-3; % type \`1\`
				type B2 = TupC.-2; % type \`2.0\`
				type B3 = TupC.-1; % type \`"three"\`
				type B4 = TupV.-3; % type \`int\`
				type B5 = TupV.-2; % type \`float\`
				type B6 = TupV.-1; % type \`str\`

				%% statements 14 – 16 %%
				type RecC = [a: 1,   b: 2.0,   c: "three"];
				type RecV = [a: int, b: float, c: str];

				%% statements 16 – 22 %%
				type C1 = RecC.a; % type \`1\`
				type C2 = RecC.b; % type \`2.0\`
				type C3 = RecC.c; % type \`"three"\`
				type C4 = RecV.a; % type \`int\`
				type C5 = RecV.b; % type \`float\`
				type C6 = RecV.c; % type \`str\`

				%% statements 22 – 24 %%
				type TupoC = [1,   2.0,   ?: "three"];
				type TupoV = [int, float, ?: str];

				%% statements 24 – 26 %%
				type D1 = TupoC.2; % type \`"three" | void\`
				type D2 = TupoV.2; % type \`str | void\`

				%% statements 26 – 28 %%
				type RecoC = [a: 1,   b?: 2.0,   c: "three"];
				type RecoV = [a: int, b?: float, c: str];

				%% statements 28 – 30 %%
				type E1 = RecoC.b; % type \`2.0 | void\`
				type E2 = RecoV.b; % type \`float | void\`

				%% statements 30 – 32 %%
				type VecC = \\[1,   2.0,   "three"];
				type VecV = \\[int, float, str];

				%% statements 32 – 44 %%
				type F1 = VecC.0;  % type \`1\`
				type F2 = VecC.1;  % type \`2.0\`
				type F3 = VecC.2;  % type \`"three"\`
				type F4 = VecV.0;  % type \`int\`
				type F5 = VecV.1;  % type \`float\`
				type F6 = VecV.2;  % type \`str\`
				type G1 = VecC.-3; % type \`1\`
				type G2 = VecC.-2; % type \`2.0\`
				type G3 = VecC.-1; % type \`"three"\`
				type G4 = VecV.-3; % type \`int\`
				type G5 = VecV.-2; % type \`float\`
				type G6 = VecV.-1; % type \`str\`

				%% statements 44 – 46 %%
				type StrC = [a: 1,   b: 2.0,   c: "three"];
				type StrV = [a: int, b: float, c: str];

				%% statements 46 – 52 %%
				type H1 = StrC.a; % type \`1\`
				type H2 = StrC.b; % type \`2.0\`
				type H3 = StrC.c; % type \`"three"\`
				type H4 = StrV.a; % type \`int\`
				type H5 = StrV.b; % type \`float\`
				type H6 = StrV.c; % type \`str\`
			`);
			program.varCheck();
			program.typeCheck();
		});

		context('index access.', () => {
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(2, 8).map((c) => evalTypeDecl(c)),
					expected,
				);
				return assert.deepStrictEqual(
					program.children.slice(32, 38).map((c) => evalTypeDecl(c)),
					expected,
				);
			});
			it('negative indices count backwards from end.', () => {
				assert.deepStrictEqual(
					program.children.slice(8, 14).map((c) => evalTypeDecl(c)),
					expected,
				);
				return assert.deepStrictEqual(
					program.children.slice(38, 44).map((c) => evalTypeDecl(c)),
					expected,
				);
			});
			it('unions with void if entry is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(24, 26).map((c) => evalTypeDecl(c)),
					[
						typeUnitStr('three').union(TYPE.VOID),
						TYPE.STR.union(TYPE.VOID),
					],
				);
			});
			it('throws when index is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('  [1, 2.0, "three"].3')  .eval(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('\\[1, 2.0, "three"].-4') .eval(), TypeErrorNoEntry);
			});
		});

		context('key access.', () => {
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(16, 22).map((c) => evalTypeDecl(c)),
					expected,
				);
				return assert.deepStrictEqual(
					program.children.slice(46, 52).map((c) => evalTypeDecl(c)),
					expected,
				);
			});
			it('unions with void if entry is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(28, 30).map((c) => evalTypeDecl(c)),
					[
						typeUnitFloat(2.0).union(TYPE.VOID),
						TYPE.FLOAT.union(TYPE.VOID),
					],
				);
			});
			it('throws when key is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('  [a: 1, b: 2.0, c: "three"].d') .eval(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('\\[a: 1, b: 2.0, c: "three"].d') .eval(), TypeErrorNoEntry);
			});
		});
	});
});
