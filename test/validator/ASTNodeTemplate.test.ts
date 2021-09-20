import * as assert from 'assert';
import {
	Dev,
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidType,
	SolidTypeConstant,
	SolidString,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {assert_wasCalled} from '../assert-helpers.js';
import {CONFIG_FOLDING_OFF} from '../helpers.js';



Dev.supports('stringTemplate-assess') && describe('ASTNodeTemplate', () => {
	describe('#type', () => {
		let templates: readonly AST.ASTNodeTemplate[];
		function initTemplates() {
			return [
				AST.ASTNodeTemplate.fromSource(`'''42😀''';`),
				AST.ASTNodeTemplate.fromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`),
				(AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 21;
					'''the answer is {{ x * 2 }} but what is the question?''';
				`)
					.children[1] as AST.ASTNodeStatementExpression)
					.expr as AST.ASTNodeTemplate,
			] as const;
		}
		context('with constant folding on.', () => {
			const validator: Validator = new Validator();
			let types: SolidType[];
			before(() => {
				templates = initTemplates();
				types = templates.map((t) => assert_wasCalled(t.fold, 1, (orig, spy) => {
					t.fold = spy;
					try {
						return t.type(validator);
					} finally {
						t.fold = orig;
					};
				}));
			});
			it('for foldable interpolations, returns the result of `this#fold`, wrapped in a `new SolidTypeConstant`.', () => {
				assert.deepStrictEqual(
					types.slice(0, 2),
					templates.slice(0, 2).map((t) => new SolidTypeConstant(t.fold(validator)!)),
				);
			});
			it('for non-foldable interpolations, returns `String`.', () => {
				assert.deepStrictEqual(types[2], SolidString);
			});
		});
		context('with constant folding off.', () => {
			it('always returns `String`.', () => {
				templates = initTemplates();
				templates.forEach((t) => {
					assert.deepStrictEqual(t.type(new Validator(CONFIG_FOLDING_OFF)), SolidString);
				});
			});
		});
	});


	describe('#fold', () => {
		let templates: AST.ASTNodeTemplate[];
		before(() => {
			templates = [
				AST.ASTNodeTemplate.fromSource(`'''42😀''';`),
				AST.ASTNodeTemplate.fromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`),
				(AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 21;
					'''the answer is {{ x * 2 }} but what is the question?''';
				`)
					.children[1] as AST.ASTNodeStatementExpression)
					.expr as AST.ASTNodeTemplate,
			];
		});
		it('returns a constant String for ASTNodeTemplate with no interpolations.', () => {
			assert.deepStrictEqual(
				templates[0].fold(new Validator()),
				new SolidString('42😀'),
			);
		});
		it('returns a constant String for ASTNodeTemplate with foldable interpolations.', () => {
			assert.deepStrictEqual(
				templates[1].fold(new Validator()),
				new SolidString('the answer is 42 but what is the question?'),
			);
		});
		it('returns null for ASTNodeTemplate with dynamic interpolations.', () => {
			assert.deepStrictEqual(
				templates[2].fold(new Validator()),
				null,
			);
		});
	});
});
