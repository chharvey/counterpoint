import * as xjs from 'extrajs';
import {assert_context_name} from '../../../lib/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type {AstNode} from '../AstNode.ts';
import {Expression} from './Expression.ts';



/**
 * Decorator for {@link Collection#assignTo} method and any overrides.
 * Simplifies assignments by handling type operations.
 * @implements MethodDecorator<Collection, Collection['assignTo']>
 */
export function assignToDeco(
	method:  Collection['assignTo'],
	context: ClassMethodDecoratorContext<Collection, typeof method>,
): typeof method {
	assert_context_name(context, 'assignTo');
	return function (this: Collection, assignee) {
		if (assignee instanceof TYPE.Intersection) {
			/* A value is assignable to a type intersection if and only if
			it is assignable to all operands of that intersection. */
			return xjs.Array.forEachAggregated(assignee.operands, (s) => this.assignTo(s));
		} else if (assignee instanceof TYPE.Union) {
			/* A value is assignable to a type union if and only if
			it is assignable to any operand of that union. */
			return xjs.Array.forEither(assignee.operands, (s) => this.assignTo(s));
		} else {
			return method.call(this, assignee);
		}
	};
}



/**
 * Known subclasses:
 * - ExpressionTuple
 * - ExpressionRecord
 * - List
 * - Dict
 * - ExpressionSet
 * - ExpressionMap
 */
export abstract class Collection extends Expression {
	protected constructor(
		start_node:
			| SyntaxNodeFamily<'expression_tuple_literal',  ['break']>
			| SyntaxNodeFamily<'expression_record_literal', ['break']>
			| SyntaxNodeFamily<'expression_list_literal',   ['break']>
			| SyntaxNodeFamily<'expression_dict_literal',   ['break']>
			| SyntaxNodeFamily<'expression_set_literal',    ['break']>
			| SyntaxNodeFamily<'expression_map_literal',    ['break']>,

		children: readonly AstNode[],
	) {
		super(start_node, {}, children);
	}

	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign collection literals, we want to check entry by entry if typechecking fails.
	 *
	 * Note that this method must be present for Tuple and Record nodes (even though they are immutable),
	 * because we want to ensure it applies for any nested types.
	 * @param  assignee                 the type to assign to
	 * @throws {TypeErrorNotAssignable} if this node is not assignable to the assignee
	 */
	public abstract assignTo(assignee: TYPE.Type): void;
}
