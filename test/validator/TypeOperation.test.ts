import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	AST,
	TYPE,
	TypeErrorInvalidOperation,
} from '../../src/index.ts';
import {
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../utils.ts';



test.suite('TypeOperation', () => {
	test.suite('#eval', () => {
		test.test('TypeOperationUnary[operator=MAYBE]', () => {
			assertEqualTypes(
				AST.TYPE.OperationUnary.fromSource('int?').eval(),
				new TYPE.Maybe(TYPE.INT),
			);
		});


		test.test.todo('TypeOperationUnary[operator=RESULT]', () => {
			assert.ok('TODO:');
		});


		test.suite('TypeOperationUnary[operator=MUTABLE]', () => {
			test.test('does not throw if operating on a reference type.', () => {
				assertEqualTypes(
					AST.TYPE.OperationUnary.fromSource('mut [int]').eval(),
					new TYPE.List(TYPE.INT, true),
				);
				setupScript(`{
					type A = mut [[int]];
					type B = (int, int, int);
					type F = [Object];

					type C = mut (A & F);
					type D = mut (A | B);

					type E = mut Object; % equivalent to \`Object\`
				}`, {build: false}); // assert does not throw
			});

			test.test('throws if operating on any value type.', () => {
				[
					'mut (int, float, str)',
					'mut (a: int, b: float, c: str)',
					'mut (int, int, int)',
					'mut nothing',
					'mut null',
					'mut bool',
					'mut int',
					'mut float',
					'mut str',
				].forEach((src) => assert.throws(() => AST.TYPE.Operation.fromSource(src).eval(), TypeErrorInvalidOperation));
				[
					'mut anything',
					'mut Object',
				].map((src) => AST.TYPE.Operation.fromSource(src).eval()); // assert does not throw if `[isRef=false]`
			});
		});


		test.test('TypeOperationBinary[operator=AND|OR]', () => {
			assertEqualTypes(
				AST.TYPE.OperationBinary.fromSource('Object & 3').eval(),
				TYPE.OBJ.intersect(typeUnit(3n)),
			);
			assertEqualTypes(
				AST.TYPE.OperationBinary.fromSource('4.2 | int').eval(),
				typeUnit(4.2).union(TYPE.INT),
			);
		});
	});
});
