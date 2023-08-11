import * as xjs from 'extrajs';
import {
	TYPE,
	type TypeErrorNotAssignable,
} from '../../index.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



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
				it is assignable to both operands of that intersection. */
				return xjs.Array.forEachAggregated<() => void>([
					() => this.assignTo(assignee.left,  err),
					() => this.assignTo(assignee.right, err),
				], (callback) => callback.call(null));
			} else if (assignee instanceof TYPE.TypeUnion) {
				/* A value is assignable to a type union if and only if
				it is assignable to either operand of that union. */
				try {
					return this.assignTo(assignee.left, err);
				} catch {
					return this.assignTo(assignee.right, err);
				}
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
