import * as assert from 'assert';
import {
	AST,
	TYPE,
	TypeErrorInvalidOperation,
} from '../../../src/index.js';
import {
	typeUnitInt,
	typeUnitFloat,
} from '../../helpers.js';



describe('ASTNodeTypeOperation', () => {
	describe('#eval', () => {
		specify('ASTNodeTypeOperationUnary[operator=ORNULL]', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource('int?').eval(),
				TYPE.INT.union(TYPE.NULL),
			);
		});


		describe('ASTNodeTypeOperationUnary[operator=MUTABLE]', () => {
			it('does not throw if operating on a reference type.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeOperationUnary.fromSource('mutable int[]').eval(),
					new TYPE.TypeList(TYPE.INT, true),
				);
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					type A = mutable int[];
					type B = int[3];

					type C = mutable (A & B);
					type D = mutable (A | B);

					type E = mutable Object; % equivalent to \`Object\`
				`);
				goal.varCheck();
				return goal.typeCheck(); // assert does not throw
			});

			it('throws if operating on any value type.', () => {
				[
					'mutable \\[int, float, str]',
					'mutable [int, float, str]',
					'mutable \\[a: int, b: float, c: str]',
					'mutable [a: int, b: float, c: str]',
					'mutable int\\[3]',
					'mutable int[3]',
					'mutable never',
					'mutable void',
					'mutable null',
					'mutable bool',
					'mutable int',
					'mutable float',
					'mutable str',
				].forEach((src) => assert.throws(() => AST.ASTNodeTypeOperation.fromSource(src).eval(), TypeErrorInvalidOperation));
				[
					'mutable unknown',
					'mutable Object',
				].map((src) => AST.ASTNodeTypeOperation.fromSource(src).eval()); // assert does not throw if `[isRef=false]`
			});
		});


		specify('ASTNodeTypeOperationBinary[operator=AND|OR]', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource('Object & 3').eval(),
				TYPE.OBJ.intersect(typeUnitInt(3n)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource('4.2 | int').eval(),
				typeUnitFloat(4.2).union(TYPE.INT),
			);
		});
	});
});
