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
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type {Case} from '../Case.ts';
import {Expression} from './Expression.ts';



export class Switch extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Switch {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Switch);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'expression_switch', ['break']>,
		private readonly value:    Expression,
		private readonly cases:    readonly Case[],
		private readonly default_: Expression,
	) {
		super(start_node, {}, [value, ...cases, default_]);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		return this.value.type().isBottomType
			? TYPE.NOTHING
			: TYPE.Union.all(...this.cases.map((kase) => {
				kase.antecedents.forEach((ant) => { ant.type(); }); // rethrow any type-errors
				return kase.consequent.type();
			}), this.default_.type());
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Get {
		builder;
		throw new Error('Build(SemanticExpressionSwitch) not yet supported.');
	}
}
