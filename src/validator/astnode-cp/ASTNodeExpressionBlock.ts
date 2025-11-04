import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {
	VALUE,
	TYPE,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {
	type ASTNodeStatement,
	ASTNodeStatementExpression,
	type ASTNodeBlock,
} from './index.ts';
import {
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';



export class ASTNodeExpressionBlock extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeExpressionBlock {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeExpressionBlock);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_block'>,
		public readonly block: ASTNodeBlock,
	) {
		super(start_node, {}, block.children);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		assert.ok(this.block.children.length, 'Expected ASTNodeBlock to contain at least 1 statement.');
		const last_stmt: ASTNodeStatement = this.block.children.at(-1)!;
		/* TODO: For now, all block-expressions must have a type, thus must have a determinant.
		but after #46 (void functions), block-expressions don’t need a determinant and thus may have a “void” type.
		In those cases, instead of throwing errors here, return `null`. */
		if (!(last_stmt instanceof ASTNodeStatementExpression)) {
			throw new Error('The last statement of a block-expression must be an expression-statement.');
		}
		const expr: ASTNodeExpression | undefined = last_stmt.expr;
		if (!expr) {
			throw new Error('The determining expression-statement of a block-expression must be nonempty.');
		}
		return expr.type();
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		/*
		If any statement is not an expression-statement, this block is unfoldable.
		If any expression-statement has an expression and it is unfoldable, this block is unfoldable.
		If any statement (except the last one) is an empty expression-statement, it has no effect on the foldability (inconclusive).
		*/
		for (const stmt of this.block.children.slice(0, -1)) {
			if (!(stmt instanceof ASTNodeStatementExpression)) {
				return null;
			}
			if (!stmt.expr) {
				continue;
			}
			const value: VALUE.Value | null = stmt.expr.fold();
			if (!value) {
				return null;
			}
		}
		/*
		By this point, all statements (except the last) have been foldable or empty expression-statements.
		Based on validations in `.type()`, we can assert that the last statement is a nonempty expression-statement.
		The folded value of this block is the folded value of that expression-statement’s expression, provided it’s foldable.
		If it’s not, then this block is not foldable.
		*/
		return (this.block.children.at(-1) as ASTNodeStatementExpression).expr!.fold();
	}
}
