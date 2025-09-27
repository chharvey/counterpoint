import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	build_tuple_like,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {EntryType} from '../../typer/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import {
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {
	assignToDeco,
	ASTNodeCollectionLiteral,
} from './ASTNodeCollectionLiteral.ts';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeTuple);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'tuple_literal'>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return build_tuple_like<ASTNodeExpression>(
			this.children,
			this.builder,
			(expr) => expr.type(),
			(expr) => expr.build(),
		);
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		return TYPE.Tuple.fromTypes(this.children.map((c) => c.type()));
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
		const err = new TypeErrorNotAssignable(this.type(), assignee, this);
		if (assignee instanceof TYPE.Tuple) {
			if (this.children.length < assignee.minCount) {
				throw err;
			}
			assignee.invariants.forEach((entry, i) => { // using `.forEach` to short-circuit
				/* NOTE: We can assert the item exists because of item ordering.
					We cannot do so with records since properties are not ordered. */
				entry.optional || assert.ok(this.children[i], err);
			});
			return xjs.Array.forEachAggregated(this.children, (expr, i) => {
				/* eslint-disable @typescript-eslint/no-unnecessary-condition */
				const thattype: EntryType | undefined = assignee.invariants[i];
				if (thattype) {
					return ASTNodeCP.typeCheckAssign(expr, thattype.type, expr);
				}
				/* eslint-enable @typescript-eslint/no-unnecessary-condition */
			});
		}
		throw err;
	}
}
