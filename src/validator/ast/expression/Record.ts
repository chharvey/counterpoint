import * as xjs from 'extrajs';
import {TypeErrorNotAssignable} from '../../../index.ts';
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
import {check_unique_keys} from '../utils-private.ts';
import {typecheck_assign} from '../AstNode.ts';
import type {Property} from '../Property.ts';
import {Expression} from './Expression.ts';
import {
	assignToDeco,
	Collection,
} from './Collection.ts';



class ExpressionRecord extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionRecord {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionRecord);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'expression_record_literal', ['break', 'return']>,
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
		return TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>(this.children.map((c) => [
			c.key.id,
			c.val.type(),
		])));
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		const err = new TypeErrorNotAssignable(this, assignee);
		if (assignee instanceof TYPE.Record) {
			if (this.children.length < assignee.minCount) {
				throw err;
			}
			return xjs.Map.forEachAggregated(assignee.typeargs, (entry, key) => {
				const prop: Property | undefined = this.children.find((p) => p.key.id === key);
				/* NOTE: We *cannot* assert the property exists since properties are not ordered.
					We can however make the assertion in tuples because of item ordering. */
				if (!entry.optional && !prop) {
					throw err;
				}
				return prop && typecheck_assign(prop.val, entry.type, prop);
			});
		}
		throw err;
	}
}
export {ExpressionRecord as Record};
