import type binaryen from 'binaryen';
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
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {
	buildDeco,
	typeDeco,
	Expression,
} from './Expression.ts';
import type {Constant} from './Constant.ts';



export class Template extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Template {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Template);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'string_template', ['break']>,
		public override readonly children: // FIXME spread types
			| readonly [Constant]
			| readonly [Constant,                                             Constant]
			| readonly [Constant, Expression,                                 Constant]
			// | readonly [Constant,             ...TemplatePartialChildrenType, Constant]
			// | readonly [Constant, Expression, ...TemplatePartialChildrenType, Constant]
			| readonly Expression[],
	) {
		super(start_node, {}, children);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`Template#build` not yet supported.');
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		return TYPE.STR;
	}

	@memoizeMethod
	public override fold(): VALUE.String | null {
		const values: readonly (VALUE.Value | null)[] = [...this.children].map((expr) => expr.fold());
		return (values.includes(null))
			? null
			: (values as readonly VALUE.Value[])
				.map((value) => value.toCPString())
				.reduce((a, b) => a.concatenate(b));
	}
}
