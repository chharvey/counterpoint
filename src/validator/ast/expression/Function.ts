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
import {
	type EntryType,
	TYPE,
} from '../../../typer/index.ts';
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
		return new TYPE.Function(
			new TYPE.Tuple(this.parameters.filter((param) => !param.key).map((param) => ({
				type:     param.typenode.eval(),
				optional: false, // TODO: with optional paramers: `parameter.optional`
			}))),
			new TYPE.Record(new Map<bigint, EntryType>(this.parameters.filter((param) => param.key).map((param) => [
				param.key!.id,
				{
					type:     param.typenode.eval(),
					optional: false, // TODO: with optional paramers: `parameter.optional`
				},
			]))),
		);
	}


	@memoizeMethod
	public override build(_builder: Builder): OP.Value {
		throw new Error('`ExpressionFunction#build` not yet supported.');
	}
}
export {ExpressionFunction as Function};
