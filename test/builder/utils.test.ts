import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import {
	drop_then,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {buildConst} from '../helpers.ts';



test.suite('drop_then', () => {
	test.test('returns a (block) containing `n - 1` (drop) exprs followed by a last expr.', () => {
		const builder = new Builder();
		const expr1: binaryen.ExpressionRef = buildConst(builder, 1n);
		const expr2: binaryen.ExpressionRef = buildConst(builder, 2n);
		const expr3: binaryen.ExpressionRef = buildConst(builder, 3n);
		assert.strictEqual(binaryen.getExpressionType(expr3), binaryen.v128);
		return assertEqualBins(
			drop_then(builder.module, [expr1, expr2], expr3),
			builder.module.block(null, [builder.module.drop(expr1), builder.module.drop(expr2), expr3], binaryen.v128),
		);
	});
	test.test('type of (block) is `binaryen.none` if last item is a Counterpoint block.', () => {
		const builder = new Builder();
		const expr1: binaryen.ExpressionRef = buildConst(builder, 1n);
		const block: binaryen.ExpressionRef = builder.module.block(null, [
			builder.module.drop(buildConst(builder, 2n)),
			builder.module.drop(buildConst(builder, 3n)),
		]); // result of building Block
		assert.strictEqual(binaryen.getExpressionType(block), binaryen.none);
		return assertEqualBins(
			drop_then(builder.module, [expr1], block),
			builder.module.block(null, [builder.module.drop(expr1), block]),
		);
	});
});
