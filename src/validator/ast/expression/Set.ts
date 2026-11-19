import * as xjs from 'extrajs';
import {TypeErrorNotAssignable} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type {ExprVisitorType} from '../index.ts';
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
		start_node: SyntaxNodeFamily<'expression_set_literal', ['break', 'return']>,
		public override readonly children: readonly Expression[],
	) {
		super(start_node, children);
	}

	@assignToDeco
	public override assignTo(visitor: ExprVisitorType, assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.Set) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg`
			return xjs.Array.forEachAggregated(this.children, (expr) => typecheck_assign(visitor, expr, assignee.typearg, expr));
		}
		throw new TypeErrorNotAssignable(this, assignee);
	}
}
export {ExpressionSet as Set};
