import type {
	Builder,
	OP,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Block} from '../Block.ts';
import {Expression} from './Expression.ts';



class ExpressionFunction extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionFunction {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionFunction);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_function'>,
		public readonly parameters: readonly ParameterFunction[],
		public readonly block:      Block,
	) {
		super(start_node, {}, [...parameters, block]);
	}


	@memoizeMethod
	public override type(): TYPE.Type {
		throw new Error('`ExpressionFunction#type` not yet supported.');
	}


	@memoizeMethod
	public override build(_builder: Builder): OP.Value {
		throw new Error('`ExpressionFunction#build` not yet supported.');
	}
}
export {ExpressionFunction as Function};
