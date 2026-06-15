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
import {Operator} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import type {Variable} from './Variable.ts';
import type {Access} from './Access.ts';



export class Isset extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Isset {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Isset);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeFamily<'expression_unary_keyword', ['block', 'break']>,
		public readonly assignee: Variable | Access,
	) {
		super(start_node, {operator: Operator.ISSET}, [assignee]);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const t: TYPE.Type = this.assignee.type();
		if (t.isBottomType) {
			return TYPE.NOTHING;
		}
		return TYPE.BOOL;
	}

	@memoizeMethod
	public override build(_builder: Builder): OP.Unop {
		throw new Error('not yet supported');
	}
}
