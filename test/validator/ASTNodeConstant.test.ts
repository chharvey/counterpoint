import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidTypeConstant,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	Builder,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {assert_wasCalled} from '../assert-helpers.js';
import {
	typeConstStr,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeConstant', () => {
	describe('#varCheck', () => {
		it('never throws.', () => {
			AST.ASTNodeConstant.fromSource(`42;`).varCheck(new Validator());
		});
	});


	describe('#type', () => {
		it('returns the result of `this#fold`, wrapped in a `new SolidTypeConstant`.', () => {
			const constants: AST.ASTNodeConstant[] = `
				null  false  true
				55  -55  033  -033  0  -0
				55.  -55.  033.  -033.  2.007  -2.007
				91.27e4  -91.27e4  91.27e-4  -91.27e-4
				0.  -0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				${ (Dev.supports('stringConstant-assess')) ? `'42😀'  '42\\u{1f600}'` : `` }
			`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`));
			const validator: Validator = new Validator();
			assert.deepStrictEqual(constants.map((c) => assert_wasCalled(c.fold, 1, (orig, spy) => {
				c.fold = spy;
				try {
					return c.type(validator);
				} finally {
					c.fold = orig;
				};
			})), constants.map((c) => new SolidTypeConstant(c.fold(validator)!)));
		});
	});


	describe('#fold', () => {
		it('computes null and boolean values.', () => {
			assert.deepStrictEqual([
				'null;',
				'false;',
				'true;',
			].map((src) => AST.ASTNodeConstant.fromSource(src).fold(new Validator())), [
				SolidNull.NULL,
				SolidBoolean.FALSE,
				SolidBoolean.TRUE,
			]);
		})
		it('computes int values.', () => {
			const integer_radices_on: SolidConfig = {
				...CONFIG_DEFAULT,
				languageFeatures: {
					...CONFIG_DEFAULT.languageFeatures,
					integerRadices: true,
				},
			};
			assert.deepStrictEqual(`
				55  -55  033  -033  0  -0
				\\o55  -\\o55  \\q033  -\\q033
			`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`, integer_radices_on).fold(new Validator())), [
				55, -55, 33, -33, 0, 0,
				parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
			].map((v) => new Int16(BigInt(v))));
		});
		it('computes float values.', () => {
			assert.deepStrictEqual(`
				55.  -55.  033.  -033.  2.007  -2.007
				91.27e4  -91.27e4  91.27e-4  -91.27e-4
				0.  -0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
			`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`).fold(new Validator())), [
				55, -55, 33, -33, 2.007, -2.007,
				91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
				0, -0, -0, 6.8, 6.8, 0, -0,
			].map((v) => new Float64(v)));
		})
		Dev.supports('stringConstant-assess') && it('computes string values.', () => {
			assert.deepStrictEqual(
				AST.ASTNodeConstant.fromSource(`'42😀\\u{1f600}';`).type(new Validator()),
				typeConstStr('42😀\u{1f600}'),
			);
		});
	});


	describe('#build', () => {
		it('returns InstructionConst.', () => {
			assert.deepStrictEqual([
				'null;',
				'false;',
				'true;',
				'0;',
				'+0;',
				'-0;',
				'42;',
				'+42;',
				'-42;',
				'0.0;',
				'+0.0;',
				'-0.0;',
				'-4.2e-2;',
			].map((src) => AST.ASTNodeConstant.fromSource(src).build(new Builder(src))), [
				instructionConstInt(0n),
				instructionConstInt(0n),
				instructionConstInt(1n),
				instructionConstInt(0n),
				instructionConstInt(0n),
				instructionConstInt(0n),
				instructionConstInt(42n),
				instructionConstInt(42n),
				instructionConstInt(-42n),
				instructionConstFloat(0),
				instructionConstFloat(0),
				instructionConstFloat(-0),
				instructionConstFloat(-0.042),
			]);
		});
	});
});
