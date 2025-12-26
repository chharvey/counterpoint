import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	type VALUE,
	TYPE,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
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
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeExpressionBlock {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeExpressionBlock);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_block'>,
		public readonly block: ASTNodeBlock,
	) {
		super(start_node, {}, [block]);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const block_stmts: binaryen.ExpressionRef[] = [
			...this.block.children.slice(0, -1).map((stmt) => stmt.build()),
			(this.block.children.at(-1) as ASTNodeStatementExpression).expr!.build(),
		];
		return this.builder.module.block(null, block_stmts, binaryen.getExpressionType(block_stmts.at(-1)!));
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		if (this.block.hasBottomType) {
			return TYPE.NOTHING;
		}
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
		return this.block.isFoldable ? (this.block.children.at(-1) as ASTNodeStatementExpression).expr!.fold() : null;
	}
}
