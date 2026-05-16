import * as assert from 'node:assert';
import * as test from 'node:test';
import * as binaryen from 'binaryen.ts';
import {
	drop_then,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {genConst} from '../helpers.ts';



test.suite('drop_then', () => {
	test.test('returns a (block) containing `n - 1` (drop) exprs followed by a last expr.', () => {
		const cg = new Builder();
		const {mod} = cg.vm;
		const expr1: binaryen.ExpressionRef = genConst(cg, 1n);
		const expr2: binaryen.ExpressionRef = genConst(cg, 2n);
		const expr3: binaryen.ExpressionRef = genConst(cg, 3n);
		assert.strictEqual(binaryen.getExpressionType(expr3), cg.vm.reftype.Value);
		return assertEqualBins(
			drop_then(cg, [expr1, expr2], expr3),
			mod.block(null, [mod.drop(expr1), mod.drop(expr2), expr3], cg.vm.reftype.Value),
		);
	});
	test.test('type of (block) is `binaryen.none` if last item is a Counterpoint block.', () => {
		const cg = new Builder();
		const {mod} = cg.vm;
		const expr1: binaryen.ExpressionRef = genConst(cg, 1n);
		const block: binaryen.ExpressionRef = mod.block(null, [
			mod.drop(genConst(cg, 2n)),
			mod.drop(genConst(cg, 3n)),
		]); // result of building Block
		assert.strictEqual(binaryen.getExpressionType(block), binaryen.none);
		return assertEqualBins(
			drop_then(cg, [expr1], block),
			mod.block(null, [mod.drop(expr1), block]), // defaults to `binaryen.none`
		);
	});
});
