import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	AST,
	TYPE,
	TypeErrorNoEntry,
} from '../../../src/index.ts';
import type {ConstructorType} from '../../../src/lib/index.ts';
import {typeUnit} from '../../helpers.ts';



describe('ASTNodeTypeAccess', () => {
	describe('#eval', () => {
		/**
		 * Takes a program source text and compares it to the array of expected types.
		 * The format of the program source text must be 0 or more type declarations.
		 * (The source text must be valid!)
		 * The type evaluations are compared to the expected types via `deepStrictEqual`.
		 * If any of the expecteds are Error (or subclasses) constructors, then the expression type is expected to throw, and is tested against that.
		 * @param source    the program source text to parse and analyze
		 * @param start     the index of the first statement to begin comparing (statements before this are ignored)
		 * @param expecteds the expected evaluations of the type-expressions
		 */
		function testTypeEvals(source: string, start: number, expecteds: readonly (TYPE.Type | ConstructorType<Error>)[]): void {
			const program:    AST.ASTNodeGoal                       = AST.ASTNodeGoal.fromSource(source);
			const statements: readonly AST.ASTNodeDeclarationType[] = program.children.filter((stmt) => stmt instanceof AST.ASTNodeDeclarationType).slice(start);
			program.varCheck();
			try {
				program.typeCheck();
			} catch {
				// if type-checking fails, proceed to `assert.throws` below
			}
			return expecteds.some((it) => it instanceof Function)
				? xjs.Array.forEachAggregated(statements, (stmt, i) => {
					const expected: TYPE.Type | ConstructorType<Error> = expecteds[i];
					return expected instanceof Function
						? assert.throws(() => stmt.assigned.eval(), expected)
						: assert.deepStrictEqual(stmt.assigned.eval(), expected);
				})
				: assert.deepStrictEqual(
					statements.map((stmt) => stmt.assigned.eval()),
					expecteds,
				);
		}

		context('access type: access by index.', () => {
			it('returns individual entry types.', () => {
				testTypeEvals(`
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
				`, 2, [
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
			it('unions with void if entry is optional.', () => {
				testTypeEvals(`
					type TupoC = [1,   2.0,   ?: "three"];
					type TupoV = [int, float, ?: str];

					type D1 = TupoC.2; % type \`"three" | void\`
					type D2 = TupoV.2; % type \`str | void\`
				`, 2, [
					typeUnit('three').union(TYPE.VOID),
					TYPE.STR.union(TYPE.VOID),
				]);
			});
			it('throws when index is out of bounds.', () => {
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('[1, 2.0, "three"].3')  .eval(), TypeErrorNoEntry);
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('[1, 2.0, "three"].-4') .eval(), TypeErrorNoEntry);
			});
		});

		context('access type: access by key.', () => {
			it('returns individual entry types.', () => {
				testTypeEvals(`
					type RecC = [a: 1,   b: 2.0,   _: "three"];
					type RecV = [a: int, b: float, _: str];

					type C1 = RecC.a; % type \`1\`
					type C2 = RecC.b; % type \`2.0\`
					type C3 = RecC._; % type \`"three"\`
					type C4 = RecV.a; % type \`int\`
					type C5 = RecV.b; % type \`float\`
					type C6 = RecV._; % type \`str\`
				`, 2, [
					typeUnit(1n),
					typeUnit(2.0),
					typeUnit('three'),
					TYPE.INT,
					TYPE.FLOAT,
					TYPE.STR,
				]);
			});
			it('unions with void if entry is optional.', () => {
				testTypeEvals(`
					type RecoC = [a: 1,   b?: 2.0,   c: "three"];
					type RecoV = [a: int, b?: float, c: str];

					type E1 = RecoC.b; % type \`2.0 | void\`
					type E2 = RecoV.b; % type \`float | void\`
				`, 2, [
					typeUnit(2.0).union(TYPE.VOID),
					TYPE.FLOAT.union(TYPE.VOID),
				]);
			});
			it('throws when key is out of range.', () => {
				assert.throws(() => AST.ASTNodeTypeAccess.fromSource('[a: 1, b: 2.0, c: "three"].d').eval(), TypeErrorNoEntry);
			});
		});
	});
});
