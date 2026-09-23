import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	AST,
	TYPE,
	TypeErrorInvalidOperation,
	TypeErrorNoEntry,
} from '../../src/index.ts';
import {
	extract_lines,
	repeat,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../utils.ts';



test.suite('TypeAccess', () => {
	test.suite('#eval', () => {
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
			const {goal} = setupScript(source, {typeCheck: false});
			try {
				goal.typeCheck();
			} catch {
				// if type-checking fails, proceed to `assert.throws` below
			}
			const statements: readonly AST.STMT.DeclarationType[] = goal.block!.children.filter((stmt) => stmt instanceof AST.STMT.DeclarationType).slice(start);
			return expecteds.some((it) => it instanceof Function)
				? (assert.strictEqual(statements.length, expecteds.length, 'Arrays are not the same length.'), xjs.Array.forEachAggregated(statements, (stmt, i) => {
					const expected: TYPE.Type | ConstructorType<Error> = expecteds[i];
					return expected instanceof Function
						? assert.throws(() => stmt.assigned.eval(), expected)
						: assertEqualTypes(stmt.assigned.eval(), expected);
				}))
				: assertEqualTypes(
					statements.map((stmt) => stmt.assigned.eval()),
					expecteds as TYPE.Type[],
				);
		}


		test.suite('access kind: normal access (`a.‹b›`).', () => {
			test.test('returns individual entry types.', () => {
				testTypeEvals(`{
					type TupC = (1,   2.0,   "three");
					type TupV = (int, float, str);

					type RecC = (a: 1,   b: 2.0,   _: "three");
					type RecV = (a: int, b: float, _: str);

					type A1 = TupC.0;  % type \`1\`
					type A2 = TupC.1;  % type \`2.0\`
					type A3 = TupC.2;  % type \`"three"\`
					type A4 = TupV.0;  % type \`int\`
					type A5 = TupV.1;  % type \`float\`
					type A6 = TupV.2;  % type \`str\`

					type C1 = RecC.a; % type \`1\`
					type C2 = RecC.b; % type \`2.0\`
					type C3 = RecC._; % type \`"three"\`
					type C4 = RecV.a; % type \`int\`
					type C5 = RecV.b; % type \`float\`
					type C6 = RecV._; % type \`str\`
				}`, 4, [
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
			test.test('throws when entry is optional.', () => {
				testTypeEvals(`{
					type TupoC = (1,   2.0,   ?: "three");
					type TupoV = (int, float, ?: str);

					type RecoC = (a: 1,   b?: 2.0,   c: "three");
					type RecoV = (a: int, b?: float, c: str);

					type D1 = TupoC.2;
					type D2 = TupoV.2;

					type E1 = RecoC.b;
					type E2 = RecoV.b;
				}`, 4, repeat(TypeErrorInvalidOperation, 4));
			});
			test.test('throws when base object is of incorrect type.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					List.<int>.1
					Dict.<int>.b
				`, (src) => assert.throws(() => AST.TYPE.Access.fromSource(src).eval(), TypeErrorNoEntry, src));
			});
			test.test('throws when index is out of bounds / when key is out of range.', () => {
				xjs.Array.forEachAggregated(extract_lines`
					(1, 2.0, "three").3
					(1, 2.0, "three").-4
					(a: 1, b: 2.0, c: "three").d
				`, (src) => assert.throws(() => AST.TYPE.Access.fromSource(src).eval(), TypeErrorNoEntry));
			});
		});


		test.suite('access kind: maybe access (`a?.‹b›`).', () => {
			test.test('unions with null if entry is optional.', () => {
				testTypeEvals(`{
					type TupoC = (1,   2.0,   ?: "three");
					type TupoV = (int, float, ?: str);

					type RecoC = (a: 1,   b?: 2.0,   c: "three");
					type RecoV = (a: int, b?: float, c: str);

					type D1 = TupoC?.2; % type \`Maybe["three"]\`
					type D2 = TupoV?.2; % type \`Maybe[str]\`

					type E1 = RecoC?.b; % type \`Maybe[2.0]\`
					type E2 = RecoV?.b; % type \`Maybe[float]\`
				}`, 4, [
					new TYPE.Maybe(typeUnit('three')),
					new TYPE.Maybe(TYPE.STR),

					new TYPE.Maybe(typeUnit(2.0)),
					new TYPE.Maybe(TYPE.FLOAT),
				]);
			});
			test.test('throws when entry is not optional.', () => {
				testTypeEvals(`{
					type TupoC = (1,   2.0,   "three");
					type TupoV = (int, float, str);

					type RecoC = (a: 1,   b: 2.0,   c: "three");
					type RecoV = (a: int, b: float, c: str);

					type D1 = TupoC?.2;
					type D2 = TupoV?.2;

					type E1 = RecoC?.b;
					type E2 = RecoV?.b;
				}`, 4, repeat(TypeErrorInvalidOperation, 4));
			});
		});
	});
});
