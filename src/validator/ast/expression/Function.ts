import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {Functionlike} from '../Functionlike.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Capture} from '../Capture.ts';
import type {Block} from '../Block.ts';
import type * as AST_TYPE from '../type/index.ts';
import {Expression} from './Expression.ts';



class ExpressionFunction extends Expression implements Functionlike {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionFunction {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionFunction);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_function'>,
		public readonly parameters: readonly ParameterFunction[],
		public readonly captures:   readonly Capture[],
		public readonly returnType: AST_TYPE.Type | null,
		public readonly block:      Block,
	) {
		super(start_node, {}, [...parameters, ...captures, ...(returnType ? [returnType] : []), block]);
	}
}
export {ExpressionFunction as Function};
