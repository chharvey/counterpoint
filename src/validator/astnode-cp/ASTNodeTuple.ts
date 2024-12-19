import * as assert from 'assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type TypeErrorNotAssignable,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {TypeEntry} from '../../typer/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {
	buildDeco,
	typeDeco,
	assignToDeco,
} from './decorators.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



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
		return this.builder.module.tuple.make(this.children.map((expr) => expr.build()));
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		const items: readonly TYPE.Type[] = this.children.map((c) => {
			const itemtype: TYPE.Type = c.type();
			return itemtype;
		});
		return TYPE.TypeTuple.fromTypes(items);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const items: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new OBJ.Tuple(items as OBJ.Object[]);
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type, err: TypeErrorNotAssignable): void {
		if (assignee instanceof TYPE.TypeTuple) {
			if (this.children.length < assignee.count[0]) {
				throw err;
			}
			assignee.invariants.forEach((entry, i) => { // using `.forEach` to short-circuit
				/* NOTE: We can assert the item exists because of item ordering.
					We cannot do so with records since properties are not ordered. */
				entry.optional || assert.ok(this.children[i], err);
			});
			return xjs.Array.forEachAggregated(this.children, (expr, i) => {
				/* eslint-disable @typescript-eslint/no-unnecessary-condition */
				const thattype: TypeEntry | undefined = assignee.invariants[i];
				if (thattype) {
					return ASTNodeCP.assignExpression(expr, thattype.type, expr);
				}
				/* eslint-enable @typescript-eslint/no-unnecessary-condition */
			});
		}
		throw err;
	}
}
