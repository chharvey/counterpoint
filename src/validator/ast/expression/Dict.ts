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
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {check_unique_keys} from '../utils-private.ts';
import {typecheck_assign} from '../AstNode.ts';
import type {Property} from '../Property.ts';
import {Expression} from './Expression.ts';
import {
	assignToDeco,
	Collection,
} from './Collection.ts';



export class Dict extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Dict {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Dict);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'expression_dict_literal', ['break', 'return']>,
		public override readonly children: Readonly<NonemptyArray<Property>>,
	) {
		super(start_node, children);
	}

	public override varCheck(): void {
		check_unique_keys(this.children.map((prop) => prop.key));
		return super.varCheck();
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.val.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Dict(
			TYPE.Union.all(...this.children.map((c) => c.val.type())),
			true,
		);
	}

	@memoizeMethod
	public override build(builder: Builder): OP.DictNew {
		return new OP.DictNew(new Map(this.children.map((c) => [
			new VALUE.Symbol(c.key.id, c.key.source),
			c.val.build(builder).asTac(builder),
		])), this.type());
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.Dict) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg`
			return xjs.Array.forEachAggregated(this.children, (prop) => typecheck_assign(prop.val, assignee.typearg, prop));
		}
		throw new TypeErrorNotAssignable(this, assignee);
	}
}
