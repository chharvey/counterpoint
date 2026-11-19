import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
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
		start_node: SyntaxNodeFamily<'expression_switch', ['break', 'return']>,
		public readonly value:    Expression,
		public readonly cases:    readonly Case[],
		public readonly default_: Expression,
	) {
		super(start_node, {}, [value, ...cases, default_]);
	}
}
