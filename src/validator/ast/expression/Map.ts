import * as xjs from 'extrajs';
import {
	type Builder,
	OP,
	TypeErrorNotAssignable,
} from '../../../index.ts';
import {
	type NonemptyArray,
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
import type {Case} from '../Case.ts';
import {Expression} from './Expression.ts';
import {
	assignToDeco,
	Collection,
} from './Collection.ts';



class ExpressionMap extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionMap {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionMap);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'expression_map_literal', ['break']>,
		public override readonly children: Readonly<NonemptyArray<Case>>,
	) {
		super(start_node, children);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.antecedent.type().isBottomType || c.consequent.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Map(
			TYPE.Union.all(...this.children.map((c) => c.antecedent.type())),
			TYPE.Union.all(...this.children.map((c) => c.consequent.type())),
			true,
		);
	}

	@memoizeMethod
	public override build(builder: Builder): OP.MapNew {
		return new OP.MapNew(new Map(this.children.map((c) => [
			c.antecedent.build(builder).asTac(builder),
			c.consequent.build(builder).asTac(builder),
		])), this.type());
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.Map) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg_{ant,con}`
			return xjs.Array.forEachAggregated(this.children, (case_) => (
				xjs.Array.forEachAggregated([case_.antecedent, case_.consequent], (expr, i) => (
					typecheck_assign(expr, [assignee.typearg_ant, assignee.typearg_con][i], expr)
				))
			));
		}
		throw new TypeErrorNotAssignable(this, assignee);
	}
}
export {ExpressionMap as Map};
