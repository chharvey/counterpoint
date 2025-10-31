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
import type {ASTNodeBlock} from './index.ts';
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
		private readonly block: ASTNodeBlock,
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
		throw new Error('not yet supported.');
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		throw new Error('not yet supported.');
	}
}
