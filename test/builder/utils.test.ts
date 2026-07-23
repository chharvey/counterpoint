import * as assert from 'node:assert';
import * as test from 'node:test';
import * as binaryen from 'binaryen.ts';
import {CodeGenerator} from '../../src/index.ts';
import {drop_then} from '../../src/builder/op/utils-private.ts';
import {
	assertEqualBins,
	genConst,
} from '../utils.ts';



test.suite('drop_then', () => {
	test.test('returns a (block) containing `n - 1` (drop) exprs followed by a last expr.', () => {
		const cg = new CodeGenerator();
		const {wasm} = cg.mod;
		const expr1: binaryen.ExpressionRef = genConst(cg, 1n);
		const expr2: binaryen.ExpressionRef = genConst(cg, 2n);
		const expr3: binaryen.ExpressionRef = genConst(cg, 3n);
		assert.strictEqual(binaryen.getExpressionType(expr3), cg.vm.reftype.Value);
		return assertEqualBins(
			drop_then(cg, [expr1, expr2], expr3),
			wasm.block(null, [wasm.drop(expr1), wasm.drop(expr2), expr3], cg.vm.reftype.Value),
		);
	});
	test.test('type of (block) is `binaryen.none` if last item is a Counterpoint block.', () => {
		const cg = new CodeGenerator();
		const {wasm} = cg.mod;
		const expr1: binaryen.ExpressionRef = genConst(cg, 1n);
		const block: binaryen.ExpressionRef = wasm.block(null, [
			wasm.drop(genConst(cg, 2n)),
			wasm.drop(genConst(cg, 3n)),
		]); // result of building Block
		assert.strictEqual(binaryen.getExpressionType(block), binaryen.none);
		return assertEqualBins(
			drop_then(cg, [expr1], block),
			wasm.block(null, [wasm.drop(expr1), block]), // defaults to `binaryen.none`
		);
	});
});
