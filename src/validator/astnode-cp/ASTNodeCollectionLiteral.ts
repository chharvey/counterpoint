import * as xjs from 'extrajs';
import {TYPE} from '../../index.ts';
import {
	assert_context_name,
	forEither,
} from '../../lib/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeCP} from './ASTNodeCP.ts';
import {ASTNodeExpression} from './ASTNodeExpression.ts';



/**
 * Decorator for {@link ASTNodeCollectionLiteral#assignTo} method and any overrides.
 * Simplifies assignments by handling type operations.
 * @implements MethodDecorator<ASTNodeCollectionLiteral, ASTNodeCollectionLiteral['assignTo']>
 */
export function assignToDeco(
	method:  ASTNodeCollectionLiteral['assignTo'],
	context: ClassMethodDecoratorContext<ASTNodeCollectionLiteral, typeof method>,
): typeof method {
	assert_context_name(context, 'assignTo');
	return function (this: ASTNodeCollectionLiteral, assignee) {
		if (assignee instanceof TYPE.Intersection) {
			/* A value is assignable to a type intersection if and only if
			it is assignable to all operands of that intersection. */
			return xjs.Array.forEachAggregated(assignee.operands, (s) => this.assignTo(s));
		} else if (assignee instanceof TYPE.Union) {
			/* A value is assignable to a type union if and only if
			it is assignable to any operand of that union. */
			return forEither(assignee.operands, (s) => this.assignTo(s));
		} else {
			return method.call(this, assignee);
		}
	};
}



/**
 * Known subclasses:
 * - ASTNodeTuple
 * - ASTNodeRecord
 * - ASTNodeSet
 * - ASTNodeMap
 */
export abstract class ASTNodeCollectionLiteral extends ASTNodeExpression {
	protected constructor(
		start_node:
			| SyntaxNodeType<'tuple_literal'>
			| SyntaxNodeType<'record_literal'>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>,

		children: readonly ASTNodeCP[],
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
