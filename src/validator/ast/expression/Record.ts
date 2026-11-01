import * as xjs from 'extrajs';
import {
	type TypeError as CplTypeError,
	TypeErrorNotAssignable,
} from '../../../index.ts';
import {
	type NonemptyArray,
	assert_instanceof,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type {ExprVisitorType} from '../index.ts';
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

	public static assignPropsToRecordType(visitor: ExprVisitorType, properties: readonly Property[], assignee: TYPE.Record, err: CplTypeError): void {
		return xjs.Map.forEachAggregated(assignee.typeargs, (entry, key) => {
			const prop: Property | undefined = properties.find((p) => p.key.id === key);
			/* NOTE: We *cannot* assert the property exists since properties are not ordered.
				We can however make the assertion in tuples because of item ordering. */
			if (!entry.optional && !prop) {
				throw err;
			}
			return prop && typecheck_assign(visitor, prop.val, entry.type, prop);
		});
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

	@assignToDeco
	public override assignTo(visitor: ExprVisitorType, assignee: TYPE.Type): void {
		const err = new TypeErrorNotAssignable(this, assignee);
		if (assignee instanceof TYPE.Record) {
			if (this.children.length < assignee.minCount) {
				throw err;
			}
			return ExpressionRecord.assignPropsToRecordType(visitor, this.children, assignee, err);
		}
		throw err;
	}
}
export {ExpressionRecord as Record};
