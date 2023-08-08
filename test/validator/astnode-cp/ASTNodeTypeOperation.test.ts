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



describe('ASTNodeOperation', () => {
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
					type A = mutable [int, float, str];
					type B = mutable [a: int, b: float, c: str];
					type C = mutable int[];
					type D = mutable int[3];

					type E = A | B;
					type F = C & D;

					type G = mutable Object; % equivalent to \`Object\`
					type H = \\[int, float] | mutable [int, float];
				`);
				goal.varCheck();
				return goal.typeCheck(); // assert does not throw
			});

			it('throws if operating on any value type.', () => {
				[
					'mutable \\[int, float, str]',
					'mutable \\[a: int, b: float, c: str]',
					'mutable int\\[3]',
					'mutable never',
					'mutable void',
					'mutable null',
					'mutable bool',
					'mutable int',
					'mutable float',
					'mutable str',
				].forEach((src) => assert.throws(() => AST.ASTNodeTypeOperation.fromSource(src).eval(), TypeErrorInvalidOperation));
				[
					'mutable [int, float, str]',
					'mutable [a: int, b: float, c: str]',
					'mutable int[]',
					'mutable int[3]',
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
