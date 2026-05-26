import * as xjs from 'extrajs';
import {
	type Optimizer,
	IR,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {typecheck_assign} from './AstNode.ts';
import {Expression} from './Expression.ts';
import {
	assignToDeco,
	CollectionLiteral,
} from './CollectionLiteral.ts';



export class List extends CollectionLiteral {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): List {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, List);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'list_literal', ['break']>,
		public override readonly children: readonly Expression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.List(
			TYPE.Union.all(...this.children.map((c) => c.type())),
			true,
		);
	}

	@memoizeMethod
	public override build(optimizer: Optimizer): IR.CollectionLinearNew {
		return new IR.CollectionLinearNew(IR.TypeName.LIST, this.children.map((c) => c.build(optimizer).asTac(optimizer)), this.type());
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const items: readonly (VALUE.Value | null)[] = this.children.map((c) => c.fold());
		return items.includes(null)
			? null
			: new VALUE.List(items as VALUE.Value[]);
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.List) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg`
			return xjs.Array.forEachAggregated(this.children, (expr) => typecheck_assign(expr, assignee.typearg, expr));
		}
		throw new TypeErrorNotAssignable(this, assignee);
	}
}
