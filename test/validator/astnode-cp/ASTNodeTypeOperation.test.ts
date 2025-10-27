import * as assert from 'node:assert';
import {
	AST,
	TYPE,
	TypeErrorInvalidOperation,
} from '../../../src/index.ts';
import {assertEqualTypes} from '../../assert-helpers.ts';
import {
	setupScript,
	typeUnit,
} from '../../helpers.ts';



describe('ASTNodeTypeOperation', () => {
	describe('#eval', () => {
		specify('ASTNodeTypeOperationUnary[operator=ORNULL]', () => {
			assertEqualTypes(
				AST.ASTNodeTypeOperationUnary.fromSource('int?').eval(),
				TYPE.INT.union(TYPE.NULL),
			);
		});


		describe('ASTNodeTypeOperationUnary[operator=MUTABLE]', () => {
			it('does not throw if operating on a reference type.', () => {
				assertEqualTypes(
					AST.ASTNodeTypeOperationUnary.fromSource('mut [int]').eval(),
					new TYPE.List(TYPE.INT, true),
				);
				setupScript(`{
					type A = mut [[int]];
					type B = (int, int, int);
					type F = [Object];

					type C = mut (A & F);
					type D = mut (A | B);

					type E = mut Object; % equivalent to \`Object\`
				}`, null, {build: false}); // assert does not throw
			});

			it('throws if operating on any value type.', () => {
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
				].forEach((src) => assert.throws(() => AST.ASTNodeTypeOperation.fromSource(src).eval(), TypeErrorInvalidOperation));
				[
					'mut anything',
					'mut Object',
				].map((src) => AST.ASTNodeTypeOperation.fromSource(src).eval()); // assert does not throw if `[isRef=false]`
			});
		});


		specify('ASTNodeTypeOperationBinary[operator=AND|OR]', () => {
			assertEqualTypes(
				AST.ASTNodeTypeOperationBinary.fromSource('Object & 3').eval(),
				TYPE.OBJ.intersect(typeUnit(3n)),
			);
			assertEqualTypes(
				AST.ASTNodeTypeOperationBinary.fromSource('4.2 | int').eval(),
				typeUnit(4.2).union(TYPE.INT),
			);
		});
	});
});
