import * as xjs from 'extrajs';
import {
	TYPE,
	type TypeErrorNotAssignable,
} from '../../index.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



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
 * Known subclasses:
 * - ASTNodeSet
 * - ASTNodeMap
 */
export abstract class ASTNodeCollectionLiteralMutable extends ASTNodeCollectionLiteral {
	/**
	 * Decorator for {@link ASTNodeCollectionLiteralMutable#assignTo} method and any overrides.
	 * Simplifies assignments by handling type operations.
	 * @implements MethodDecorator<ASTNodeCollectionLiteralMutable, ASTNodeCollectionLiteralMutable['assignTo']>
	 */
	protected static assignToDeco(
		method:   ASTNodeCollectionLiteralMutable['assignTo'],
		_context: ClassMethodDecoratorContext<ASTNodeCollectionLiteralMutable, typeof method>,
	): typeof method {
		return function (this: ASTNodeCollectionLiteralMutable, assignee, err) {
			if (assignee instanceof TYPE.TypeIntersection) {
				/* A value is assignable to a type intersection if and only if
				it is assignable to all operands of that intersection. */
				return xjs.Array.forEachAggregated(assignee.operands, (s) => this.assignTo(s, err));
			} else if (assignee instanceof TYPE.TypeUnion) {
				/* A value is assignable to a type union if and only if
				it is assignable to any operand of that union. */
				return forEither(assignee.operands, (s) => this.assignTo(s, err));
			} else {
				return method.call(this, assignee, err);
			}
		};
	}


	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign mutable collection literals, we want to check entry by entry.
	 * @param  assignee                 the type to assign to
	 * @param  err                      the original error, to be thrown if any further assignment fails
	 * @throws {TypeErrorNotAssignable} if this node is not assignable to the assignee
	 */
	public abstract assignTo(assignee: TYPE.Type, err: TypeErrorNotAssignable): void;
}
