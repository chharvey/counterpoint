import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	assert_instanceof,
	AST,
} from '../../src/index.ts';



test.suite('AstNode', () => {
	test.suite('Index', () => {
		test.suite('#index', () => {
			test.test('returns the cooked value of the integer token.', () => {
				[0n, 1n, 2n, 4n, 8n, 16n].forEach((index) => {
					const type_accessor: AST.Index | AST.Key = AST.TYPE.Access.fromSource(`MyTuple.${index}`).accessor;
					assert_instanceof(type_accessor, AST.Index);
					assert.strictEqual(type_accessor.index, index);

					const expr_accessor: AST.Index | AST.Key | AST.EXPR.Expression = AST.EXPR.Access.fromSource(`my_tuple.${index}`).accessor;
					assert_instanceof(expr_accessor, AST.Index);
					assert.strictEqual(expr_accessor.index, index);
				});
			});
		});
	});
});
