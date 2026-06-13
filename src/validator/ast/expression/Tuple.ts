import * as assert from 'node:assert';
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
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {EntryType} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {typecheck_assign} from '../AstNode.ts';
import {Expression} from './Expression.ts';
import {
	assignToDeco,
	Collection,
} from './Collection.ts';



class ExpressionTuple extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionTuple {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionTuple);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'expression_tuple_literal', ['break']>,
		public override readonly children: readonly Expression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return TYPE.Tuple.fromTypes(this.children.map((c) => c.type()));
	}

	@memoizeMethod
	public build(builder: Builder): OP.CollectionLinearNew {
		return new OP.CollectionLinearNew(OP.TypeName.TUPLE, this.children.map((c) => c.build(builder).asTac(builder)), this.type());
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const items: readonly (VALUE.Value | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new VALUE.Tuple(items as VALUE.Value[]);
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		const err = new TypeErrorNotAssignable(this, assignee);
		if (assignee instanceof TYPE.Tuple) {
			if (this.children.length < assignee.minCount) {
				throw err;
			}
			assignee.typeargs.forEach((entry, i) => { // using `Array#forEach` instead of `xjs.Array.forEach` to short-circuit
				/* NOTE: We can assert the item exists because of item ordering.
					We cannot do so with records since properties are not ordered. */
				entry.optional || assert.ok(this.children[i], err);
			});
			return xjs.Array.forEachAggregated(this.children, (expr, i) => {
				const thattype: EntryType | undefined = assignee.typeargs.at(i);
				if (thattype) {
					return typecheck_assign(expr, thattype.type, expr);
				}
			});
		}
		throw err;
	}
}
export {ExpressionTuple as Tuple};
