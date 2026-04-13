import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import {
	drop_then,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {genConst} from '../helpers.ts';



test.suite('drop_then', () => {
	test.test('returns a (block) containing `n - 1` (drop) exprs followed by a last expr.', () => {
		const cg = new Builder();
		const rt_e_value: binaryen.Type = cg.reftype.Value | 4; // HACK: “exact” type, i.e. `(ref (exact $Value))`
		const expr1: binaryen.ExpressionRef = genConst(cg, 1n);
		const expr2: binaryen.ExpressionRef = genConst(cg, 2n);
		const expr3: binaryen.ExpressionRef = genConst(cg, 3n);
		assert.strictEqual(binaryen.getExpressionType(expr3), rt_e_value);
		return assertEqualBins(
			drop_then(cg.module, [expr1, expr2], expr3),
			cg.module.block(null, [cg.module.drop(expr1), cg.module.drop(expr2), expr3], rt_e_value),
		);
	});
	test.test('type of (block) is `binaryen.none` if last item is a Counterpoint block.', () => {
		const cg = new Builder();
		const expr1: binaryen.ExpressionRef = genConst(cg, 1n);
		const block: binaryen.ExpressionRef = cg.module.block(null, [
			cg.module.drop(genConst(cg, 2n)),
			cg.module.drop(genConst(cg, 3n)),
		]); // result of building Block
		assert.strictEqual(binaryen.getExpressionType(block), binaryen.none);
		return assertEqualBins(
			drop_then(cg.module, [expr1], block),
			cg.module.block(null, [cg.module.drop(expr1), block]), // defaults to `binaryen.none`
		);
	});
});
