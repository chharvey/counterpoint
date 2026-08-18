import * as xjs from 'extrajs';
import {
	type Builder,
	OP,
	TypeErrorNotAssignable,
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
import {typecheck_assign} from '../AstNode.ts';
import {Expression} from './Expression.ts';
import {
	assignToDeco,
	Collection,
} from './Collection.ts';



class ExpressionSet extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionSet {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionSet);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'expression_set_literal', ['break']>,
		public override readonly children: readonly Expression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Set(
			TYPE.Union.all(...this.children.map((c) => c.type())),
			true,
		);
	}

	@memoizeMethod
	public override build(builder: Builder): OP.CollectionLinearNew {
		return new OP.CollectionLinearNew(OP.TypeName.SET, this.children.map((c) => c.build(builder).asTac(builder)), this.type());
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.Set) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg`
			return xjs.Array.forEachAggregated(this.children, (expr) => typecheck_assign(expr, assignee.typearg, expr));
		}
		throw new TypeErrorNotAssignable(this, assignee);
	}
}
export {ExpressionSet as Set};
