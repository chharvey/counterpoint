import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {TYPE} from '../../index.js';
import {
	assert_context_name,
	memoizeMethod,
} from '../../lib/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeCP} from './ASTNodeCP.js';
import {
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.js';



/**
 * Executes a callback on each item of an array until that callback returns.
 * If the callback throws, the error is saved, and execution proceeds to the next iteration.
 * If any iteration returns, this method returns and the errors are discarded.
 * If all iterations throw, the errors are collected into a single AggregateError, which is then thrown.
 *
 * The “dual” of {@link Array#forEach} — this method returns as soon as a callback call is successful; otherwise throws.
 *
 * Similar to {@link Promise.any}, but synchronous.
 *
 * @typeparam T                the type of items in the array
 * @param     array            the array of items
 * @param     callback         the function to call on each item
 * @throws    {AggregateError} if two or more iterations throws an error
 * @throws    {Error}          if one iteration throws an error
 */
function forEither<T>(array: readonly T[], callback: (item: T, i: number, src: readonly T[]) => void): void {
	const thrown: Error[] = [];
	try {
		array.forEach((it, i, src) => {
			try {
				callback.call(null, it, i, src);
			} catch (e) {
				thrown.push(e as Error);
				return;
			}
			throw 'success';
		});
	} catch {
		return;
	}
	throw (
		thrown.length >= 2 ? new AggregateError(thrown) :
		thrown.length      ? thrown[0] :
		new Error('An unexpected error occurred.')
	);
}



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
			| SyntaxNodeType<'map_literal'>
		,
		public override readonly children: readonly ASTNodeCP[],
	) {
		super(start_node, {}, children);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw '`ASTNodeCollectionLiteral#build_do` not yet supported.';
	}

	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign collection literals, we want to check entry by entry if typechecking fails.
	 * @param  assignee                 the type to assign to
	 * @throws {TypeErrorNotAssignable} if this node is not assignable to the assignee
	 */
	public abstract assignTo(assignee: TYPE.Type): void;
}
