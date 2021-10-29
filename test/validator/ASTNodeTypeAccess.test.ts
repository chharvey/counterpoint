import * as assert from 'assert';
import {
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidType,
	TypeError04,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode-solid/index.js'; // HACK
import {
	typeConstInt,
	typeConstFloat,
	typeConstStr,
} from '../helpers.js';



describe('ASTNodeTypeAccess', () => {
	describe('#eval', () => {
		function evalTypeDecl(decl: AST.ASTNodeDeclarationType, validator: Validator): SolidType {
			return decl.assigned.eval(validator);
		}
		const expected: SolidType[] = [
			typeConstInt(1n),
			typeConstFloat(2.0),
			typeConstStr('three'),
			SolidType.INT,
			SolidType.FLOAT,
			SolidType.STR,
		];
		let validator: Validator;
		let program: AST.ASTNodeGoal;
		before(() => {
			validator = new Validator();
			program = AST.ASTNodeGoal.fromSource(`
				type TupC = [1,   2.0,   'three'];
				type TupV = [int, float, str];

				type A1 = TupC.0;  % type \`1\`
				type A2 = TupC.1;  % type \`2.0\`
				type A3 = TupC.2;  % type \`'three'\`
				type A4 = TupV.0;  % type \`int\`
				type A5 = TupV.1;  % type \`float\`
				type A6 = TupV.2;  % type \`str\`
				type B1 = TupC.-3; % type \`1\`
				type B2 = TupC.-2; % type \`2.0\`
				type B3 = TupC.-1; % type \`'three'\`
				type B4 = TupV.-3; % type \`int\`
				type B5 = TupV.-2; % type \`float\`
				type B6 = TupV.-1; % type \`str\`

				type RecC = [a: 1,   b: 2.0,   c: 'three'];
				type RecV = [a: int, b: float, c: str];

				type C1 = RecC.a; % type \`1\`
				type C2 = RecC.b; % type \`2.0\`
				type C3 = RecC.c; % type \`'three'\`
				type C4 = RecV.a; % type \`int\`
				type C5 = RecV.b; % type \`float\`
				type C6 = RecV.c; % type \`str\`

				type TupoC = [1,   2.0,   ?: 'three'];
				type TupoV = [int, float, ?: str];

				type D1 = TupoC.2; % type \`'three' | void\`
				type D2 = TupoV.2; % type \`str | void\`

				type RecoC = [a: 1,   b?: 2.0,   c: 'three'];
				type RecoV = [a: int, b?: float, c: str];

				type E1 = RecoC.b; % type \`2.0 | void\`
				type E2 = RecoV.b; % type \`float | void\`
			`, validator.config);
			program.varCheck(validator);
			program.typeCheck(validator);
		});

		context('index access.', () => {
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(2, 8).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
					expected,
				);
			});
			it('negative indices count backwards from end.', () => {
				assert.deepStrictEqual(
					program.children.slice(8, 14).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
					expected,
				);
			});
			it('unions with void if entry is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(24, 26).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
					[
						typeConstStr('three').union(SolidType.VOID),
						SolidType.STR.union(SolidType.VOID),
					],
				);
			});
			it('throws when index is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[1, 2.0, 'three'].3`) .eval(validator), TypeError04);
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[1, 2.0, 'three'].-4`).eval(validator), TypeError04);
			});
		});

		context('key access.', () => {
			it('returns individual entry types.', () => {
				assert.deepStrictEqual(
					program.children.slice(16, 22).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
					expected,
				);
			});
			it('unions with void if entry is optional.', () => {
				assert.deepStrictEqual(
					program.children.slice(28, 30).map((c) => evalTypeDecl(c as AST.ASTNodeDeclarationType, validator)),
					[
						typeConstFloat(2.0).union(SolidType.VOID),
						SolidType.FLOAT.union(SolidType.VOID),
					],
				);
			});
			it('throws when key is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource(`[a: 1, b: 2.0, c: 'three'].d`).eval(validator), TypeError04);
			});
		});
	});
});
