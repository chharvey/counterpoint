import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	VALUE,
	Validator,
	AST,
} from '../../src/index.ts';
import {extract_tokens} from '../utils.ts';



test.suite('Expression', () => {
	test.suite('Constant', () => {
		/* eslint-disable @stylistic/array-element-newline */
		test.suite('#interpreterValue', () => {
			test.test('computes null, boolean, and symbol values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
					new VALUE.Symbol(0x52n, 'then'),
					new VALUE.Symbol(0x46n, 'str'),
					new VALUE.Symbol(0x49n, 'false'),
					new VALUE.Symbol(Validator.keyId('foobar'), 'foobar'),
				]);
			});
			test.test('computes int values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new VALUE.Integer(BigInt(v))));
			});
			test.test('computes nat values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					+55  +033  +0
					+\\o55  +\\q033
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					55, 33, 0,
					parseInt('55', 8), parseInt('33', 4),
				].map((v) => new VALUE.Natural(BigInt(v))));
			});
			test.test('computes float values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new VALUE.Float(v)));
			});
			test.test('computes string values.', () => {
				assert.deepStrictEqual(
					AST.EXPR.Constant.fromSource('"42😀\\u{1f600}"').interpreterValue,
					new VALUE.String('42😀\u{1f600}'),
				);
			});
		});
		/* eslint-enable @stylistic/array-element-newline */
	});
});
