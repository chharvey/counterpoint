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
		const VISITOR = new AST.TypeVisitorTypevalue();

		test.test('TypeOperationUnary[operator=MAYBE]', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.OperationUnary.fromSource('int?')),
				new TYPE.Maybe(TYPE.INT),
			);
		});


		test.test('TypeOperationUnary[operator=RESULT]', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.OperationUnary.fromSource('int!')),
				new TYPE.Result(TYPE.INT),
			);
		});


		test.suite('TypeOperationUnary[operator=MUTABLE]', () => {
			test.test('does not throw if operating on a reference type.', () => {
				assertEqualTypes(
					VISITOR.visit(AST.TYPE.OperationUnary.fromSource('mut [int]')),
					new TYPE.List(TYPE.INT, true),
				);
				setupScript(`{
					type A = mut [[int]];
					type B = (int, int, int);
					type F = [Object];

					type E = mut Object; % equivalent to \`Object\`
					type G = mut [int] | mut [Object];
				}`, {build: false}); // assert does not throw
			});

			test.test('throws if operating on any non-reference type.', () => {
				[
					'mut (int, float, str)',
					'mut (a: int, b: float, c: str)',
					'mut (int, int, int)',
					'mut nothing',
					'mut anything',
					'mut null',
					'mut bool',
					'mut int',
					'mut float',
					'mut str',
					'mut ([int] | [Object])',
				].forEach((src) => assert.throws(() => VISITOR.visit(AST.TYPE.Operation.fromSource(src)), TypeErrorInvalidOperation));
			});
		});


		test.test('TypeOperationBinary[operator=AND|OR]', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.OperationBinary.fromSource('Object & 3')),
				TYPE.OBJ.intersect(typeUnit(3n)),
			);
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.OperationBinary.fromSource('4.2 | int')),
				typeUnit(4.2).union(TYPE.INT),
			);
		});
	});
});
