import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type * as AST_TYPE from '../type/index.ts';
import type {Property} from '../Property.ts';
import {Expression} from './Expression.ts';



export class Call extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Call {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Call);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_compound'>,
		public readonly base:          Expression,
		public readonly typeargs:      readonly AST_TYPE.Type[],
		public readonly exprargsPosit: readonly Expression[],
		public readonly exprargsNamed: readonly Property[],
	) {
		super(start_node, {}, [base, ...typeargs, ...exprargsPosit, ...exprargsNamed]);
	}
}
