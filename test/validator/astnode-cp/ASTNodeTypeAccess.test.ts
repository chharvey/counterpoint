import * as assert from 'assert';
import {
	AST,
	TYPE,
	TypeError04,
} from '../../../src/index.js';
import {
	typeUnitInt,
	typeUnitFloat,
	typeUnitStr,
} from '../../helpers.js';



describe('ASTNodeTypeAccess', () => {
	describe('#eval', () => {
		function evalTypeDecl(decl: AST.ASTNodeStatement): TYPE.Type {
			assert.ok(decl instanceof AST.ASTNodeDeclarationType);
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
				type TupC = [1,   2.0,   "three"];
				type TupV = [int, float, str];

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

				type RecC = [a: 1,   b: 2.0,   c: "three"];
				type RecV = [a: int, b: float, c: str];

				type C1 = RecC.a; % type \`1\`
				type C2 = RecC.b; % type \`2.0\`
				type C3 = RecC.c; % type \`"three"\`
				type C4 = RecV.a; % type \`int\`
				type C5 = RecV.b; % type \`float\`
				type C6 = RecV.c; % type \`str\`

				type TupoC = [1,   2.0,   ?: "three"];
				type TupoV = [int, float, ?: str];

				type D1 = TupoC.2; % type \`"three" | void\`
				type D2 = TupoV.2; % type \`str | void\`

				type RecoC = [a: 1,   b?: 2.0,   c: "three"];
				type RecoV = [a: int, b?: float, c: str];

				type E1 = RecoC.b; % type \`2.0 | void\`
				type E2 = RecoV.b; % type \`float | void\`
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
			});
			it('negative indices count backwards from end.', () => {
				assert.deepStrictEqual(
					program.children.slice(8, 14).map((c) => evalTypeDecl(c)),
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
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('[1, 2.0, "three"].3')  .eval(), TypeError04);
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('[1, 2.0, "three"].-4') .eval(), TypeError04);
			});
		});

		context('key access.', () => {
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(16, 22).map((c) => evalTypeDecl(c)),
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
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('[a: 1, b: 2.0, c: "three"].d').eval(), TypeError04);
			});
		});
	});
});
