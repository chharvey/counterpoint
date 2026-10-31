import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {Block} from '../Block.ts';
import {Expression} from './Expression.ts';



export class ExpressionBlock extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionBlock {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionBlock);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_block'>,
		public readonly block: Block,
	) {
		super(start_node, {}, [block]);
	}
}
