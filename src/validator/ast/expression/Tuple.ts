import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {TypeErrorNotAssignable} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
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

	public static assignExprsToTupleType(expressions: readonly Expression[], assignee: TYPE.Tuple): void {
		assignee.typeargs.forEach((entry, i) => { // using `Array#forEach` instead of `xjs.Array.forEachAggregated` to short-circuit
			/* NOTE: We can assert the item exists because of item ordering.
				We cannot do so with records since properties are not ordered. */
			entry.optional || assert.ok(expressions[i]);
		});
		return xjs.Array.forEachAggregated(expressions, (expr, i) => {
			const thatentry: EntryType | undefined = assignee.typeargs.at(i);
			return thatentry && typecheck_assign(expr, thatentry.type, expr);
		});
	}


	public constructor(
		start_node: SyntaxNodeFamily<'expression_tuple_literal', ['break', 'return']>,
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

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		const err = new TypeErrorNotAssignable(this, assignee);
		if (assignee instanceof TYPE.Tuple) {
			if (this.children.length < assignee.minCount) {
				throw err;
			}
			return ExpressionTuple.assignExprsToTupleType(this.children, assignee);
		}
		throw err;
	}
}
export {ExpressionTuple as Tuple};
