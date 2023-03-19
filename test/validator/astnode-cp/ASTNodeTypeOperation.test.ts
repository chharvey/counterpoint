import * as assert from 'assert';
import {
	AST,
	TypeError01,
} from '../../../src/index.js';



describe('ASTNodeOperation', () => {
	describe('ASTNodeTypeOperationUnary[operator=MUTABLE]', () => {
		describe('#eval', () => {
			it('throws if operating on an `ASTNodeType{Tuple,Record,List}[isRef=true]`', () => {
				[
					'mutable \\[int, float, str]',
					'mutable \\[a: int, b: float, c: str]',
					'mutable int\\[3]',
				].forEach((src) => assert.throws(() => AST.ASTNodeTypeOperation.fromSource(src).eval(), TypeError01));
				[
					'mutable [int, float, str]',
					'mutable [a: int, b: float, c: str]',
					'mutable int[]',
					'mutable int[3]',
				].map((src) => AST.ASTNodeTypeOperation.fromSource(src).eval()); // assert does not throw if `[isRef=false]`
			});
		});
	});
});
