import {
	type Builder,
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
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {Expression} from './Expression.ts';
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
	public override type(): TYPE.Type {
		return TYPE.STR;
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Template {
		return new OP.Template(this.children.map((c) => {
			const build: OP.ValueTac = c.build(builder).asTac(builder);
			return c.type().isSubtypeOf(TYPE.STR)
				? build
				: new OP.Unop(OP.OpCode.STR_FROM, build, TYPE.STR).asTac(builder);
		}));
	}
}
